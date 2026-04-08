/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-04-01
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
 * overlay, decision history, and a scenario-complete card on terminal nodes.
 */

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import TraineeInterfaceLayout from "../../layouts/TraineeInterfaceLayout";
import BackButton from "../../components/BackButton";
import apiClient from "../../services/api/apiClient";
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

    /** Ref to persist the socket across renders. */
    const socketRef = useRef(null);

    /** Start the elapsed timer once scenario data is first available. */
    useEffect(() => {
        if (!scenarioData || timerStartedRef.current) return;
        timerStartedRef.current = true;
        const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
        return () => clearInterval(id);
    }, [scenarioData]);

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
                socket.emit("session:join", { sessionCode, displayName });
            });

            socket.on("timeline:tick", (payload) => {
                setTimelineEvents((prev) => [
                    ...prev,
                    { title: payload.title, description: payload.description, time: new Date().toLocaleTimeString() },
                ]);
            });

            socket.on("event:log:broadcast", (payload) => {
                if (payload.actorRole !== "admin") return;
                setTimelineEvents((prev) => [
                    ...prev,
                    {
                        title: `[${payload.rationale?.toUpperCase() ?? "INFO"}] Instructor`,
                        description: payload.action,
                        time: new Date().toLocaleTimeString(),
                    },
                ]);
            });
        }

        return () => {
            cancelled = true;
            if (socket) socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scenarioKey, sessionCode, isDemo, demoScenarioData]);

    /** Function that handles option selection. */
    function handleOptionClick(option) {
        const outcome = option?.outcome;
        if (!outcome) return;

        const currentNode = scenarioData.nodes[currentNodeId];

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
                    score: newScore,
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
                    score,
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

    /** Show error state if scenario couldn't be loaded. */
    if (loadError) {
        return (
            <TraineeInterfaceLayout time={time} score={score} decisions={decisions}>
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
            <TraineeInterfaceLayout time={time} score={score} decisions={decisions}>
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
            <TraineeInterfaceLayout time={time} score={score} decisions={decisions}>
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
            <TraineeInterfaceLayout time={time} score={score} decisions={decisions}>
                {timelineEvents.length > 0 && (
                    <div className="scenario-card">
                        <h3>Live Updates</h3>
                        {timelineEvents.map((evt, i) => (
                            <p key={i}><strong>[{evt.time}] {evt.title}:</strong> {evt.description}</p>
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
        <TraineeInterfaceLayout time={time} score={score} decisions={decisions}>

            {/** Live timeline events from the admin. */}
            {timelineEvents.length > 0 && (
                <div className="scenario-card">
                    <h3>Live Updates</h3>
                    {timelineEvents.map((evt, i) => (
                        <p key={i}><strong>[{evt.time}] {evt.title}:</strong> {evt.description}</p>
                    ))}
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
                {(currentNode.options || []).map((option, index) => (
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
