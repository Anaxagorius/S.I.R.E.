/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-23
 * Description: Administrator dashboard for managing session lifecycle.
 * Handles three states (waiting, active session, and post-session review).
 */

import { useState } from "react";
import AdminDashboardLayout from "../../layouts/AdminDashboardLayout";
import Button from "../../components/Button";

/** Function that returns the AdminDashboard component for managing and monitoring session flow. */
export default function AdminDashboard() {

    /** Constant for tracking the current session state. */
    const [sessionState, setSessionState] = useState("waiting");

    /** Constant for mock data (NOTE: replace with backend later). */
    const [trainees] = useState([
        { id: 1, name: "Trainee 1", stage: 1, time: "00:15" },
        { id: 2, name: "Trainee 2", stage: 2, time: "00:45" },
    ]);

    /** Function that starts the session by updating the session state to active. */
    function handleStartSession() {
        setSessionState("active");
    }

    /** Function that ends the session by updating the session state to ended. */
    function handleEndSession() {
        setSessionState("ended");
    }

    return (
        <AdminDashboardLayout>

            {/** Waiting state that displays joined trainees. */}
            {sessionState === "waiting" && (
                <div className="dashboard-card">
                    <h2>Waiting for Trainees</h2>
                    <p>{trainees.length} / 10 joined</p>
                    <ul>
                        {trainees.map(t => (
                            <li key={t.id}>{t.name}</li>
                        ))}
                    </ul>
                    <Button text="Start Session" onClick={handleStartSession} />
                </div>
            )}

            {/** Active session that displays live trainee progress. */}
            {sessionState === "active" && (
                <div>
                    <div className="dashboard-card">
                        <h2>Session in Progress</h2>
                        <p>Monitoring trainee progress</p>
                    </div>
                    <div className="dashboard-card">
                        <h3>Trainee Status</h3>
                        <ul>
                            {trainees.map(t => (
                                <li key={t.id}>
                                    {t.name} - Stage {t.stage} - {t.time}
                                </li>
                            ))}
                        </ul>
                    </div>
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
                        <h3>Results</h3>
                        <ul>
                            {trainees.map(t => (
                                <li key={t.id}>
                                    {t.name} - Final Stage {t.stage} - {t.time}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <Button text="Start New Session" onClick={() => setSessionState("waiting")} />
                </div>
            )}
        </AdminDashboardLayout>
    )
}
