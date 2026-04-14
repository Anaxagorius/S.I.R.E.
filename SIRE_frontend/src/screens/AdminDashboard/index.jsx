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
import { getScenarios, createSession } from "../../services/api/api";
import { SOCKET_URL, SOCKET_API_KEY } from "../../services/socketConfig";

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

const CATEGORIES = ["All", "Physical", "Medical", "HAZMAT", "Threat", "Cyber"];
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
    const [filterCategory, setFilterCategory] = useState("All");
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

    /** State for editing a queued inject. */
    const [editingInjectId, setEditingInjectId] = useState(null);
    const [editMessage, setEditMessage] = useState("");
    const [editSeverity, setEditSeverity] = useState("info");
    const [editRoleFilter, setEditRoleFilter] = useState("");

    /** Action items captured during the session. */
    const [actionItems, setActionItems] = useState([]);

    /** State for the end-session confirmation modal. */
    const [showEndModal, setShowEndModal] = useState(false);

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
            /** Detect correct vs incorrect decisions by tracking score changes per trainee. */
            let isCorrect = null;
            if (payload.actorRole === "trainee" && payload.score !== undefined && payload.displayName) {
                const prevScore = traineeScoreRef.current.get(payload.displayName) ?? 0;
                isCorrect = payload.score > prevScore;
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
        setEditingInjectId(null);
        setActionItems([]);
    }

    /** Function that opens the end-session confirmation modal. */
    function handleEndSession() {
        setShowEndModal(true);
    }

    /** Function that confirms session end and transitions to the ended state. */
    function handleConfirmEnd() {
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
        });
        setQueueMessage("");
        setQueueSeverity("info");
        setQueueRoleFilter("");
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
                <BackButton to="/" />

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
                                </select>
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
                                                    </select>
                                                    <button onClick={handleSaveEditInject} style={{ fontSize: "0.8rem", padding: "0.2rem 0.6rem", cursor: "pointer" }}>Save</button>
                                                    <button onClick={() => setEditingInjectId(null)} style={{ fontSize: "0.8rem", padding: "0.2rem 0.6rem", cursor: "pointer" }}>Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                                                <div>
                                                    <span style={{ opacity: 0.8 }}>[{inj.severity.toUpperCase()}]</span>
                                                    {inj.roleFilter && <span style={{ opacity: 0.7, marginLeft: "0.4rem" }}>→ {inj.roleFilter}</span>}
                                                    {inj.originalMessage && <span style={{ color: "rgb(255,180,40)", marginLeft: "0.4rem", fontSize: "0.75rem" }}>✏ edited</span>}
                                                    <span style={{ marginLeft: "0.5rem" }}>{inj.message}</span>
                                                    {inj.released && <span style={{ marginLeft: "0.5rem", color: "rgb(80,220,80)", fontSize: "0.75rem" }}>✅ released {inj.releasedAt ? new Date(inj.releasedAt).toLocaleTimeString() : ""}</span>}
                                                </div>
                                                {!inj.released && (
                                                    <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
                                                        <button onClick={() => handleStartEditInject(inj)} style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", cursor: "pointer" }}>✏ Edit</button>
                                                        <button onClick={() => handleReleaseInject(inj.id)} style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", cursor: "pointer", background: "rgba(80,220,80,0.15)", border: "1px solid rgba(80,220,80,0.4)", borderRadius: "4px", color: "rgb(80,220,80)" }}>▶ Release</button>
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
            {sessionState === "ended" && (
                <div>
                    <div className="dashboard-card">
                        <h2>Session Report</h2>
                        <p><strong>Session Code:</strong> {sessionCode}</p>
                        <p><strong>Scenario:</strong> {scenarioName}</p>
                    </div>

                    <div className="dashboard-card">
                        <h3>Participants ({trainees.length})</h3>
                        <ul>
                            {trainees.map((t, i) => {
                                const stats = traineeScores.get(t.displayName);
                                return (
                                    <li key={t.socketId || i}>
                                        {t.displayName}
                                        {t.role && <span className="role-badge" style={{ marginLeft: "0.4rem" }}>{t.role}</span>}
                                        {" — "}
                                        <strong style={{ color: "rgb(80,220,80)" }}>
                                            {stats?.score ?? 0} pts
                                        </strong>
                                        {" "}({stats?.decisions ?? 0} decisions)
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

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
                        <Button text="Return to Home" onClick={() => navigate("/")} />
                        <Button text="Export Results" onClick={handleExportResults} />
                    </div>
                </div>
            )}

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
