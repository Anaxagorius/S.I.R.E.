/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-25
 * Description: Trainee screen for joining a session.
 * Allows the user to enter a session key and join an active simulation.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import JoinSessionLayout from "../../layouts/JoinSessionLayout";
import Button from "../../components/Button";
import apiClient from "../../services/api/apiClient";

/** Function that returns the JoinSession component for trainee session entry. */
export default function JoinSession() {

    /** Constants for UI state. */
    const [sessionKey, setSessionKey] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    /** Asynchronous function to handle joining a session using the provided key. */
    async function handleJoinSession() {
        if (!sessionKey) {
            setError("Please enter a session key!");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.post("/sessions/join", { sessionKey });
            navigate("/trainee-interface", {
                state: { sessionCode: data.sessionKey, scenarioKey: data.scenarioKey },
            });
        } catch (error) {
            setError(error.message || "Failed to join session!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <JoinSessionLayout>

            {/** Session key input. */}
            <div className="form-group">
                <label>Session Key</label>
                <input
                    type="text"
                    value={sessionKey}
                    onChange={(e) => setSessionKey(e.target.value)}
                    placeholder="Enter session key..."
                />
            </div>

            {/** Join session button. */}
            <Button
                text={loading ? "Joining..." : "Join Session"}
                onClick={handleJoinSession}
                disabled={loading}
            />

            {/** Error message. */}
            {error && <div className="error">{error}</div>}

        </JoinSessionLayout>
    )
}
