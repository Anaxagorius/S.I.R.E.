/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-04-01
 * Description: Administrator dashboard for managing session lifecycle.
 * Handles four states (selecting scenario, waiting, active session, and post-session review).
 * Connects to the backend via Socket.IO to provide real-time session management.
 * Supports admin event injection (message + severity) during active sessions.
 * Includes end-session confirmation modal with restart, home navigation, and export options.
 * Features: category/difficulty filters on scenario selection, per-trainee score tracking,
 * and an enhanced after-action review with highlighted correct/incorrect decisions.
 */

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import AdminDashboardLayout from "../../layouts/AdminDashboardLayout";
import Button from "../../components/Button";
import BackButton from "../../components/BackButton";
import { getScenarios, createSession, createActionTasks, getItsmIntegrations, pushToItsm, initMciState, updateMciStateApi } from "../../services/api/api";
import { SOCKET_URL, SOCKET_API_KEY } from "../../services/socketConfig";
import { accuracyColor, readinessLabel } from "../../utils/scoringUtils";
import { getStandardsRef } from "../../utils/standardsMapping";

/** Icon map keyed by scenario ID, used to enrich scenarios fetched from the API. */
const SCENARIO_ICONS = {
    scenario_fire:                   "🔥",
    scenario_flood:                  "🌊",
    scenario_medical_emergency:      "🚑",
    scenario_severe_weather:         "⛈️",
    scenario_cyber_attack:           "💻",
    scenario_hazardous_material_spill: "☣️",
    scenario_active_threat:          "🚨",
    scenario_power_outage:           "🔌",
    scenario_mass_casualty:          "🏥",
    scenario_infrastructure_attack:  "⚡",
};

const CATEGORIES = ["All", "Physical", "Medical", "HAZMAT", "Threat", "Cyber", "Banking"];
const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"];

/** Returns the CSS class name for a difficulty badge. */
function difficultyClass(difficulty) {
    if (difficulty === "Beginner") return "difficulty-beginner";
    if (difficulty === "Intermediate") return "difficulty-intermediate";
    if (difficulty === "Advanced") return "difficulty-advanced";
    return "";
}

/** Function that returns the AdminDashboard component for managing and monitoring session flow. */
export default function AdminDashboard() {

    const location = useLocation();
    const navigate = useNavigate();

    /** Session code and scenario key — may be seeded from navigation state or set after scenario selection. */
    const [sessionCode, setSessionCode] = useState(location.state?.sessionCode || null);
    const [scenarioKey, setScenarioKey] = useState(location.state?.scenarioKey || null);

    /** State for tracking whether a session is currently being created. */
    const [sessionCreating, setSessionCreating] = useState(false);

    /** Constant for tracking the current session state. */
    const [sessionState, setSessionState] = useState("waiting");

    /** Whether the session timeline is currently paused. */
    const [isPaused, setIsPaused] = useState(false);

    /** Real-time roster of trainees in the session. */
    const [trainees, setTrainees] = useState([]);

    /** Live event log entries broadcast during the session. */
    const [eventLog, setEventLog] = useState([]);

    /** Human-readable scenario name derived from the scenario key. */
    const [scenarioName, setScenarioName] = useState(
        scenarioKey
            ? scenarioKey.replace(/^scenario_/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
            : ""
    );

    /** Error state for any backend or socket failures. */
    const [error, setError] = useState(null);

    /** Scenarios fetched from the backend API. */
    const [scenarios, setScenarios] = useState([]);

    /** Loading state while scenarios are being fetched. */
    const [scenariosLoading, setScenariosLoading] = useState(true);

    /** Error state for scenario fetch failures (separate from session creation errors). */
    const [scenariosError, setScenariosError] = useState(null);

    /** Ref to persist the socket across renders. */
    const socketRef = useRef(null);

    /** Per-trainee score tracking: Map<displayName, { score, decisions }>. */
    const [traineeScores, setTraineeScores] = useState(new Map());

    /** Ref tracking the last known score per trainee for correct/incorrect detection. */
    const traineeScoreRef = useRef(new Map());

    /** Category and difficulty filters for the scenario selection grid. */
    const [filterCategory, setFilterCategory] = useState(location.state?.filterCategory || "All");
    const [filterDifficulty, setFilterDifficulty] = useState("All");

    /** State for the admin inject panel (immediate inject). */
    const [injectMessage, setInjectMessage] = useState("");
    const [injectSeverity, setInjectSeverity] = useState("info");
    const [injectSending, setInjectSending] = useState(false);

    /** State for the inject queue. */
    const [injectQueue, setInjectQueue] = useState([]);
    const [queueMessage, setQueueMessage] = useState("");
    const [queueSeverity, setQueueSeverity] = useState("info");
    const [queueRoleFilter, setQueueRoleFilter] = useState("");
    const [queueChannel, setQueueChannel] = useState("in-app");
    const [queuePressureType, setQueuePressureType] = useState("");
    const [queueRequiresApproval, setQueueRequiresApproval] = useState(false);
    const [queueApprovalRole, setQueueApprovalRole] = useState("");

    /** State for editing a queued inject. */
    const [editingInjectId, setEditingInjectId] = useState(null);
    const [editMessage, setEditMessage] = useState("");
    const [editSeverity, setEditSeverity] = useState("info");
    const [editRoleFilter, setEditRoleFilter] = useState("");

    /** Action items captured during the session. */
    const [actionItems, setActionItems] = useState([]);

    /** Tracks which finding/action-item IDs have been pushed to the action tracker. */
    const [pushedToTracker, setPushedToTracker] = useState(new Set());

    /** Loading state while pushing findings to the action tracker. */
    const [pushingToTracker, setPushingToTracker] = useState(false);

    /** Feedback message shown after pushing to the action tracker. */
    const [trackerPushMsg, setTrackerPushMsg] = useState(null);

    /** ITSM integrations available for pushing evidence packs. */
    const [itsmIntegrations, setItsmIntegrations] = useState([]);
    const [itsmPushStatus, setItsmPushStatus] = useState(null); // null | 'pushing' | 'ok' | 'error'
    const [itsmPushMessage, setItsmPushMessage] = useState("");

    /** State for the end-session confirmation modal. */
    const [showEndModal, setShowEndModal] = useState(false);

    /** MCI state for EMS/Medical scenarios. */
    const [mciState, setMciState] = useState(null);
    const [mciInitializing, setMciInitializing] = useState(false);
    const [mciInitError, setMciInitError] = useState(null);

    /** True when the active scenario belongs to the Medical category. */
    const isMedicalScenario = scenarioKey
        ? (scenarios.find(s => s.id === scenarioKey)?.category === "Medical") ||
          scenarioKey === "scenario_mass_casualty" ||
          scenarioKey === "scenario_hospital_surge" ||
          scenarioKey === "scenario_ems_mci_command"
        : false;

    /** Fetch the available scenarios from the backend on mount. */
    useEffect(() => {
        let cancelled = false;
        async function loadScenarios() {
            setScenariosLoading(true);
            try {
                const data = await getScenarios();
                if (!cancelled) {
                    setScenarios(
                        data.map((s) => ({ ...s, icon: SCENARIO_ICONS[s.id] || "📋" }))
                    );
                }
            } catch (err) {
                if (!cancelled) {
                    setScenariosError(err.message || "Failed to load scenarios.");
                }
            } finally {
                if (!cancelled) setScenariosLoading(false);
            }
        }
        loadScenarios();
        return () => { cancelled = true; };
    }, []);

    /** Auto-create a session when arriving with a preSelectScenario navigation state param. */
    useEffect(() => {
        const preSelectId = location.state?.preSelectScenario;
        if (!preSelectId || scenarios.length === 0 || sessionCode) return;
        const found = scenarios.find((s) => s.id === preSelectId);
        if (found) handleSelectScenario(found);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scenarios]);

    /** Fetch configured ITSM integrations on mount for the post-session push option. */
    useEffect(() => {
        let cancelled = false;
        async function loadItsm() {
            try {
                const data = await getItsmIntegrations();
                if (!cancelled) setItsmIntegrations(data.filter(integration => integration.isEnabled));
            } catch {
                // Non-critical — silently ignore if integrations endpoint not reachable
            }
        }
        loadItsm();
        return () => { cancelled = true; };
    }, []);

    /** Update scenario display name when the scenarios list is populated. */
    useEffect(() => {
        if (!scenarioKey || scenarios.length === 0) return;
        const found = scenarios.find((s) => s.id === scenarioKey);
        if (found) setScenarioName(found.name);
    }, [scenarioKey, scenarios]);

    /** Connect to Socket.IO when a session code is available. Reconnects only when sessionCode changes. */
    useEffect(() => {
        if (!sessionCode) return;

        /** Connect to Socket.IO /sim namespace. */
        const socket = io(`${SOCKET_URL}/sim`, {
            auth: SOCKET_API_KEY ? { apiKey: SOCKET_API_KEY } : {},
            transports: ["websocket", "polling"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            /** Join the session room as admin. */
            socket.emit("admin:join", { sessionCode });
        });

        socket.on("session:joined", (payload) => {
            if (payload.roster) {
                setTrainees(payload.roster);
            }
            if (payload.isPaused !== undefined) setIsPaused(payload.isPaused);
            if (payload.injectQueue) setInjectQueue(payload.injectQueue);
            if (payload.actionItems) setActionItems(payload.actionItems);
        });

        socket.on("inject:queue:updated", (payload) => {
            if (payload.injectQueue) setInjectQueue(payload.injectQueue);
        });

        socket.on("session:roster:updated", (payload) => {
            if (payload.roster) setTrainees(payload.roster);
        });

        socket.on("action:item:broadcast", (payload) => {
            if (payload.item) setActionItems((prev) => [...prev, payload.item]);
        });

        socket.on("action:items:updated", (payload) => {
            if (payload.actionItems) setActionItems(payload.actionItems);
        });

        socket.on("session:paused", () => {
            setIsPaused(true);
        });

        socket.on("session:resumed", () => {
            setIsPaused(false);
        });

        socket.on("timeline:tick", (payload) => {
            setEventLog((prev) => [
                ...prev,
                { title: payload.title, description: payload.description, time: new Date().toLocaleTimeString() },
            ]);
        });

        socket.on("session:end", () => {
            setSessionState("ended");
        });

        socket.on("event:log:broadcast", (payload) => {
            /** Use isCorrect field from backend when available, otherwise fall back to score-delta detection. */
            let isCorrect = null;
            if (payload.actorRole === "trainee" && payload.displayName) {
                if (typeof payload.isCorrect === "boolean") {
                    isCorrect = payload.isCorrect;
                } else if (payload.score !== undefined) {
                    const prevScore = traineeScoreRef.current.get(payload.displayName) ?? 0;
                    isCorrect = payload.score > prevScore;
                }
                if (payload.score !== undefined) {
                    traineeScoreRef.current.set(payload.displayName, payload.score);
                    setTraineeScores((prev) => {
                        const next = new Map(prev);
                        const existing = next.get(payload.displayName) || { score: 0, decisions: 0 };
                        next.set(payload.displayName, {
                            score: payload.score,
                            decisions: existing.decisions + 1,
                        });
                        return next;
                    });
                }
            }

            setEventLog((prev) => [
                ...prev,
                {
                    title: `${payload.displayName} (${payload.actorRole})`,
                    description: payload.action,
                    time: new Date().toLocaleTimeString(),
                    score: payload.score,
                    isCorrect,
                    displayName: payload.displayName,
                    actorRole: payload.actorRole,
                },
            ]);
        });

        socket.on("error:occurred", (payload) => {
            setError(payload.message || "A socket error occurred.");
        });

        socket.on("mci:state:updated", (payload) => {
            if (payload.mciState) setMciState(payload.mciState);
        });

        socket.on("mci:decision:recorded", (payload) => {
            if (payload.mciState) setMciState(payload.mciState);
        });

        return () => {
            socket.disconnect();
        };
    }, [sessionCode]);

    /** Asynchronous function that creates a session for the selected scenario. */
    async function handleSelectScenario(scenario) {
        setSessionCreating(true);
        setError(null);
        try {
            const data = await createSession(scenario.id);
            setScenarioKey(scenario.id);
            setScenarioName(scenario.name);
            setSessionCode(data.sessionKey);
        } catch (err) {
            setError(err.message || "Failed to create session.");
        } finally {
            setSessionCreating(false);
        }
    }

    /** Function that starts the session by emitting a socket event. */
    function handleStartSession() {
        if (!socketRef.current || !sessionCode) return;
        socketRef.current.emit("session:start", { sessionCode });
        setSessionState("active");
    }

    /** Function that resets all session state to show the scenario selection view. */
    function handleStartNewSession() {
        setSessionCode(null);
        setScenarioKey(null);
        setScenarioName("");
        setSessionState("waiting");
        setIsPaused(false);
        setTrainees([]);
        setEventLog([]);
        setError(null);
        setShowEndModal(false);
        setTraineeScores(new Map());
        traineeScoreRef.current = new Map();
        setFilterCategory("All");
        setFilterDifficulty("All");
        setInjectQueue([]);
        setQueueMessage("");
        setQueueSeverity("info");
        setQueueRoleFilter("");
        setQueueChannel("in-app");
        setQueuePressureType("");
        setQueueRequiresApproval(false);
        setQueueApprovalRole("");
        setEditingInjectId(null);
        setActionItems([]);
        setPushedToTracker(new Set());
        setTrackerPushMsg(null);
        setMciState(null);
        setMciInitializing(false);
        setMciInitError(null);
    }

    /** Function that opens the end-session confirmation modal. */
    function handleEndSession() {
        setShowEndModal(true);
    }

    /** Function that confirms session end and transitions to the ended state. */
    function handleConfirmEnd() {
        if (socketRef.current && sessionCode) {
            socketRef.current.emit("session:end:admin", { sessionCode });
        }
        setSessionState("ended");
        setShowEndModal(false);
    }

    /** Function that exports the session event log as a JSON file download. */
    function handleExportResults() {
        const exportData = {
            sessionCode,
            scenarioName,
            exportedAt: new Date().toISOString(),
            participants: trainees.map((t) => ({
                displayName: t.displayName,
                role: t.role || null,
                score: traineeScores.get(t.displayName)?.score ?? 0,
                decisions: traineeScores.get(t.displayName)?.decisions ?? 0,
            })),
            actionItems,
            injectLog: injectQueue.map((inj) => ({
                id: inj.id,
                message: inj.message,
                severity: inj.severity,
                channel: inj.channel,
                pressureType: inj.pressureType,
                roleFilter: inj.roleFilter,
                requiresApproval: inj.requiresApproval,
                approvalRole: inj.approvalRole,
                approvedBy: inj.approvedBy,
                approvedAt: inj.approvedAt,
                released: inj.released,
                releasedAt: inj.releasedAt,
                deliveryLog: inj.deliveryLog || [],
                acknowledgements: inj.acknowledgements || [],
            })),
            eventLog,
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sire-session-${sessionCode}-results.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /** Build the session snapshot payload shared by export and ITSM push. */
    function buildSessionSnapshot() {
        return {
            sessionCode,
            scenarioName,
            exportedAt: new Date().toISOString(),
            participants: trainees.map((t) => ({
                displayName: t.displayName,
                role: t.role || null,
                score: traineeScores.get(t.displayName)?.score ?? 0,
                decisions: traineeScores.get(t.displayName)?.decisions ?? 0,
            })),
            actionItems,
            injectLog: injectQueue.map((inj) => ({
                id: inj.id,
                message: inj.message,
                severity: inj.severity,
                channel: inj.channel,
                pressureType: inj.pressureType,
                roleFilter: inj.roleFilter,
                releasedAt: inj.releasedAt,
                deliveryLog: inj.deliveryLog || [],
                acknowledgements: inj.acknowledgements || [],
            })),
            eventLog,
        };
    }

    /** Push the session evidence pack to a configured ITSM integration. */
    async function handlePushToItsm(integrationId) {
        setItsmPushStatus("pushing");
        setItsmPushMessage("");
        try {
            const result = await pushToItsm(integrationId, buildSessionSnapshot());
            if (result.success) {
                setItsmPushStatus("ok");
                setItsmPushMessage(`Evidence pack pushed (HTTP ${result.statusCode}).`);
            } else {
                setItsmPushStatus("error");
                setItsmPushMessage(`Push returned HTTP ${result.statusCode} ${result.statusText}.`);
            }
        } catch (err) {
            setItsmPushStatus("error");
            setItsmPushMessage(err.message || "Push failed.");
        }
    }

    /** Function that sends an admin inject event via Socket.IO. */
    function handleInjectEvent() {
        if (!socketRef.current || !sessionCode || !injectMessage.trim()) return;
        setInjectSending(true);
        socketRef.current.emit("admin:inject", {
            sessionCode,
            message: injectMessage.trim(),
            severity: injectSeverity,
        });
        setInjectMessage("");
        // Brief cooldown to prevent accidental double-sends before server confirms receipt
        setTimeout(() => setInjectSending(false), 500);
    }

    /** Pause or resume the session timeline. */
    function handleTogglePause() {
        if (!socketRef.current || !sessionCode) return;
        if (isPaused) {
            socketRef.current.emit("session:resume", { sessionCode });
        } else {
            socketRef.current.emit("session:pause", { sessionCode });
        }
    }

    /** Add an inject to the facilitator queue (not yet released). */
    function handleAddToQueue() {
        if (!socketRef.current || !sessionCode || !queueMessage.trim()) return;
        socketRef.current.emit("admin:inject:queue:add", {
            sessionCode,
            message: queueMessage.trim(),
            severity: queueSeverity,
            roleFilter: queueRoleFilter || null,
            channel: queueChannel,
            pressureType: queuePressureType || null,
            requiresApproval: queueRequiresApproval,
            approvalRole: queueRequiresApproval ? (queueApprovalRole || null) : null,
        });
        setQueueMessage("");
        setQueueSeverity("info");
        setQueueRoleFilter("");
        setQueueChannel("in-app");
        setQueuePressureType("");
        setQueueRequiresApproval(false);
        setQueueApprovalRole("");
    }

    /** Release a queued inject so participants can see it. */
    function handleReleaseInject(injectId) {
        if (!socketRef.current || !sessionCode) return;
        socketRef.current.emit("admin:inject:release", { sessionCode, injectId });
    }

    /** Start editing a queued inject. */
    function handleStartEditInject(inject) {
        setEditingInjectId(inject.id);
        setEditMessage(inject.message);
        setEditSeverity(inject.severity);
        setEditRoleFilter(inject.roleFilter || "");
    }

    /** Save the edited inject. */
    function handleSaveEditInject() {
        if (!socketRef.current || !sessionCode || !editingInjectId || !editMessage.trim()) return;
        socketRef.current.emit("admin:inject:edit", {
            sessionCode,
            injectId: editingInjectId,
            message: editMessage.trim(),
            severity: editSeverity,
            roleFilter: editRoleFilter || null,
        });
        setEditingInjectId(null);
    }

    /** Assign a role to a trainee from the waiting room. */
    function handleAssignRole(displayName, role) {
        if (!socketRef.current || !sessionCode) return;
        socketRef.current.emit("admin:role:assign", { sessionCode, displayName, role });
    }

    /** Push a single finding (incorrect decision) to the persistent action tracker. */
    async function handlePushFinding(entry) {
        if (pushedToTracker.has(entry._findingKey)) return;
        setPushingToTracker(true);
        setTrackerPushMsg(null);
        try {
            const standardsRef = getStandardsRef(scenarioKey);
            await createActionTasks({
                text: `[Finding] ${entry.description}`,
                sessionCode: sessionCode || "",
                scenarioKey: scenarioKey || "",
                source: "aar_finding",
                standardsRef,
                status: "open",
            });
            setPushedToTracker(prev => new Set([...prev, entry._findingKey]));
            setTrackerPushMsg("Finding pushed to Action Tracker ✓");
        } catch {
            setTrackerPushMsg("Failed to push finding. Please try again.");
        } finally {
            setPushingToTracker(false);
        }
    }

    /** Push all unpushed findings (incorrect decisions) to the persistent action tracker. */
    async function handlePushAllFindings(findings) {
        const unpushed = findings.filter(f => !pushedToTracker.has(f._findingKey));
        if (unpushed.length === 0) return;
        setPushingToTracker(true);
        setTrackerPushMsg(null);
        try {
            const standardsRef = getStandardsRef(scenarioKey);
            const tasks = unpushed.map(f => ({
                text: `[Finding] ${f.description}`,
                sessionCode: sessionCode || "",
                scenarioKey: scenarioKey || "",
                source: "aar_finding",
                standardsRef,
                status: "open",
            }));
            await createActionTasks(tasks);
            setPushedToTracker(prev => {
                const next = new Set(prev);
                unpushed.forEach(f => next.add(f._findingKey));
                return next;
            });
            setTrackerPushMsg(`${unpushed.length} finding(s) pushed to Action Tracker ✓`);
        } catch {
            setTrackerPushMsg("Failed to push findings. Please try again.");
        } finally {
            setPushingToTracker(false);
        }
    }

    /** Push all session action items to the persistent action tracker. */
    async function handlePushActionItems() {
        if (actionItems.length === 0) return;
        const unpushed = actionItems.filter(item => !pushedToTracker.has(`action-${item.id}`));
        if (unpushed.length === 0) {
            setTrackerPushMsg("All action items already pushed ✓");
            return;
        }
        setPushingToTracker(true);
        setTrackerPushMsg(null);
        try {
            const standardsRef = getStandardsRef(scenarioKey);
            const tasks = unpushed.map(item => ({
                text: item.text,
                sessionCode: sessionCode || "",
                scenarioKey: scenarioKey || "",
                source: "aar_action",
                owner: item.assignedTo || item.owner || null,
                standardsRef,
                status: "open",
            }));
            await createActionTasks(tasks);
            setPushedToTracker(prev => {
                const next = new Set(prev);
                unpushed.forEach(item => next.add(`action-${item.id}`));
                return next;
            });
            setTrackerPushMsg(`${unpushed.length} action item(s) pushed to Action Tracker ✓`);
        } catch {
            setTrackerPushMsg("Failed to push action items. Please try again.");
        } finally {
            setPushingToTracker(false);
        }
    }


    async function handleInitMci() {
        setMciInitializing(true);
        setMciInitError(null);
        try {
            const state = await initMciState(sessionCode);
            setMciState(state);
        } catch (err) {
            setMciInitError(err.message || "Failed to initialize MCI state. Please try again.");
        } finally {
            setMciInitializing(false);
        }
    }

    function handleMciDecision(decision) {
        if (!socketRef.current || !sessionCode) return;
        socketRef.current.emit("mci:decision:record", { sessionCode, decision });
    }

    /** Scenario selection — shown when no session is active. */
    if (!sessionCode) {
        const filteredScenarios = scenarios.filter(
            (s) =>
                (filterCategory === "All" || s.category === filterCategory) &&
                (filterDifficulty === "All" || s.difficulty === filterDifficulty)
        );

        return (
            <AdminDashboardLayout>

                {/** Back navigation. */}
                <BackButton to="/admin" />

                {/** Heading card. */}
                <div className="dashboard-card">
                    <h2>Select a Scenario</h2>
                    <p>Choose a training scenario below to create a new session.</p>
                </div>

                {/** Error display. */}
                {error && (
                    <div className="dashboard-card" style={{ borderColor: "rgb(200,40,40)" }}>
                        <p style={{ color: "rgb(255,80,80)" }}>{error}</p>
                    </div>
                )}

                {/** Category filter bar. */}
                <div className="filter-bar">
                    <span className="filter-label">Category:</span>
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            className={`filter-btn${filterCategory === cat ? " active" : ""}`}
                            onClick={() => setFilterCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/** Difficulty filter bar. */}
                <div className="filter-bar">
                    <span className="filter-label">Difficulty:</span>
                    {DIFFICULTIES.map((diff) => (
                        <button
                            key={diff}
                            className={`filter-btn${filterDifficulty === diff ? " active" : ""}`}
                            onClick={() => setFilterDifficulty(diff)}
                        >
                            {diff}
                        </button>
                    ))}
                </div>

                {/** Scenario cards grid. */}
                <div className="scenario-grid">
                    {scenariosLoading ? (
                        <p>Loading scenarios...</p>
                    ) : scenariosError ? (
                        <p style={{ color: "rgb(255,80,80)" }}>{scenariosError}</p>
                    ) : filteredScenarios.length === 0 ? (
                        <p style={{ opacity: 0.7 }}>No scenarios match the selected filters.</p>
                    ) : (
                        filteredScenarios.map((scenario) => (
                            <button
                                key={scenario.id}
                                className="scenario-card"
                                onClick={() => handleSelectScenario(scenario)}
                                disabled={sessionCreating}
                            >
                                <span className="scenario-card-icon">{scenario.icon}</span>
                                <span className="scenario-card-name">{scenario.name}</span>
                                <span className="scenario-card-desc">{scenario.description}</span>
                                {scenario.difficulty && (
                                    <span className={`scenario-card-difficulty ${difficultyClass(scenario.difficulty)}`}>
                                        {scenario.difficulty}
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>

                {/** Creating session indicator. */}
                {sessionCreating && (
                    <div className="dashboard-card"><p>Creating session...</p></div>
                )}

            </AdminDashboardLayout>
        );
    }

    return (
        <AdminDashboardLayout>

            {/** Session info card always visible. */}
            <div className="dashboard-card">
                <h3>Session Info</h3>
                <p><strong>Session Code:</strong> {sessionCode}</p>
                <p><strong>Scenario:</strong> {scenarioName}</p>
            </div>

            {/** Error display. */}
            {error && (
                <div className="dashboard-card" style={{ borderColor: "rgb(200,40,40)" }}>
                    <p style={{ color: "rgb(255,80,80)" }}>{error}</p>
                </div>
            )}

            {/** Waiting state that displays joined trainees with role assignment. */}
            {sessionState === "waiting" && (
                <div className="dashboard-card">
                    <h2>Waiting for Trainees</h2>
                    <p>{trainees.length} / 10 joined</p>
                    <ul>
                        {trainees.map((t, i) => (
                            <li key={t.socketId || i} style={{ marginBottom: "0.5rem" }}>
                                <span style={{ marginRight: "0.75rem" }}>{t.displayName}</span>
                                {t.role && (
                                    <span className="role-badge" style={{ marginRight: "0.5rem" }}>{t.role}</span>
                                )}
                                <select
                                    defaultValue=""
                                    onChange={(e) => e.target.value && handleAssignRole(t.displayName, e.target.value)}
                                    style={{ fontSize: "0.8rem", padding: "0.15rem 0.3rem", background: "var(--color-surface)", color: "inherit", border: "1px solid var(--color-border-mid)", borderRadius: "4px" }}
                                >
                                    <option value="">Assign role…</option>
                                    <option value="it-secops">IT / SecOps</option>
                                    <option value="legal">Legal</option>
                                    <option value="comms">Communications / PR</option>
                                    <option value="exec">Executive</option>
                                    <option value="security">Security</option>
                                    <option value="safety">Safety</option>
                                    <option value="medical">Medical</option>
                                    <option value="facilities">Facilities</option>
                                    <option value="evacuation">Evacuation</option>
                                    <option value="ed-charge">🏥 ED Charge Nurse</option>
                                    <option value="incident-commander">🎖️ Incident Commander</option>
                                    <option value="pio">📢 Public Information Officer</option>
                                    <option value="logistics">🚛 Logistics Officer</option>
                                    <option value="triage-officer">🏷️ Triage Officer</option>
                                    <option value="treatment-officer">💊 Treatment Officer</option>
                                    <option value="transport-officer">🚑 Transport Officer</option>
                                </select>
                            </li>
                        ))}
                    </ul>
                    <Button text="Start Session" onClick={handleStartSession} />
                </div>
            )}

            {/** Active session that displays live trainee progress and event log. */}
            {sessionState === "active" && (
                <div>
                    {/** Session controls — pause/resume. */}
                    <div className="dashboard-card">
                        <h2>Session in Progress {isPaused && <span style={{ color: "rgb(255,180,40)", fontSize: "0.9rem" }}>⏸ PAUSED</span>}</h2>
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                            <Button
                                text={isPaused ? "▶ Resume Timeline" : "⏸ Pause Timeline"}
                                onClick={handleTogglePause}
                            />
                            <Button text="End Session" onClick={handleEndSession} />
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h3>Trainees ({trainees.length})</h3>
                        <ul>
                            {trainees.map((t, i) => (
                                <li key={t.socketId || i}>
                                    {t.displayName}
                                    {t.role && <span className="role-badge" style={{ marginLeft: "0.4rem" }}>{t.role}</span>}
                                    {" — Score: "}
                                    <strong style={{ color: "rgb(80,220,80)" }}>
                                        {traineeScores.get(t.displayName)?.score ?? 0} pts
                                    </strong>
                                    {" "}({traineeScores.get(t.displayName)?.decisions ?? 0} decisions)
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/** MCI Control Panel — shown for EMS/Medical scenarios. */}
                    {isMedicalScenario && (
                        <div className="dashboard-card">
                            <h3>🏥 MCI Control Panel</h3>
                            {!mciState ? (
                                <div>
                                    <p style={{ opacity: 0.7, fontSize: "0.85rem" }}>MCI state tracking not initialized for this session.</p>
                                    {mciInitError && <p style={{ color: "rgb(255,80,80)", fontSize: "0.82rem" }}>{mciInitError}</p>}
                                    <Button text={mciInitializing ? "Initializing…" : "Initialize MCI State"} onClick={handleInitMci} disabled={mciInitializing} />
                                </div>
                            ) : (
                                <div>
                                    <div style={{ marginBottom: "1rem" }}>
                                        <strong>Bed Capacity</strong>
                                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.4rem", fontSize: "0.85rem" }}>
                                            <span>Total: {mciState.bedCapacity?.total ?? '—'}</span>
                                            <span style={{ color: (mciState.bedCapacity?.available ?? 99) < 10 ? "rgb(255,80,80)" : "inherit" }}>
                                                Available: {mciState.bedCapacity?.available ?? '—'}
                                            </span>
                                            <span>ICU: {mciState.bedCapacity?.icu ?? '—'}</span>
                                            <span>ED: {mciState.bedCapacity?.ed ?? '—'}</span>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: "1rem" }}>
                                        <strong>Ambulance Status</strong>
                                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.4rem", fontSize: "0.85rem" }}>
                                            <span>Available: {mciState.ambulances?.available ?? '—'}</span>
                                            <span>Dispatched: {mciState.ambulances?.dispatched ?? '—'}</span>
                                            <span>Returning: {mciState.ambulances?.returning ?? '—'}</span>
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: "1rem" }}>
                                        <strong>Supply Status</strong>
                                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.4rem", fontSize: "0.85rem" }}>
                                            {Object.entries(mciState.supplies || {}).map(([key, val]) => (
                                                <span key={key} style={{
                                                    padding: "0.15rem 0.5rem",
                                                    borderRadius: "4px",
                                                    background: val === 'critical' ? "rgba(220,50,50,0.2)" : val === 'low' ? "rgba(220,160,40,0.2)" : "rgba(40,200,40,0.1)",
                                                    border: `1px solid ${val === 'critical' ? "rgba(220,50,50,0.4)" : val === 'low' ? "rgba(220,160,40,0.4)" : "rgba(40,200,40,0.2)"}`,
                                                }}>
                                                    {key}: {val}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ marginBottom: "1rem" }}>
                                        <strong>Hospital Diversion</strong>
                                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.4rem", fontSize: "0.85rem" }}>
                                            {Object.entries(mciState.hospitalDiversion || {}).map(([hosp, diverted]) => (
                                                <span key={hosp} style={{
                                                    padding: "0.15rem 0.5rem",
                                                    borderRadius: "4px",
                                                    background: diverted ? "rgba(220,50,50,0.2)" : "rgba(40,200,40,0.1)",
                                                    border: `1px solid ${diverted ? "rgba(220,50,50,0.4)" : "rgba(40,200,40,0.2)"}`,
                                                }}>
                                                    {hosp}: {diverted ? "DIVERTED" : "Open"}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <strong>Operational Decisions</strong>
                                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                                            <button
                                                disabled={mciState.mciActivated}
                                                onClick={() => handleMciDecision('mci-activated')}
                                                style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", fontSize: "0.82rem", cursor: mciState.mciActivated ? "default" : "pointer", background: mciState.mciActivated ? "rgba(40,200,40,0.15)" : "rgba(255,255,255,0.08)", border: `1px solid ${mciState.mciActivated ? "rgba(40,200,40,0.4)" : "rgba(255,255,255,0.2)"}`, color: "inherit", opacity: mciState.mciActivated ? 0.7 : 1 }}
                                            >
                                                {mciState.mciActivated ? "✅ MCI Plan Active" : "🚨 Activate MCI Plan"}
                                            </button>
                                            <button
                                                disabled={mciState.alternateCareActivated}
                                                onClick={() => handleMciDecision('alternate-care-activated')}
                                                style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", fontSize: "0.82rem", cursor: mciState.alternateCareActivated ? "default" : "pointer", background: mciState.alternateCareActivated ? "rgba(40,200,40,0.15)" : "rgba(255,255,255,0.08)", border: `1px solid ${mciState.alternateCareActivated ? "rgba(40,200,40,0.4)" : "rgba(255,255,255,0.2)"}`, color: "inherit", opacity: mciState.alternateCareActivated ? 0.7 : 1 }}
                                            >
                                                {mciState.alternateCareActivated ? "✅ Alt Care Site Open" : "🏕️ Open Alternate Care Site"}
                                            </button>
                                            <button
                                                disabled={mciState.mutualAidRequested}
                                                onClick={() => handleMciDecision('mutual-aid-requested')}
                                                style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", fontSize: "0.82rem", cursor: mciState.mutualAidRequested ? "default" : "pointer", background: mciState.mutualAidRequested ? "rgba(40,200,40,0.15)" : "rgba(255,255,255,0.08)", border: `1px solid ${mciState.mutualAidRequested ? "rgba(40,200,40,0.4)" : "rgba(255,255,255,0.2)"}`, color: "inherit", opacity: mciState.mutualAidRequested ? 0.7 : 1 }}
                                            >
                                                {mciState.mutualAidRequested ? "✅ Mutual Aid Active" : "🤝 Request Mutual Aid"}
                                            </button>
                                            <button
                                                disabled={mciState.electivesCancelled}
                                                onClick={() => handleMciDecision('electives-cancelled')}
                                                style={{ padding: "0.4rem 0.8rem", borderRadius: "6px", fontSize: "0.82rem", cursor: mciState.electivesCancelled ? "default" : "pointer", background: mciState.electivesCancelled ? "rgba(40,200,40,0.15)" : "rgba(255,255,255,0.08)", border: `1px solid ${mciState.electivesCancelled ? "rgba(40,200,40,0.4)" : "rgba(255,255,255,0.2)"}`, color: "inherit", opacity: mciState.electivesCancelled ? 0.7 : 1 }}
                                            >
                                                {mciState.electivesCancelled ? "✅ Electives Cancelled" : "🚫 Cancel Elective Procedures"}
                                            </button>
                                        </div>
                                    </div>
                                    {mciState.decisionLog && mciState.decisionLog.length > 0 && (
                                        <div style={{ marginTop: "1rem" }}>
                                            <strong>Decision Log</strong>
                                            <ul style={{ listStyle: "none", padding: 0, margin: "0.4rem 0 0", fontSize: "0.8rem", maxHeight: "150px", overflowY: "auto" }}>
                                                {mciState.decisionLog.map((d) => (
                                                    <li key={d.id} style={{ padding: "0.25rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                                        <span style={{ opacity: 0.6, marginRight: "0.4rem" }}>{new Date(d.timestamp).toLocaleTimeString()}</span>
                                                        <strong>{d.decision}</strong>
                                                        {d.madeBy && <span style={{ opacity: 0.7 }}> — {d.madeBy}</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/** Inject queue — pre-load injects and release manually. */}
                    <div className="dashboard-card">
                        <h3>Inject Queue</h3>
                        <div style={{ marginBottom: "1rem" }}>
                            <div className="form-group">
                                <input
                                    type="text"
                                    value={queueMessage}
                                    onChange={(e) => setQueueMessage(e.target.value)}
                                    placeholder="Inject message…"
                                    maxLength={200}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddToQueue()}
                                />
                            </div>
                            <div className="form-group" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                <select value={queueSeverity} onChange={(e) => setQueueSeverity(e.target.value)}
                                    style={{ flex: 1, background: "var(--color-surface)", color: "inherit", border: "1px solid var(--color-border-mid)", borderRadius: "4px", padding: "0.35rem 0.5rem" }}>
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="critical">Critical</option>
                                </select>
                                <select value={queueRoleFilter} onChange={(e) => setQueueRoleFilter(e.target.value)}
                                    style={{ flex: 1, background: "var(--color-surface)", color: "inherit", border: "1px solid var(--color-border-mid)", borderRadius: "4px", padding: "0.35rem 0.5rem" }}>
                                    <option value="">All roles</option>
                                    <option value="it-secops">IT / SecOps</option>
                                    <option value="legal">Legal</option>
                                    <option value="comms">Communications / PR</option>
                                    <option value="exec">Executive</option>
                                    <option value="security">Security</option>
                                    <option value="safety">Safety</option>
                                    <option value="medical">Medical</option>
                                    <option value="facilities">Facilities</option>
                                    <option value="evacuation">Evacuation</option>
                                    <option value="ed-charge">🏥 ED Charge Nurse</option>
                                    <option value="incident-commander">🎖️ Incident Commander</option>
                                    <option value="pio">📢 Public Information Officer</option>
                                    <option value="logistics">🚛 Logistics Officer</option>
                                    <option value="triage-officer">🏷️ Triage Officer</option>
                                    <option value="treatment-officer">💊 Treatment Officer</option>
                                    <option value="transport-officer">🚑 Transport Officer</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                <select value={queueChannel} onChange={(e) => setQueueChannel(e.target.value)}
                                    style={{ flex: 1, background: "var(--color-surface)", color: "inherit", border: "1px solid var(--color-border-mid)", borderRadius: "4px", padding: "0.35rem 0.5rem" }}>
                                    <option value="in-app">📲 In-App</option>
                                    <option value="email">📧 Email</option>
                                </select>
                                <select value={queuePressureType} onChange={(e) => setQueuePressureType(e.target.value)}
                                    style={{ flex: 1, background: "var(--color-surface)", color: "inherit", border: "1px solid var(--color-border-mid)", borderRadius: "4px", padding: "0.35rem 0.5rem" }}>
                                    <option value="">No pressure type</option>
                                    <option value="media">📰 Media / Press</option>
                                    <option value="regulator">🏛️ Regulator</option>
                                    <option value="customer">👤 Customer</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={queueRequiresApproval}
                                        onChange={(e) => setQueueRequiresApproval(e.target.checked)}
                                    />
                                    Requires approval from:
                                </label>
                                {queueRequiresApproval && (
                                    <select value={queueApprovalRole} onChange={(e) => setQueueApprovalRole(e.target.value)}
                                        style={{ flex: 1, background: "var(--color-surface)", color: "inherit", border: "1px solid var(--color-border-mid)", borderRadius: "4px", padding: "0.35rem 0.5rem" }}>
                                        <option value="">Select role…</option>
                                        <option value="it-secops">IT / SecOps</option>
                                        <option value="legal">Legal</option>
                                        <option value="comms">Communications / PR</option>
                                        <option value="exec">Executive</option>
                                        <option value="security">Security</option>
                                        <option value="safety">Safety</option>
                                        <option value="medical">Medical</option>
                                        <option value="facilities">Facilities</option>
                                        <option value="evacuation">Evacuation</option>
                                        <option value="ed-charge">🏥 ED Charge Nurse</option>
                                        <option value="incident-commander">🎖️ Incident Commander</option>
                                        <option value="pio">📢 Public Information Officer</option>
                                        <option value="logistics">🚛 Logistics Officer</option>
                                        <option value="triage-officer">🏷️ Triage Officer</option>
                                        <option value="treatment-officer">💊 Treatment Officer</option>
                                        <option value="transport-officer">🚑 Transport Officer</option>
                                    </select>
                                )}
                            </div>
                            <Button text="Add to Queue" onClick={handleAddToQueue} disabled={!queueMessage.trim()} />
                        </div>

                        {injectQueue.length === 0 ? (
                            <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>No injects queued yet.</p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                                {injectQueue.map((inj) => (
                                    <li key={inj.id} style={{
                                        padding: "0.6rem 0.75rem",
                                        marginBottom: "0.5rem",
                                        borderRadius: "6px",
                                        background: inj.released ? "rgba(40,180,40,0.08)" : "rgba(255,255,255,0.04)",
                                        border: `1px solid ${inj.released ? "rgba(40,180,40,0.3)" : "rgba(255,255,255,0.1)"}`,
                                        fontSize: "0.85rem",
                                    }}>
                                        {editingInjectId === inj.id ? (
                                            <div>
                                                <div className="form-group">
                                                    <input
                                                        type="text"
                                                        value={editMessage}
                                                        onChange={(e) => setEditMessage(e.target.value)}
                                                        maxLength={200}
                                                        style={{ width: "100%", fontSize: "0.85rem" }}
                                                    />
                                                </div>
                                                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
                                                    <select value={editSeverity} onChange={(e) => setEditSeverity(e.target.value)}
                                                        style={{ background: "var(--color-surface)", color: "inherit", border: "1px solid var(--color-border-mid)", borderRadius: "4px", padding: "0.2rem 0.4rem", fontSize: "0.8rem" }}>
                                                        <option value="info">Info</option>
                                                        <option value="warning">Warning</option>
                                                        <option value="critical">Critical</option>
                                                    </select>
                                                    <select value={editRoleFilter} onChange={(e) => setEditRoleFilter(e.target.value)}
                                                        style={{ background: "var(--color-surface)", color: "inherit", border: "1px solid var(--color-border-mid)", borderRadius: "4px", padding: "0.2rem 0.4rem", fontSize: "0.8rem" }}>
                                                        <option value="">All roles</option>
                                                        <option value="it-secops">IT / SecOps</option>
                                                        <option value="legal">Legal</option>
                                                        <option value="comms">Communications / PR</option>
                                                        <option value="exec">Executive</option>
                                                        <option value="security">Security</option>
                                                        <option value="safety">Safety</option>
                                                        <option value="medical">Medical</option>
                                                        <option value="facilities">Facilities</option>
                                                        <option value="evacuation">Evacuation</option>
                                                        <option value="ed-charge">🏥 ED Charge Nurse</option>
                                                        <option value="incident-commander">🎖️ Incident Commander</option>
                                                        <option value="pio">📢 Public Information Officer</option>
                                                        <option value="logistics">🚛 Logistics Officer</option>
                                                        <option value="triage-officer">🏷️ Triage Officer</option>
                                                        <option value="treatment-officer">💊 Treatment Officer</option>
                                                        <option value="transport-officer">🚑 Transport Officer</option>
                                                    </select>
                                                    <button onClick={handleSaveEditInject} style={{ fontSize: "0.8rem", padding: "0.2rem 0.6rem", cursor: "pointer" }}>Save</button>
                                                    <button onClick={() => setEditingInjectId(null)} style={{ fontSize: "0.8rem", padding: "0.2rem 0.6rem", cursor: "pointer" }}>Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                                                    <div>
                                                        <span style={{ opacity: 0.8 }}>[{inj.severity.toUpperCase()}]</span>
                                                        {inj.channel === "email" && <span style={{ marginLeft: "0.4rem", fontSize: "0.75rem", color: "rgb(80,180,255)" }}>📧 email</span>}
                                                        {inj.pressureType === "media" && <span style={{ marginLeft: "0.4rem", fontSize: "0.75rem", color: "rgb(255,200,40)" }}>📰 media</span>}
                                                        {inj.pressureType === "regulator" && <span style={{ marginLeft: "0.4rem", fontSize: "0.75rem", color: "rgb(180,120,255)" }}>🏛️ regulator</span>}
                                                        {inj.pressureType === "customer" && <span style={{ marginLeft: "0.4rem", fontSize: "0.75rem", color: "rgb(80,220,80)" }}>👤 customer</span>}
                                                        {inj.roleFilter && <span style={{ opacity: 0.7, marginLeft: "0.4rem" }}>→ {inj.roleFilter}</span>}
                                                        {inj.requiresApproval && <span style={{ marginLeft: "0.4rem", fontSize: "0.75rem", color: "rgb(255,165,0)" }}>🔐 needs approval ({inj.approvalRole || "any"})</span>}
                                                        {inj.approvedBy && <span style={{ marginLeft: "0.4rem", fontSize: "0.75rem", color: "rgb(80,220,80)" }}>✓ approved by {inj.approvedBy}</span>}
                                                        {inj.originalMessage && <span style={{ color: "rgb(255,180,40)", marginLeft: "0.4rem", fontSize: "0.75rem" }}>✏ edited</span>}
                                                        <span style={{ marginLeft: "0.5rem" }}>{inj.message}</span>
                                                        {inj.released && !inj.requiresApproval && <span style={{ marginLeft: "0.5rem", color: "rgb(80,220,80)", fontSize: "0.75rem" }}>✅ released {inj.releasedAt ? new Date(inj.releasedAt).toLocaleTimeString() : ""}</span>}
                                                        {inj.released && inj.requiresApproval && !inj.approvedAt && <span style={{ marginLeft: "0.5rem", color: "rgb(255,165,0)", fontSize: "0.75rem" }}>⏳ awaiting approval</span>}
                                                    </div>
                                                    {!inj.released && (
                                                        <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
                                                            <button onClick={() => handleStartEditInject(inj)} style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", cursor: "pointer" }}>✏ Edit</button>
                                                            <button onClick={() => handleReleaseInject(inj.id)} style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", cursor: "pointer", background: "rgba(80,220,80,0.15)", border: "1px solid rgba(80,220,80,0.4)", borderRadius: "4px", color: "rgb(80,220,80)" }}>▶ Release</button>
                                                        </div>
                                                    )}
                                                </div>
                                                {inj.released && inj.deliveryLog && inj.deliveryLog.length > 0 && (
                                                    <div style={{ marginTop: "0.4rem", paddingTop: "0.35rem", borderTop: "1px solid rgba(255,255,255,0.07)", fontSize: "0.75rem" }}>
                                                        <span style={{ opacity: 0.6, marginRight: "0.4rem" }}>📬 Delivered to:</span>
                                                        {inj.deliveryLog.map((d, di) => (
                                                            <span key={di} style={{ marginRight: "0.5rem", opacity: 0.8 }}>
                                                                {d.recipient}{d.role ? ` (${d.role})` : ""} via {d.channel === "email" ? "📧" : "📲"} {new Date(d.deliveredAt).toLocaleTimeString()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {inj.released && inj.acknowledgements && inj.acknowledgements.length > 0 && (
                                                    <div style={{ marginTop: "0.25rem", fontSize: "0.75rem" }}>
                                                        <span style={{ opacity: 0.6, marginRight: "0.4rem" }}>✅ Acknowledged:</span>
                                                        {inj.acknowledgements.map((a, ai) => (
                                                            <span key={ai} style={{ marginRight: "0.5rem", color: "rgb(80,220,80)" }}>
                                                                {a.displayName} {new Date(a.acknowledgedAt).toLocaleTimeString()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                {inj.released && inj.deliveryLog && inj.deliveryLog.length > 0 && (
                                                    <div style={{ marginTop: "0.2rem", fontSize: "0.75rem", opacity: 0.6 }}>
                                                        {inj.acknowledgements?.length ?? 0}/{inj.deliveryLog.length} acknowledged
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/** Admin inject panel — broadcast a custom event immediately to all participants. */}
                    <div className="dashboard-card">
                        <h3>Immediate Inject</h3>
                        <div className="form-group">
                            <input
                                type="text"
                                value={injectMessage}
                                onChange={(e) => setInjectMessage(e.target.value)}
                                placeholder="Enter event message..."
                                maxLength={200}
                                onKeyDown={(e) => e.key === "Enter" && handleInjectEvent()}
                            />
                        </div>
                        <div className="form-group">
                            <select
                                value={injectSeverity}
                                onChange={(e) => setInjectSeverity(e.target.value)}
                            >
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <Button
                            text={injectSending ? "Sending..." : "Inject Event"}
                            onClick={handleInjectEvent}
                            disabled={injectSending || !injectMessage.trim()}
                        />
                    </div>

                    {/** Action items captured by participants. */}
                    {actionItems.length > 0 && (
                        <div className="dashboard-card">
                            <h3>Action Items ({actionItems.length})</h3>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem" }}>
                                {actionItems.map((item, i) => (
                                    <li key={item.id || i} style={{ padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                        <span style={{ opacity: 0.7 }}>[{new Date(item.timestampIso).toLocaleTimeString()}]</span>
                                        {item.role && <span className="role-badge" style={{ marginLeft: "0.4rem", marginRight: "0.4rem" }}>{item.role}</span>}
                                        <strong>{item.capturedBy}</strong>
                                        {": "}
                                        {item.text}
                                        {item.assignedTo && <span style={{ opacity: 0.7, marginLeft: "0.4rem" }}>→ {item.assignedTo}</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {eventLog.length > 0 && (
                        <div className="dashboard-card">
                            <h3>Event Log</h3>
                            <ul>
                                {eventLog.map((entry, i) => (
                                    <li key={i}>
                                        <strong>[{entry.time}] {entry.title}:</strong> {entry.description}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/** Post session that displays final results (After-Action Review). */}
            {sessionState === "ended" && (() => {
                // Compute KPIs from the session event log
                const traineeDecisions = eventLog.filter(e => e.actorRole === "trainee" && e.isCorrect !== null && e.isCorrect !== undefined);
                const correctDecisions = traineeDecisions.filter(e => e.isCorrect === true).length;
                const overallAccuracy = traineeDecisions.length > 0 ? (correctDecisions / traineeDecisions.length * 100).toFixed(0) : null;
                const activeTrainees = new Set(traineeDecisions.map(e => e.displayName)).size;
                const participationRate = trainees.length > 0 ? (activeTrainees / trainees.length * 100).toFixed(0) : null;

                // Findings = incorrect decisions, tagged with a stable key for push-tracking
                const findings = eventLog
                    .filter(e => e.actorRole === "trainee" && e.isCorrect === false)
                    .map((e, idx) => ({ ...e, _findingKey: `finding-${idx}-${e.displayName}` }));

                // Standards reference for this scenario
                const standardsRef = getStandardsRef(scenarioKey);
                const unpushedFindings = findings.filter(f => !pushedToTracker.has(f._findingKey));

                // Role-based scorecard
                const roleScores = {};
                for (const t of trainees) {
                    if (t.role && !roleScores[t.role]) {
                        roleScores[t.role] = { correct: 0, total: 0, displayNames: [] };
                    }
                    if (t.role) roleScores[t.role].displayNames.push(t.displayName);
                }
                for (const entry of traineeDecisions) {
                    const trainee = trainees.find(t => t.displayName === entry.displayName);
                    const r = trainee?.role;
                    if (r && roleScores[r]) {
                        roleScores[r].total++;
                        if (entry.isCorrect) roleScores[r].correct++;
                    }
                }

                return (
                <div>
                    <div className="dashboard-card">
                        <h2>Session Report</h2>
                        <p><strong>Session Code:</strong> {sessionCode}</p>
                        <p><strong>Scenario:</strong> {scenarioName}</p>
                    </div>

                    {/** KPI summary cards */}
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div className="kpi-label">Participants</div>
                            <div className="kpi-value">{trainees.length}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-label">Participation Rate</div>
                            <div className="kpi-value">{participationRate != null ? `${participationRate}%` : "—"}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-label">Decision Accuracy</div>
                            <div className="kpi-value">{overallAccuracy != null ? `${overallAccuracy}%` : "—"}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-label">Total Decisions</div>
                            <div className="kpi-value">{traineeDecisions.length}</div>
                        </div>
                    </div>

                    {/** ─── FINDINGS LIST (AAR → Action Tracker) ─── */}
                    <div className="dashboard-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div>
                                <h3>Findings ({findings.length})</h3>
                                <p style={{ fontSize: "0.82rem", opacity: 0.7, marginTop: "0.2rem" }}>
                                    Incorrect decisions from this exercise. Push to the Action Tracker to assign owners and due dates.
                                </p>
                            </div>
                            {findings.length > 0 && (
                                <button
                                    onClick={() => handlePushAllFindings(findings)}
                                    disabled={pushingToTracker || unpushedFindings.length === 0}
                                    style={{ fontSize: "0.82rem", padding: "0.35rem 0.75rem", cursor: unpushedFindings.length === 0 ? "default" : "pointer", background: "rgba(80,160,255,0.15)", border: "1px solid rgba(80,160,255,0.4)", borderRadius: "6px", color: "rgb(120,190,255)", opacity: unpushedFindings.length === 0 ? 0.5 : 1 }}
                                >
                                    {unpushedFindings.length === 0 ? "✓ All pushed" : `Push All ${unpushedFindings.length} to Tracker`}
                                </button>
                            )}
                        </div>

                        {/** Standards alignment note */}
                        {findings.length > 0 && (
                            <div style={{ marginTop: "0.5rem", marginBottom: "0.75rem", fontSize: "0.78rem", opacity: 0.75, padding: "0.5rem 0.75rem", background: "rgba(80,160,255,0.06)", borderRadius: "6px", border: "1px solid rgba(80,160,255,0.15)" }}>
                                <strong>Standards Alignment:</strong> {standardsRef}
                            </div>
                        )}

                        {trackerPushMsg && (
                            <div style={{ marginBottom: "0.5rem", fontSize: "0.82rem", color: trackerPushMsg.includes("Failed") ? "rgb(255,80,80)" : "rgb(80,220,80)" }}>
                                {trackerPushMsg}
                            </div>
                        )}

                        {findings.length === 0 ? (
                            <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>No incorrect decisions recorded — great performance!</p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem" }}>
                                {findings.map((f) => {
                                    const pushed = pushedToTracker.has(f._findingKey);
                                    return (
                                        <li key={f._findingKey} style={{ padding: "0.45rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                                            <div>
                                                <span style={{ opacity: 0.7 }}>[{f.time}]</span>
                                                <span className="role-badge" style={{ marginLeft: "0.4rem", marginRight: "0.4rem" }}>{f.displayName}</span>
                                                <span style={{ color: "rgb(255,100,100)" }}>❌</span>
                                                <span style={{ marginLeft: "0.4rem" }}>{f.description}</span>
                                            </div>
                                            <button
                                                onClick={() => handlePushFinding(f)}
                                                disabled={pushed || pushingToTracker}
                                                style={{ flexShrink: 0, fontSize: "0.75rem", padding: "0.2rem 0.55rem", cursor: pushed ? "default" : "pointer", background: pushed ? "rgba(80,220,80,0.1)" : "rgba(80,160,255,0.12)", border: `1px solid ${pushed ? "rgba(80,220,80,0.3)" : "rgba(80,160,255,0.3)"}`, borderRadius: "4px", color: pushed ? "rgb(80,220,80)" : "rgb(120,190,255)", opacity: pushed ? 0.7 : 1 }}
                                            >
                                                {pushed ? "✓ Pushed" : "Push to Tracker"}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="dashboard-card">
                        <h3>Participants ({trainees.length})</h3>
                        <ul>
                            {trainees.map((t, i) => {
                                const stats = traineeScores.get(t.displayName);
                                const myDecisions = eventLog.filter(e => e.actorRole === "trainee" && e.displayName === t.displayName && e.isCorrect !== null && e.isCorrect !== undefined);
                                const myCorrect = myDecisions.filter(e => e.isCorrect === true).length;
                                const myAccuracy = myDecisions.length > 0 ? `${(myCorrect / myDecisions.length * 100).toFixed(0)}%` : null;
                                return (
                                    <li key={t.socketId || i} style={{ marginBottom: "0.35rem" }}>
                                        {t.displayName}
                                        {t.role && <span className="role-badge" style={{ marginLeft: "0.4rem" }}>{t.role}</span>}
                                        {" — "}
                                        <strong style={{ color: "rgb(80,220,80)" }}>
                                            {stats?.score ?? 0} pts
                                        </strong>
                                        {" "}({stats?.decisions ?? 0} decisions
                                        {myAccuracy != null && `, ${myAccuracy} accuracy`})
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/** Role-based scorecard */}
                    {Object.keys(roleScores).length > 0 && (
                        <div className="dashboard-card">
                            <h3>Role Scorecard</h3>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgb(80,80,80)", textAlign: "left" }}>
                                        <th style={{ padding: "0.4rem 0.5rem" }}>Role</th>
                                        <th style={{ padding: "0.4rem 0.5rem" }}>Decisions</th>
                                        <th style={{ padding: "0.4rem 0.5rem" }}>Accuracy</th>
                                        <th style={{ padding: "0.4rem 0.5rem" }}>Readiness</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(roleScores).map(([role, data]) => {
                                        const acc = data.total > 0 ? (data.correct / data.total * 100) : null;
                                        const accRatio = acc != null ? acc / 100 : null;
                                        const roleColor = accuracyColor(accRatio);
                                        const roleReadiness = readinessLabel(accRatio);
                                        return (
                                            <tr key={role} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                                <td style={{ padding: "0.4rem 0.5rem" }}><span className="role-badge">{role}</span></td>
                                                <td style={{ padding: "0.4rem 0.5rem" }}>{data.total}</td>
                                                <td style={{ padding: "0.4rem 0.5rem" }}>
                                                    {acc != null ? (
                                                        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                            <span style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: "99px", height: "6px", overflow: "hidden" }}>
                                                                <span style={{ display: "block", width: `${acc}%`, height: "100%", background: roleColor, borderRadius: "99px", transition: "width 0.4s" }} />
                                                            </span>
                                                            {acc.toFixed(0)}%
                                                        </span>
                                                    ) : "—"}
                                                </td>
                                                <td style={{ padding: "0.4rem 0.5rem", color: roleColor, fontWeight: 600 }}>{roleReadiness}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/** Action items captured during the session — push to tracker */}
                    {actionItems.length > 0 && (
                        <div className="dashboard-card">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                <h3 style={{ margin: 0 }}>Action Items ({actionItems.length})</h3>
                                <button
                                    onClick={handlePushActionItems}
                                    disabled={pushingToTracker || actionItems.every(item => pushedToTracker.has(`action-${item.id}`))}
                                    style={{ fontSize: "0.82rem", padding: "0.3rem 0.65rem", cursor: "pointer", background: "rgba(80,160,255,0.15)", border: "1px solid rgba(80,160,255,0.4)", borderRadius: "6px", color: "rgb(120,190,255)" }}
                                >
                                    Push to Action Tracker
                                </button>
                            </div>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem" }}>
                                {actionItems.map((item, i) => {
                                    const pushed = pushedToTracker.has(`action-${item.id}`);
                                    return (
                                        <li key={item.id || i} style={{ padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                                            <div>
                                                <span style={{ opacity: 0.7 }}>[{new Date(item.timestampIso).toLocaleTimeString()}]</span>
                                                {item.role && <span className="role-badge" style={{ marginLeft: "0.4rem", marginRight: "0.4rem" }}>{item.role}</span>}
                                                <strong>{item.capturedBy}</strong>
                                                {": "}
                                                {item.text}
                                                {item.assignedTo && <span style={{ opacity: 0.7, marginLeft: "0.4rem" }}>→ {item.assignedTo}</span>}
                                            </div>
                                            {pushed && <span style={{ fontSize: "0.75rem", color: "rgb(80,220,80)", flexShrink: 0 }}>✓ Pushed</span>}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}

                    {eventLog.length > 0 && (
                        <div className="dashboard-card">
                            <h3>Session Event Log</h3>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid rgb(80,80,80)", textAlign: "left" }}>
                                        <th style={{ padding: "0.4rem 0.5rem" }}>Time</th>
                                        <th style={{ padding: "0.4rem 0.5rem" }}>Trainee</th>
                                        <th style={{ padding: "0.4rem 0.5rem" }}>Decision</th>
                                        <th style={{ padding: "0.4rem 0.5rem" }}>Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {eventLog.map((entry, i) => (
                                        <tr
                                            key={i}
                                            style={{
                                                borderBottom: "1px solid rgba(255,255,255,0.05)",
                                                background:
                                                    entry.isCorrect === true
                                                        ? "rgba(40,180,40,0.08)"
                                                        : entry.isCorrect === false
                                                        ? "rgba(200,40,40,0.08)"
                                                        : "transparent",
                                            }}
                                        >
                                            <td style={{ padding: "0.4rem 0.5rem", opacity: 0.7 }}>{entry.time}</td>
                                            <td style={{ padding: "0.4rem 0.5rem" }}>{entry.title}</td>
                                            <td style={{ padding: "0.4rem 0.5rem" }}>{entry.description}</td>
                                            <td style={{ padding: "0.4rem 0.5rem" }}>
                                                {entry.isCorrect === true && (
                                                    <span style={{ color: "rgb(80,220,80)", fontWeight: 600 }}>✅ Correct</span>
                                                )}
                                                {entry.isCorrect === false && (
                                                    <span style={{ color: "rgb(255,100,100)", fontWeight: 600 }}>❌ Incorrect</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="session-actions">
                        <Button text="Start New Session" onClick={handleStartNewSession} />
                        <Button text="View Analytics" onClick={() => navigate("/analytics")} />
                        <Button text="Action Tracker" onClick={() => navigate("/action-tracker")} />
                        <Button text="Return to Home" onClick={() => navigate("/")} />
                        <Button text="Export Results" onClick={handleExportResults} />
                        <Button text="View HSEEP Report 📋" onClick={() => navigate("/hseep-report", { state: { sessionCode, scenarioKey } })} />
                    </div>

                    {/** ITSM push — only shown when at least one ITSM integration is configured. */}
                    {itsmIntegrations.length > 0 && (
                        <div className="dashboard-card" style={{ marginTop: "0.75rem" }}>
                            <h3>📤 Push Evidence Pack to ITSM</h3>
                            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                                Send the full session findings (participants, action items, decisions, KPIs) to your
                                configured ITSM or incident management platform.
                            </p>
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                {itsmIntegrations.map(integration => (
                                    <Button
                                        key={integration.id}
                                        text={itsmPushStatus === "pushing" ? "Pushing…" : `Push to ${integration.name}`}
                                        onClick={() => handlePushToItsm(integration.id)}
                                        disabled={itsmPushStatus === "pushing"}
                                    />
                                ))}
                            </div>
                            {itsmPushStatus === "ok" && (
                                <p style={{ color: "rgb(80,220,80)", fontSize: "0.85rem", marginTop: "0.5rem" }}>✅ {itsmPushMessage}</p>
                            )}
                            {itsmPushStatus === "error" && (
                                <p style={{ color: "rgb(255,100,100)", fontSize: "0.85rem", marginTop: "0.5rem" }}>❌ {itsmPushMessage}</p>
                            )}
                        </div>
                    )}
                </div>
                );
            })()}

            {/** End-session confirmation modal overlay. */}
            {showEndModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>End Session?</h2>
                        <p>Choose how you would like to proceed:</p>
                        <div className="modal-actions">
                            <Button text="Confirm End Session" onClick={handleConfirmEnd} />
                            <Button text="Start New Session" onClick={handleStartNewSession} />
                            <Button text="Return to Home" onClick={() => navigate("/")} />
                            <Button text="Export Results" onClick={handleExportResults} />
                            <Button text="Cancel" onClick={() => setShowEndModal(false)} />
                        </div>
                    </div>
                </div>
            )}
        </AdminDashboardLayout>
    );
}
