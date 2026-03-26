/**
 * Author: Leon Wasiliew
 * Last Update: 2026-03-26
 * Description: Demo mode scenario selection screen.
 * Allows users to pick a training scenario and launch the Trainee Interface
 * entirely in the browser — no backend connection required.
 */

import { useNavigate } from "react-router-dom";
import CreateSessionLayout from "../../layouts/CreateSessionLayout";
import DEMO_SCENARIOS from "../../data/demoScenarios";

/** Function that returns the Demo component for frontend-only scenario selection. */
export default function Demo() {

    const navigate = useNavigate();

    /** Navigate to TraineeInterface with the full scenario data bundled in navigation state. */
    function handleSelectScenario(scenario) {
        navigate("/trainee-interface", {
            state: { scenarioData: scenario.data, demo: true },
        });
    }

    return (
        <CreateSessionLayout
            title="Demo Mode"
            description="Run a complete incident response exercise directly in your browser — no account, session code, or backend connection required."
        >

            {/** Intro card. */}
            <div className="scenario-card" style={{ cursor: "default", textAlign: "left", padding: "1rem 1.25rem" }}>
                <h2 style={{ marginBottom: "0.4rem" }}>Demo Mode</h2>
                <p style={{ margin: 0, opacity: 0.8 }}>
                    Select a scenario below to walk through a simulated incident response exercise.
                    No account or session code is required — everything runs locally in your browser.
                </p>
            </div>

            {/** Scenario selection cards. */}
            <div className="scenario-grid">
                {DEMO_SCENARIOS.map((scenario) => (
                    <button
                        key={scenario.id}
                        className="scenario-card"
                        onClick={() => handleSelectScenario(scenario)}
                    >
                        <span className="scenario-card-icon">{scenario.icon}</span>
                        <span className="scenario-card-name">{scenario.name}</span>
                        <span className="scenario-card-desc">{scenario.description}</span>
                    </button>
                ))}
            </div>

        </CreateSessionLayout>
    );
}
