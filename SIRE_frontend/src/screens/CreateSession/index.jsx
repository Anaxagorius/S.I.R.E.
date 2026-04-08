/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-04-08
 * Description: Administrator screen for creating a new session.
 * Displays all available training scenarios with category and difficulty filtering.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateSessionLayout from "../../layouts/CreateSessionLayout";
import BackButton from "../../components/BackButton";
import { createSession } from "../../services/api/api";
import DEMO_SCENARIOS from "../../data/demoScenarios";

const CATEGORIES = ["All", "Physical", "Medical", "HAZMAT", "Threat", "Cyber"];
const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"];

/** Returns the CSS class name for a difficulty badge. */
function difficultyClass(difficulty) {
    if (difficulty === "Beginner") return "difficulty-beginner";
    if (difficulty === "Intermediate") return "difficulty-intermediate";
    if (difficulty === "Advanced") return "difficulty-advanced";
    return "";
}

/** Function that returns the CreateSession component for the admin session creation screen. */
export default function CreateSession() {

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [filterCategory, setFilterCategory] = useState("All");
    const [filterDifficulty, setFilterDifficulty] = useState("All");

    const navigate = useNavigate();

    /** Asynchronous function to handle session creation when a scenario card is clicked. */
    async function handleSelectScenario(scenario) {
        setLoading(true);
        setError(null);
        try {
            const data = await createSession(scenario.id);
            navigate("/admin-dashboard", {
                state: { sessionCode: data.sessionKey, scenarioKey: scenario.id },
            });
        } catch (err) {
            setError(err.message || "Failed to create session!");
        } finally {
            setLoading(false);
        }
    }

    const filteredScenarios = DEMO_SCENARIOS.filter(
        (s) =>
            (filterCategory === "All" || s.data?.category === filterCategory) &&
            (filterDifficulty === "All" || s.data?.difficulty === filterDifficulty)
    );

    return (
        <CreateSessionLayout>

            {/** Back navigation. */}
            <BackButton to="/" />

            {/** Category filter bar. */}
            <div className="filter-bar">
                <span className="filter-label">Category:</span>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        className={`filter-btn${filterCategory === cat ? " active" : ""}`}
                        onClick={() => setFilterCategory(cat)}
                        disabled={loading}
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
                        disabled={loading}
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
                                disabled={loading}
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

            {/** Creating session indicator. */}
            {loading && <div className="create-session-status"><p>Creating session...</p></div>}

            {/** Error message. */}
            {error && <div className="create-session-error">{error}</div>}

        </CreateSessionLayout>
    );
}
