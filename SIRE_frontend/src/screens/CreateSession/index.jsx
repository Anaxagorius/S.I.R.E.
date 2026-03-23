/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-22
 * Description: Administrator screen for creating a new session.
 * Allows the user to select a scenario, configure basic options,
 * and generate a session key to share with trainees.
 */

import { useEffect, useState } from "react";
import CreateSessionLayout from "../../layouts/CreateSessionLayout";
import Button from "../../components/Button";
import apiClient from "../../services/api/apiClient";

/** Function that returns the CreateSession component for the admin session creation screen. */
export default function CreateSession() {

    /** Constants for scenarios and selection state. */
    const [scenarios, setScenarios] = useState([]);
    const [selectedScenario, setSelectedScenario] = useState("");

    /** Constants for UI state. */
    const [sessionKey, setSessionKey] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    /** Lambda function to fetch available scenarios from the backend on mount. */
    useEffect(() => {
        async function fetchScenarios() {
            try {
                const data = await apiClient.get("/scenarios");
                setScenarios(data);
            } catch {
                setError("Failed to load scenarios!");
            }
        }
        fetchScenarios();
    }, []);

    /** Asynchronous function to handle session creation. */
    async function handleCreateSession() {
        if (!selectedScenario) {
            setError("Please select a scenario!");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.post("/sessions", {
                scenario: selectedScenario,
            });
            setSessionKey(data.sessionKey);
        } catch (error) {
            setError(error.message || "Failed to create session!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <CreateSessionLayout>

            {/** Scenario selection. */}
            <div className="form-group">
                <label>Select Scenario</label>
                <select
                    value={selectedScenario}
                    onChange={(e) => setSelectedScenario(e.target.value)}
                >
                    <option value="">Select a scenario</option>
                    {scenarios.map((scenario) => (
                        <option key={scenario.id} value={scenario.id}>
                            {scenario.name}
                        </option>
                    ))}
                </select>
            </div>

            {/** Create session button. */}
            <Button
                text={loading ? "Creating Session..." : "Create Session"}
                onClick={handleCreateSession}
                disabled={loading}
            />

            {/** Display session key. */}
            {sessionKey && (
                <div className="session-key">
                    <h3>Session Key</h3>
                    <p>{sessionKey}</p>
                    <p>Share this key with trainees to join the session.</p>
                </div>
            )}

            {/** Error message. */}
            {error && <div className="error">{error}</div>}

        </CreateSessionLayout>
    );
}
