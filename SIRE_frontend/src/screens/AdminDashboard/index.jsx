/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-25
 * Description: Administrator dashboard for managing session lifecycle.
 * Handles three states (waiting, active session, and post-session review).
 * Connects to the backend via Socket.IO to provide real-time session management.
 */

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import AdminDashboardLayout from "../../layouts/AdminDashboardLayout";
import Button from "../../components/Button";
import apiClient from "../../services/api/apiClient";
import { SOCKET_URL, SOCKET_API_KEY } from "../../services/socketConfig";

/** Function that returns the AdminDashboard component for managing and monitoring session flow. */
export default function AdminDashboard() {

    const location = useLocation();
    const navigate = useNavigate();

    /** Session code and scenario key passed via navigation state. */
    const sessionCode = location.state?.sessionCode || null;
    const scenarioKey = location.state?.scenarioKey || null;

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
            : "Unknown Scenario"
    );

    /** Error state for any backend or socket failures. */
    const [error, setError] = useState(null);

    /** Ref to persist the socket across renders. */
    const socketRef = useRef(null);

    /** Fetch scenario display name and connect to socket when session code is available. */
    useEffect(() => {
        if (!sessionCode) return;

        /** Fetch scenario name from backend if we have a scenario key. */
        if (scenarioKey) {
            apiClient.get("/scenarios").then((list) => {
                const found = list.find((s) => s.id === scenarioKey);
                if (found) setScenarioName(found.name);
            }).catch(() => {});
        }

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
    }, [sessionCode, scenarioKey]);

    /** Function that starts the session by emitting a socket event. */
    function handleStartSession() {
        if (!socketRef.current || !sessionCode) return;
        socketRef.current.emit("session:start", { sessionCode });
        setSessionState("active");
    }

    /** Function that ends the session by updating the session state to ended. */
    function handleEndSession() {
        setSessionState("ended");
    }

    /** Render a prompt if no session code was passed via navigation state. */
    if (!sessionCode) {
        return (
            <AdminDashboardLayout>
                <div className="dashboard-card">
                    <h2>No Active Session</h2>
                    <p>Please create a session first to access the dashboard.</p>
                </div>
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
                    <Button text="Start New Session" onClick={() => navigate("/create-session")} />
                </div>
            )}
        </AdminDashboardLayout>
    );
}
