/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-25
 * Description: Administrator screen for creating a new session.
 * Displays 8 scenario cards the admin can click to immediately create and launch a session.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateSessionLayout from "../../layouts/CreateSessionLayout";
import apiClient from "../../services/api/apiClient";

/** Static list of the 8 available training scenarios. */
const STATIC_SCENARIOS = [
    { id: "scenario_fire",                     icon: "🔥", name: "Fire",                    description: "A fire starts in a storage area and spreads toward occupied floors." },
    { id: "scenario_flood",                    icon: "🌊", name: "Flood",                   description: "Burst water main begins flooding lower levels." },
    { id: "scenario_medical_emergency",        icon: "🚑", name: "Medical Emergency",        description: "A medical emergency occurs during a busy shift." },
    { id: "scenario_severe_weather",           icon: "⛈️", name: "Severe Weather",           description: "Severe weather warnings threaten facility operations." },
    { id: "scenario_cyber_attack",             icon: "💻", name: "Cyber Attack",             description: "A coordinated phishing and ransomware attack targets staff systems." },
    { id: "scenario_hazardous_material_spill", icon: "☣️", name: "Hazardous Material Spill", description: "A corrosive chemical spill in a lab corridor escalates over time." },
    { id: "scenario_active_threat",            icon: "🚨", name: "Active Threat",            description: "An active threat reported near main entrance escalates to facility-wide lockdown." },
    { id: "scenario_power_outage",             icon: "🔌", name: "Power Outage",             description: "A facility-wide power outage interrupts critical systems." },
];

/** Function that returns the CreateSession component for the admin session creation screen. */
export default function CreateSession() {

    /** Constants for UI state. */
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    /** Asynchronous function to handle session creation when a scenario card is clicked. */
    async function handleSelectScenario(scenario) {
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.post("/sessions", {
                scenario: scenario.id,
            });
            navigate("/admin-dashboard", {
                state: { sessionCode: data.sessionKey, scenarioKey: scenario.id },
            });
        } catch (err) {
            setError(err.message || "Failed to create session!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <CreateSessionLayout>

            {/** Scenario selection cards. */}
            <div className="scenario-grid">
                {STATIC_SCENARIOS.map((scenario) => (
                    <button
                        key={scenario.id}
                        className="scenario-card"
                        onClick={() => handleSelectScenario(scenario)}
                        disabled={loading}
                    >
                        <span className="scenario-card-icon">{scenario.icon}</span>
                        <span className="scenario-card-name">{scenario.name}</span>
                        <span className="scenario-card-desc">{scenario.description}</span>
                    </button>
                ))}
            </div>

            {/** Creating session indicator. */}
            {loading && <div className="create-session-status"><p>Creating session...</p></div>}

            {/** Error message. */}
            {error && <div className="create-session-error">{error}</div>}

        </CreateSessionLayout>
    );
}
