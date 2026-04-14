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
import BackButton from "../../components/BackButton";
import { joinSession } from "../../services/api/api";

/** Function that returns the JoinSession component for trainee session entry. */
export default function JoinSession() {

    /** Constants for UI state. */
    const [sessionKey, setSessionKey] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [role, setRole] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    /** Asynchronous function to handle joining a session using the provided key. */
    async function handleJoinSession() {
        if (!sessionKey) {
            setError("Please enter a session key!");
            return;
        }
        if (!displayName.trim()) {
            setError("Please enter your name!");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await joinSession(sessionKey);
            const sessionCode = data.sessionKey;
            const scenarioKey = data.scenarioKey;
            const trimmedName = displayName.trim();

            /** Persist session state so TraineeInterface can recover if navigation state is lost. */
            try {
                sessionStorage.setItem("sire_sessionCode", sessionCode);
                sessionStorage.setItem("sire_scenarioKey", scenarioKey);
                sessionStorage.setItem("sire_displayName", trimmedName);
                if (role) sessionStorage.setItem("sire_role", role);
            } catch {
                // sessionStorage may be unavailable in some environments; silently ignore
            }

            navigate("/trainee-interface", {
                state: { sessionCode, scenarioKey, displayName: trimmedName, role: role || null },
            });
        } catch (error) {
            setError(error.message || "Failed to join session!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <JoinSessionLayout>

            {/** Back navigation. */}
            <BackButton to="/" />

            {/** Display name input. */}
            <div className="form-group">
                <label>Your Name</label>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name..."
                    maxLength={64}
                />
            </div>

            {/** Role selector. */}
            <div className="form-group">
                <label>Your Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="">Select a role (optional)</option>
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
