/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-25
 * Description: Administrator dashboard for managing session lifecycle.
 * Handles four states (selecting scenario, waiting, active session, and post-session review).
 * Connects to the backend via Socket.IO to provide real-time session management.
 */

import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import AdminDashboardLayout from "../../layouts/AdminDashboardLayout";
import Button from "../../components/Button";
import apiClient from "../../services/api/apiClient";
import { getScenarios } from "../../services/api/api";
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
};

/** Function that returns the AdminDashboard component for managing and monitoring session flow. */
export default function AdminDashboard() {

    const location = useLocation();

    /** Session code and scenario key — may be seeded from navigation state or set after scenario selection. */
    const [sessionCode, setSessionCode] = useState(location.state?.sessionCode || null);
    const [scenarioKey, setScenarioKey] = useState(location.state?.scenarioKey || null);

    /** State for tracking whether a session is currently being created. */
    const [sessionCreating, setSessionCreating] = useState(false);

    /** Constant for tracking the current session state. */
    const [sessionState, setSessionState] = useState("waiting");

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
            setEventLog((prev) => [
                ...prev,
                {
                    title: `${payload.displayName} (${payload.actorRole})`,
                    description: payload.action,
                    time: new Date().toLocaleTimeString(),
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
            const data = await apiClient.post("/sessions", { scenario: scenario.id });
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
        setTrainees([]);
        setEventLog([]);
        setError(null);
    }

    /** Function that ends the session by updating the session state to ended. */
    function handleEndSession() {
        setSessionState("ended");
    }


    /** Scenario selection — shown when no session is active. */
    if (!sessionCode) {
        return (
            <AdminDashboardLayout>

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

                {/** Scenario cards grid. */}
                <div className="scenario-grid">
                    {scenariosLoading ? (
                        <p>Loading scenarios...</p>
                    ) : scenariosError ? (
                        <p style={{ color: "rgb(255,80,80)" }}>{scenariosError}</p>
                    ) : (
                        scenarios.map((scenario) => (
                            <button
                                key={scenario.id}
                                className="scenario-card"
                                onClick={() => handleSelectScenario(scenario)}
                                disabled={sessionCreating}
                            >
                                <span className="scenario-card-icon">{scenario.icon}</span>
                                <span className="scenario-card-name">{scenario.name}</span>
                                <span className="scenario-card-desc">{scenario.description}</span>
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

            {/** Waiting state that displays joined trainees. */}
            {sessionState === "waiting" && (
                <div className="dashboard-card">
                    <h2>Waiting for Trainees</h2>
                    <p>{trainees.length} / 10 joined</p>
                    <ul>
                        {trainees.map((t, i) => (
                            <li key={t.socketId || i}>{t.displayName}</li>
                        ))}
                    </ul>
                    <Button text="Start Session" onClick={handleStartSession} />
                </div>
            )}

            {/** Active session that displays live trainee progress and event log. */}
            {sessionState === "active" && (
                <div>
                    <div className="dashboard-card">
                        <h2>Session in Progress</h2>
                        <p>Monitoring trainee activity</p>
                    </div>
                    <div className="dashboard-card">
                        <h3>Trainees ({trainees.length})</h3>
                        <ul>
                            {trainees.map((t, i) => (
                                <li key={t.socketId || i}>{t.displayName}</li>
                            ))}
                        </ul>
                    </div>
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
                    <Button text="End Session" onClick={handleEndSession} />
                </div>
            )}

            {/** Post session that displays final results. */}
            {sessionState === "ended" && (
                <div>
                    <div className="dashboard-card">
                        <h2>Session Complete</h2>
                        <p>Review trainee performance</p>
                    </div>
                    <div className="dashboard-card">
                        <h3>Participants ({trainees.length})</h3>
                        <ul>
                            {trainees.map((t, i) => (
                                <li key={t.socketId || i}>{t.displayName}</li>
                            ))}
                        </ul>
                    </div>
                    {eventLog.length > 0 && (
                        <div className="dashboard-card">
                            <h3>Session Event Log</h3>
                            <ul>
                                {eventLog.map((entry, i) => (
                                    <li key={i}>
                                        <strong>[{entry.time}] {entry.title}:</strong> {entry.description}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <Button text="Start New Session" onClick={handleStartNewSession} />
                </div>
            )}
        </AdminDashboardLayout>
    );
}
