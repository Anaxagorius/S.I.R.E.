/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-04-14
 * Description: Trainee interface screen for interacting with scenario-based decision nodes.
 * Dynamically loads the scenario from the backend based on the session's scenario key,
 * or uses bundled scenario data passed directly in navigation state (demo mode).
 * Displays the current scenario, question, and selectable options.
 * Receives live timeline events and admin-injected events from the backend via Socket.IO (live sessions only).
 * Emits event:log socket events when the trainee selects an option so the admin
 * can monitor trainee decisions in real time.
 *
 * Session state is read from React Router navigation state first, then falls back to
 * sessionStorage (populated by JoinSession) so the scenario survives a page refresh.
 *
 * Features: live elapsed timer, scoring (+10 per correct decision), inline feedback
 * overlay, decision history, scenario-complete card on terminal nodes, and reference
 * documents linked to the current scenario.
 */

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import TraineeInterfaceLayout from "../../layouts/TraineeInterfaceLayout";
import BackButton from "../../components/BackButton";
import apiClient from "../../services/api/apiClient";
import { getDocuments } from "../../services/api/api";
import { SOCKET_URL, SOCKET_API_KEY } from "../../services/socketConfig";

/** Read a value from sessionStorage safely (returns null if unavailable). */
function readSessionStorage(key) {
    try {
        return sessionStorage.getItem(key) || null;
    } catch {
        return null;
    }
}

/** Format elapsed seconds as MM:SS. */
function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

/** Format a simulated incident offset in seconds as a human-readable string (e.g. "1h 30m" or "45m"). */
function formatSimOffset(secs) {
    if (secs == null || secs < 0) return null;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

/** Function that returns the TraineeInterface component. */
export default function TraineeInterface() {

    const location = useLocation();
    const navigate = useNavigate();

    /**
     * Resolve session code, scenario key, and display name from navigation state first,
     * then fall back to sessionStorage so the scenario survives a page refresh.
     */
    const sessionCode =
        location.state?.sessionCode ||
        readSessionStorage("sire_sessionCode") ||
        null;

    const scenarioKey =
        location.state?.scenarioKey ||
        readSessionStorage("sire_scenarioKey") ||
        null;

    const displayName =
        location.state?.displayName ||
        readSessionStorage("sire_displayName") ||
        "Trainee";

    const role =
        location.state?.role ||
        readSessionStorage("sire_role") ||
        null;

    /**
     * When running in demo mode the full scenario data is passed directly in
     * navigation state, so no backend fetch is required.
     */
    const demoScenarioData = location.state?.scenarioData || null;
    const isDemo = Boolean(location.state?.demo);

    /** Scenario data loaded from the backend (or pre-populated in demo mode). */
    const [scenarioData, setScenarioData] = useState(demoScenarioData);
    const [loadError, setLoadError] = useState(
        demoScenarioData ? null : (scenarioKey ? null : "No scenario selected. Please join a session first.")
    );

    /** Constant for tracking current node state. Initialised from demo data when available. */
    const [currentNodeId, setCurrentNodeId] = useState(demoScenarioData?.root || null);

    /** Elapsed session time in seconds — starts when scenario data is first loaded. */
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timerStartedRef = useRef(false);

    /** Running score for this session (+10 per correct decision). */
    const [score, setScore] = useState(0);

    /**
     * History of decisions made: { nodeId, nodeTitle, optionText, isCorrect, points, timestamp }.
     * Used for the decision history panel and the scenario-complete summary.
     */
    const [decisions, setDecisions] = useState([]);

    /**
     * Inline feedback shown after each option selection.
     * null when no feedback is visible; otherwise { type, text, points, nextTarget }.
     */
    const [feedback, setFeedback] = useState(null);

    /** Live timeline events injected by the admin during the session. */
    const [timelineEvents, setTimelineEvents] = useState([]);

    /** Injects delivered via the email channel — shown in a separate inbox panel. */
    const [emailInbox, setEmailInbox] = useState([]);

    /** Injects pending approval by this participant's role. */
    const [pendingApprovals, setPendingApprovals] = useState([]);

    /** Action items captured during this session. */
    const [actionItems, setActionItems] = useState([]);

    /** State for the action item submission form. */
    const [actionText, setActionText] = useState("");
    const [actionAssignedTo, setActionAssignedTo] = useState("");

    /** Reference documents linked to this scenario (from document library). */
    const [referenceDocs, setReferenceDocs] = useState([]);

    /** Options for the current node, shuffled so the correct answer is not always first. */
    const [shuffledOptions, setShuffledOptions] = useState([]);

    /** Ref to persist the socket across renders. */
    const socketRef = useRef(null);

    /** Wall-clock timestamp (ms) when the current node was first presented — for time-to-decision KPI. */
    const nodeStartedAtRef = useRef(null);

    /** Highest simulated incident timeline offset seen (in seconds) — for real vs simulated time display. */
    const [maxSimOffsetSec, setMaxSimOffsetSec] = useState(null);

    /** Shuffle options whenever the current node changes so the correct answer is not always first.
     *  Also records the wall-clock time the node was first presented for time-to-decision tracking. */
    useEffect(() => {
        nodeStartedAtRef.current = Date.now();
        const options = scenarioData?.nodes?.[currentNodeId]?.options || [];
        const arr = [...options];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        // Reassign labels based on shuffled position so the letter always matches the displayed position.
        setShuffledOptions(arr.map((opt, i) => ({ ...opt, label: String.fromCharCode(65 + i) })));
    }, [currentNodeId, scenarioData]);

    /** Start the elapsed timer once scenario data is first available. */
    useEffect(() => {
        if (!scenarioData || timerStartedRef.current) return;
        timerStartedRef.current = true;
        const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
        return () => clearInterval(id);
    }, [scenarioData]);

    /** Fetch reference documents linked to this scenario from the document library. */
    useEffect(() => {
        if (!scenarioKey || isDemo) return;
        let cancelled = false;
        getDocuments(scenarioKey).then((docs) => {
            if (!cancelled) setReferenceDocs(docs || []);
        }).catch(() => {
            // Reference docs are optional — silently ignore errors
        });
        return () => { cancelled = true; };
    }, [scenarioKey, isDemo]);

    /** Load scenario data from backend and connect to socket. Skip entirely in demo mode. */
    useEffect(() => {
        /** Demo mode: scenario data and root node already initialised — nothing to fetch. */
        if (isDemo && demoScenarioData) {
            return;
        }

        if (!scenarioKey) return;

        let cancelled = false;

        async function loadScenario() {
            try {
                const data = await apiClient.get(`/scenarios/${scenarioKey}`);
                if (cancelled) return;
                if (!data || !data.root || !data.nodes) {
                    setLoadError("Scenario data is incomplete. Please contact the administrator.");
                    return;
                }
                setScenarioData(data);
                setCurrentNodeId(data.root);
            } catch (err) {
                if (!cancelled) {
                    console.error("Failed to load scenario:", err);
                    setLoadError("Failed to load scenario. Please contact the administrator.");
                }
            }
        }

        loadScenario();

        /** Connect to Socket.IO /sim namespace as a trainee when a session code is available. */
        let socket = null;
        if (sessionCode) {
            socket = io(`${SOCKET_URL}/sim`, {
                auth: SOCKET_API_KEY ? { apiKey: SOCKET_API_KEY } : {},
                transports: ["websocket", "polling"],
            });

            socketRef.current = socket;

            socket.on("connect", () => {
                socket.emit("session:join", { sessionCode, displayName, role });
            });

            socket.on("timeline:tick", (payload) => {
                setTimelineEvents((prev) => [
                    ...prev,
                    { title: payload.title, description: payload.description, time: new Date().toLocaleTimeString(), simOffsetSec: payload.timeOffsetSec },
                ]);
                if (typeof payload.timeOffsetSec === "number") {
                    setMaxSimOffsetSec((prev) => (prev === null || payload.timeOffsetSec > prev) ? payload.timeOffsetSec : prev);
                }
            });

            socket.on("event:log:broadcast", (payload) => {
                if (payload.actorRole !== "admin") return;
                // Filter by role if the inject targets a specific role
                if (payload.roleFilter && payload.roleFilter !== role) return;

                const eventEntry = {
                    title: `[${payload.rationale?.toUpperCase() ?? "INFO"}] Instructor`,
                    description: payload.action,
                    time: new Date().toLocaleTimeString(),
                    channel: payload.channel || "in-app",
                    pressureType: payload.pressureType || null,
                    injectId: payload.injectId || null,
                    acknowledged: false,
                };

                if (payload.channel === "email") {
                    setEmailInbox((prev) => [...prev, eventEntry]);
                } else {
                    setTimelineEvents((prev) => [...prev, eventEntry]);
                }
            });

            socket.on("inject:approval:pending", (payload) => {
                // Only show if this participant's role matches the required approval role
                if (payload.approvalRole && payload.approvalRole !== role) return;
                setPendingApprovals((prev) => {
                    if (prev.some(p => p.injectId === payload.injectId)) return prev;
                    return [...prev, {
                        injectId: payload.injectId,
                        message: payload.message,
                        severity: payload.severity,
                        channel: payload.channel,
                        pressureType: payload.pressureType,
                        approvalRole: payload.approvalRole,
                    }];
                });
            });

            socket.on("inject:approval:granted", (payload) => {
                // Clear the approval request once granted
                setPendingApprovals((prev) => prev.filter(p => p.injectId !== payload.injectId));
            });

            socket.on("action:item:broadcast", (payload) => {
                if (payload.item) {
                    setActionItems((prev) => [...prev, payload.item]);
                }
            });

            socket.on("session:roster:updated", (payload) => {
                // If admin updates our role, persist it in sessionStorage
                if (payload.roster) {
                    const me = payload.roster.find(t => t.displayName === displayName);
                    if (me?.role) {
                        try { sessionStorage.setItem("sire_role", me.role); } catch { /* ignore */ }
                    }
                }
            });
        }

        return () => {
            cancelled = true;
            if (socket) socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scenarioKey, sessionCode, isDemo, demoScenarioData]);

    /** Submit an action item during the exercise. */
    function handleSubmitActionItem() {
        if (!actionText.trim() || !socketRef.current || !sessionCode || isDemo) return;
        socketRef.current.emit("session:action:capture", {
            sessionCode,
            text: actionText.trim(),
            capturedBy: displayName,
            role: role || null,
            assignedTo: actionAssignedTo || null,
        });
        setActionText("");
        setActionAssignedTo("");
    }

    /** Acknowledge a released inject (marks it as read). */
    function handleAcknowledgeInject(injectId, isEmail) {
        if (!socketRef.current || !sessionCode || isDemo) return;
        socketRef.current.emit("inject:acknowledge", {
            sessionCode,
            injectId,
            displayName,
            role: role || null,
        });
        // Optimistically mark as acknowledged in local state
        if (isEmail) {
            setEmailInbox((prev) => prev.map(e => e.injectId === injectId ? { ...e, acknowledged: true } : e));
        } else {
            setTimelineEvents((prev) => prev.map(e => e.injectId === injectId ? { ...e, acknowledged: true } : e));
        }
    }

    /** Approve a pending inject (role-based approval workflow). */
    function handleApproveInject(injectId) {
        if (!socketRef.current || !sessionCode || isDemo) return;
        socketRef.current.emit("inject:approval:grant", {
            sessionCode,
            injectId,
            approverDisplayName: displayName,
            approverRole: role || null,
        });
    }

    /** Function that handles option selection. */
    function handleOptionClick(option) {
        const outcome = option?.outcome;
        if (!outcome) return;

        const currentNode = scenarioData.nodes[currentNodeId];
        const decisionTimeMs = nodeStartedAtRef.current != null ? Date.now() - nodeStartedAtRef.current : undefined;

        if (outcome.type === "node") {
            const points = 10;
            const newScore = score + points;
            setScore(newScore);
            setDecisions((prev) => [
                ...prev,
                {
                    nodeId: currentNodeId,
                    nodeTitle: currentNode?.title || currentNodeId,
                    optionText: option.text,
                    isCorrect: true,
                    points,
                    timestamp: new Date().toLocaleTimeString(),
                },
            ]);

            /** Emit event:log so the admin can see this decision in the live event feed. */
            if (socketRef.current && sessionCode && !isDemo) {
                socketRef.current.emit("event:log", {
                    sessionCode,
                    action: `${option.label ? `[${option.label}] ` : ""}${option.text}`,
                    rationale: null,
                    displayName,
                    role: role || undefined,
                    score: newScore,
                    isCorrect: true,
                    decisionTimeMs,
                });
            }

            setFeedback({
                type: "correct",
                text: "Correct decision! +10 points",
                points,
                nextTarget: outcome.target,
            });

        } else if (outcome.type === "failure") {
            setDecisions((prev) => [
                ...prev,
                {
                    nodeId: currentNodeId,
                    nodeTitle: currentNode?.title || currentNodeId,
                    optionText: option.text,
                    isCorrect: false,
                    points: 0,
                    timestamp: new Date().toLocaleTimeString(),
                },
            ]);

            /** Emit event:log for failed outcomes so the admin sees the incorrect choice. */
            if (socketRef.current && sessionCode && !isDemo) {
                socketRef.current.emit("event:log", {
                    sessionCode,
                    action: `${option.label ? `[${option.label}] ` : ""}${option.text}`,
                    rationale: null,
                    displayName,
                    role: role || undefined,
                    score,
                    isCorrect: false,
                    decisionTimeMs,
                });
            }

            setFeedback({
                type: "failure",
                text: "Incorrect. Review the correct procedure and try again.",
                points: 0,
                nextTarget: null,
            });
        }
    }

    /** Derived formatted time string for display. */
    const time = formatTime(elapsedSeconds);
    /** Simulated incident time string (null when no timeline events have fired). */
    const simTime = formatSimOffset(maxSimOffsetSec);

    /** Show error state if scenario couldn't be loaded. */
    if (loadError) {
        return (
            <TraineeInterfaceLayout time={time} score={score} decisions={decisions} simTime={simTime}>
                <BackButton to="/join-session" />
                <div className="scenario-card">
                    <h2>Unable to Load Scenario</h2>
                    <p>{loadError}</p>
                </div>
            </TraineeInterfaceLayout>
        );
    }

    /** Show loading state while scenario data is being fetched. */
    if (!scenarioData || !currentNodeId) {
        return (
            <TraineeInterfaceLayout time={time} score={score} decisions={decisions} simTime={simTime}>
                <div className="scenario-card">
                    <h2>Loading Scenario...</h2>
                    <p>Please wait while the scenario is being loaded.</p>
                </div>
            </TraineeInterfaceLayout>
        );
    }

    const currentNode = scenarioData.nodes[currentNodeId];

    /** Guard against a missing or invalid node reference in the scenario definition. */
    if (!currentNode) {
        return (
            <TraineeInterfaceLayout time={time} score={score} decisions={decisions} simTime={simTime}>
                <div className="scenario-card">
                    <h2>Scenario Error</h2>
                    <p>An unexpected error occurred: node &quot;{currentNodeId}&quot; was not found in the scenario. Please contact the administrator.</p>
                </div>
            </TraineeInterfaceLayout>
        );
    }

    /** Calculate max possible score from all non-terminal nodes in the scenario. */
    const maxPossibleScore = Object.values(scenarioData.nodes).filter(
        (n) => n.options && n.options.length > 0
    ).length * 10;

    /** Terminal node — show scenario-complete card instead of options. */
    if (currentNode.options.length === 0) {
        return (
            <TraineeInterfaceLayout time={time} score={score} decisions={decisions} simTime={simTime}>
                {role && (
                    <div className="scenario-card" style={{ padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ opacity: 0.7, fontSize: "0.8rem" }}>Your role:</span>
                        <span className="role-badge">{role}</span>
                    </div>
                )}
                {timelineEvents.length > 0 && (
                    <div className="scenario-card">
                        <h3>Live Updates</h3>
                        {timelineEvents.map((evt, i) => (
                            <div key={i} className={`inject-event-row${evt.pressureType ? ` pressure-${evt.pressureType}` : ""}`}>
                                <div className="inject-event-header">
                                    <strong>[{evt.time}] {evt.title}</strong>
                                    {evt.pressureType === "media" && <span className="inject-pressure-badge media">📰 Media</span>}
                                    {evt.pressureType === "regulator" && <span className="inject-pressure-badge regulator">🏛️ Regulator</span>}
                                    {evt.pressureType === "customer" && <span className="inject-pressure-badge customer">👤 Customer</span>}
                                </div>
                                <p className="inject-event-body">{evt.description}</p>
                            </div>
                        ))}
                    </div>
                )}
                <div className="scenario-complete-card">
                    <div className="scenario-complete-icon">✅</div>
                    <h2>Scenario Complete!</h2>
                    <p>{currentNode.situation}</p>
                    <div className="scenario-complete-score">
                        Your Score: {score} / {maxPossibleScore}
                    </div>
                    <p>Decisions Made: {decisions.length}</p>
                    {actionItems.length > 0 && (
                        <div style={{ textAlign: "left", marginTop: "1rem" }}>
                            <h4>Action Items Captured</h4>
                            <ul style={{ listStyle: "none", padding: 0, fontSize: "0.82rem" }}>
                                {actionItems.map((item, i) => (
                                    <li key={item.id || i} style={{ padding: "0.25rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                        <strong>{item.capturedBy}</strong>: {item.text}
                                        {item.assignedTo && <span style={{ opacity: 0.6, marginLeft: "0.4rem" }}>→ {item.assignedTo}</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1.5rem", flexWrap: "wrap" }}>
                        <button
                            className="feedback-btn correct"
                            onClick={() => navigate("/demo")}
                        >
                            Start New Scenario
                        </button>
                        <button
                            className="feedback-btn failure"
                            onClick={() => navigate("/")}
                        >
                            Return Home
                        </button>
                    </div>
                </div>
            </TraineeInterfaceLayout>
        );
    }

    return (
        <TraineeInterfaceLayout time={time} score={score} decisions={decisions} simTime={simTime}>

            {/** Role badge. */}
            {role && (
                <div className="scenario-card" style={{ padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ opacity: 0.7, fontSize: "0.8rem" }}>Your role:</span>
                    <span className="role-badge">{role}</span>
                </div>
            )}

            {/** Pending approval requests — shown only to the designated approver role. */}
            {pendingApprovals.length > 0 && (
                <div className="scenario-card inject-approval-panel">
                    <h3>🔐 Approval Required</h3>
                    {pendingApprovals.map((pa) => (
                        <div key={pa.injectId} className="approval-request-card">
                            <div className="approval-request-meta">
                                <span className="inject-severity-badge">[{pa.severity?.toUpperCase() ?? "INFO"}]</span>
                                {pa.channel === "email" && <span className="inject-channel-badge email">📧 email</span>}
                                {pa.pressureType === "media" && <span className="inject-pressure-badge media">📰 media</span>}
                                {pa.pressureType === "regulator" && <span className="inject-pressure-badge regulator">🏛️ regulator</span>}
                                {pa.pressureType === "customer" && <span className="inject-pressure-badge customer">👤 customer</span>}
                            </div>
                            <p className="approval-request-message">{pa.message}</p>
                            <p className="approval-request-note">Your role ({pa.approvalRole}) is required to approve this before it is distributed.</p>
                            <button
                                className="feedback-btn correct"
                                style={{ padding: "0.45rem 1.5rem", fontSize: "0.88rem" }}
                                onClick={() => handleApproveInject(pa.injectId)}
                            >
                                ✓ Approve &amp; Release
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/** Live in-app timeline events from the admin. */}
            {timelineEvents.length > 0 && (
                <div className="scenario-card">
                    <h3>Live Updates</h3>
                    {timelineEvents.map((evt, i) => (
                        <div key={i} className={`inject-event-row${evt.pressureType ? ` pressure-${evt.pressureType}` : ""}`}>
                            <div className="inject-event-header">
                                <strong>[{evt.time}] {evt.title}</strong>
                                {evt.pressureType === "media" && <span className="inject-pressure-badge media">📰 Media</span>}
                                {evt.pressureType === "regulator" && <span className="inject-pressure-badge regulator">🏛️ Regulator</span>}
                                {evt.pressureType === "customer" && <span className="inject-pressure-badge customer">👤 Customer</span>}
                                {evt.injectId && !evt.acknowledged && sessionCode && !isDemo && (
                                    <button
                                        className="ack-btn"
                                        onClick={() => handleAcknowledgeInject(evt.injectId, false)}
                                    >
                                        ✓ Acknowledge
                                    </button>
                                )}
                                {evt.acknowledged && <span className="ack-badge">✅ Read</span>}
                            </div>
                            <p className="inject-event-body">{evt.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {/** Email inbox — injects delivered via the email channel. */}
            {emailInbox.length > 0 && (
                <div className="scenario-card email-inbox-panel">
                    <h3>📧 Email Inbox ({emailInbox.filter(e => !e.acknowledged).length} unread)</h3>
                    {emailInbox.map((msg, i) => (
                        <div key={i} className={`email-inbox-item${msg.acknowledged ? " read" : " unread"}${msg.pressureType ? ` pressure-${msg.pressureType}` : ""}`}>
                            <div className="email-inbox-header">
                                <span className="email-from">From: Instructor</span>
                                <span className="email-time">{msg.time}</span>
                                {msg.pressureType === "media" && <span className="inject-pressure-badge media">📰 Media</span>}
                                {msg.pressureType === "regulator" && <span className="inject-pressure-badge regulator">🏛️ Regulator</span>}
                                {msg.pressureType === "customer" && <span className="inject-pressure-badge customer">👤 Customer</span>}
                            </div>
                            <p className="email-body">{msg.description}</p>
                            {msg.injectId && !msg.acknowledged && sessionCode && !isDemo && (
                                <button
                                    className="ack-btn"
                                    onClick={() => handleAcknowledgeInject(msg.injectId, true)}
                                >
                                    ✓ Mark as Read
                                </button>
                            )}
                            {msg.acknowledged && <span className="ack-badge">✅ Read</span>}
                        </div>
                    ))}
                </div>
            )}

            {/** Reference documents linked to this scenario. */}
            {referenceDocs.length > 0 && (
                <div className="scenario-card">
                    <h3>📚 Reference Documents</h3>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem" }}>
                        {referenceDocs.map((doc) => (
                            <li key={doc.id} style={{ padding: "0.3rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                    style={{ color: "rgb(100,180,255)", fontWeight: 600 }}>
                                    {doc.name}
                                </a>
                                {doc.description && (
                                    <span style={{ marginLeft: "0.5rem", opacity: 0.7 }}>— {doc.description}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/** Scenario content. */}
            <div className="scenario-card">
                <h2>{currentNode.title}</h2>
                <p>{currentNode.situation}</p>
                <hr />
                <p><strong>{currentNode.question}</strong></p>
            </div>

            {/** Options rendered as clickable cards. */}
            <div className="options-container">
                {shuffledOptions.map((option, index) => (
                    <div
                        key={index}
                        className="option-card"
                        onClick={() => handleOptionClick(option)}
                    >
                        <div className="option-label">{option.label}</div>
                        <div className="option-text">{option.text}</div>
                    </div>
                ))}
            </div>

            {/** Action item capture form — available during live sessions only. */}
            {sessionCode && !isDemo && (
                <div className="scenario-card">
                    <h3>Log an Action Item</h3>
                    <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                        <input
                            type="text"
                            value={actionText}
                            onChange={(e) => setActionText(e.target.value)}
                            placeholder="Describe the action item…"
                            maxLength={500}
                            onKeyDown={(e) => e.key === "Enter" && handleSubmitActionItem()}
                            style={{ width: "100%", boxSizing: "border-box" }}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: "0.5rem" }}>
                        <select value={actionAssignedTo} onChange={(e) => setActionAssignedTo(e.target.value)}
                            style={{ width: "100%", background: "var(--color-surface)", color: "inherit", border: "1px solid var(--color-border-mid)", borderRadius: "4px", padding: "0.35rem 0.5rem" }}>
                            <option value="">Assign to role (optional)</option>
                            <option value="it-secops">IT / SecOps</option>
                            <option value="legal">Legal</option>
                            <option value="comms">Communications / PR</option>
                            <option value="exec">Executive</option>
                            <option value="security">Security</option>
                            <option value="safety">Safety</option>
                            <option value="medical">Medical</option>
                            <option value="facilities">Facilities</option>
                            <option value="evacuation">Evacuation</option>
                        </select>
                    </div>
                    <button
                        className="feedback-btn correct"
                        onClick={handleSubmitActionItem}
                        disabled={!actionText.trim()}
                        style={{ marginTop: "0.25rem" }}
                    >
                        Submit Action Item
                    </button>

                    {actionItems.length > 0 && (
                        <div style={{ marginTop: "1rem" }}>
                            <h4 style={{ marginBottom: "0.5rem" }}>Captured Action Items</h4>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.82rem" }}>
                                {actionItems.map((item, i) => (
                                    <li key={item.id || i} style={{ padding: "0.3rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                        <span style={{ opacity: 0.7 }}>[{new Date(item.timestampIso).toLocaleTimeString()}]</span>
                                        {" "}<strong>{item.capturedBy}</strong>: {item.text}
                                        {item.assignedTo && <span style={{ opacity: 0.6, marginLeft: "0.4rem" }}>→ {item.assignedTo}</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/** Inline feedback overlay shown after each decision. */}
            {feedback && (
                <div className="feedback-overlay">
                    <div className={`feedback-card ${feedback.type}`}>
                        <div className="feedback-icon">
                            {feedback.type === "correct" ? "✅" : "❌"}
                        </div>
                        <div className={`feedback-title ${feedback.type}`}>
                            {feedback.type === "correct" ? "Correct!" : "Incorrect"}
                        </div>
                        <div className="feedback-points">
                            {feedback.type === "correct" ? "+10 points" : "+0 points"}
                        </div>
                        <div className="feedback-text">{feedback.text}</div>
                        {feedback.type === "correct" ? (
                            <button
                                className="feedback-btn correct"
                                onClick={() => {
                                    setCurrentNodeId(feedback.nextTarget);
                                    setFeedback(null);
                                }}
                            >
                                Continue →
                            </button>
                        ) : (
                            <button
                                className="feedback-btn failure"
                                onClick={() => setFeedback(null)}
                            >
                                Try Again
                            </button>
                        )}
                    </div>
                </div>
            )}

        </TraineeInterfaceLayout>
    );
}
