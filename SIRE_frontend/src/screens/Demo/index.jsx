/**
 * Author: Leon Wasiliew
 * Last Update: 2026-04-01
 * Description: Demo mode scenario selection screen.
 * Allows users to pick a training scenario and launch the Trainee Interface
 * entirely in the browser — no backend connection required.
 * Supports category and difficulty filtering, and shows a difficulty badge on each card.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateSessionLayout from "../../layouts/CreateSessionLayout";
import DEMO_SCENARIOS from "../../data/demoScenarios";

const CATEGORIES = ["All", "Physical", "Medical", "HAZMAT", "Threat", "Cyber", "Network", "Web", "Cloud"];
const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"];

/** Returns the CSS class name for a difficulty badge. */
function difficultyClass(difficulty) {
    if (difficulty === "Beginner") return "difficulty-beginner";
    if (difficulty === "Intermediate") return "difficulty-intermediate";
    if (difficulty === "Advanced") return "difficulty-advanced";
    return "";
}

/** Function that returns the Demo component for frontend-only scenario selection. */
export default function Demo() {

    const navigate = useNavigate();

    const [filterCategory, setFilterCategory] = useState("All");
    const [filterDifficulty, setFilterDifficulty] = useState("All");

    /** Navigate to TraineeInterface with the full scenario data bundled in navigation state. */
    function handleSelectScenario(scenario) {
        navigate("/trainee-interface", {
            state: { scenarioData: scenario.data, demo: true },
        });
    }

    const filteredScenarios = DEMO_SCENARIOS.filter(
        (s) =>
            (filterCategory === "All" || s.data?.category === filterCategory) &&
            (filterDifficulty === "All" || s.data?.difficulty === filterDifficulty)
    );

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

            {/** Scenario selection cards. */}
            <div className="scenario-grid">
                {filteredScenarios.length === 0 ? (
                    <p style={{ opacity: 0.7 }}>No scenarios match the selected filters.</p>
                ) : (
                    filteredScenarios.map((scenario) => {
                        const difficulty = scenario.data?.difficulty || "";
                        return (
                            <button
                                key={scenario.id}
                                className="scenario-card"
                                onClick={() => handleSelectScenario(scenario)}
                            >
                                <span className="scenario-card-icon">{scenario.icon}</span>
                                <span className="scenario-card-name">{scenario.name}</span>
                                <span className="scenario-card-desc">{scenario.description}</span>
                                {difficulty && (
                                    <span className={`scenario-card-difficulty ${difficultyClass(difficulty)}`}>
                                        {difficulty}
                                    </span>
                                )}
                            </button>
                        );
                    })
                )}
            </div>

        </CreateSessionLayout>
    );
}
