/**
 * Author: Leon Wasiliew
 * Last Update: 2026-03-26
 * Description: Showcase/kiosk screen for auto-playing a looping demo of incident
 * response scenarios. Cycles through featured scenarios at 5 seconds each, with
 * automatic option selection animation, producing a clean ~10-second loop.
 * Suitable for screen recording or displaying on a kiosk/monitor on loop.
 *
 * Route: /showcase
 */

import { useEffect, useState } from "react";
import DEMO_SCENARIOS from "../../data/demoScenarios";
import "./Showcase.css";

/** Scenarios featured in the showcase loop (fire and cyber for visual contrast). */
const SHOWCASE_SCENARIOS = [
    DEMO_SCENARIOS.find((s) => s.id === "scenario_fire"),
    DEMO_SCENARIOS.find((s) => s.id === "scenario_cyber_attack"),
];

/**
 * Duration (ms) for each animation phase within one scenario cycle.
 * Total per scenario: 600 + 2400 + 1200 + 800 = 5000 ms
 * Full loop (2 scenarios): ~10 seconds.
 */
const PHASE_DURATIONS = {
    enter:  600,
    show:   2400,
    select: 1200,
    exit:   800,
};

/** Total cycle duration (ms) for one scenario, used to drive the progress bar. */
const CYCLE_DURATION = Object.values(PHASE_DURATIONS).reduce((a, b) => a + b, 0);

/** Function that returns the Showcase component for kiosk/demo loop display. */
export default function Showcase() {

    /** Index of the scenario currently being displayed. */
    const [scenarioIdx, setScenarioIdx] = useState(0);

    /** Current animation phase: "enter" | "show" | "select" | "exit". */
    const [phase, setPhase] = useState("enter");

    /**
     * Key that resets the progress-bar CSS animation each time a new scenario
     * begins (incrementing the key forces React to remount the element).
     */
    const [progressKey, setProgressKey] = useState(0);

    /** Advance through phases automatically, cycling to the next scenario on exit. */
    useEffect(() => {
        const timer = setTimeout(() => {
            if (phase === "enter") {
                setPhase("show");
            } else if (phase === "show") {
                setPhase("select");
            } else if (phase === "select") {
                setPhase("exit");
            } else if (phase === "exit") {
                setScenarioIdx((prev) => (prev + 1) % SHOWCASE_SCENARIOS.length);
                setProgressKey((prev) => prev + 1);
                setPhase("enter");
            }
        }, PHASE_DURATIONS[phase]);

        return () => clearTimeout(timer);
    }, [phase]);

    const scenario = SHOWCASE_SCENARIOS[scenarioIdx];
    const node = scenario.data.nodes[scenario.data.root];

    /** First option that leads to another node — treated as the "correct" response. */
    const correctOption = node.options.find((o) => o.outcome?.type === "node") || node.options[0];

    return (
        <div className={`showcase-container showcase-${phase}`}>

            {/** Scenario header: icon and name. */}
            <div className="showcase-header">
                <span className="showcase-icon">{scenario.icon}</span>
                <div className="showcase-header-text">
                    <h1 className="showcase-name">{scenario.name}</h1>
                    <p className="showcase-subtitle">Incident Response Simulation</p>
                </div>
            </div>

            {/** Decision node card: situation, question, and selectable options. */}
            <div className="showcase-card">
                <h2 className="showcase-node-title">{node.title}</h2>
                <p className="showcase-situation">{node.situation}</p>
                <hr className="showcase-divider" />
                <p className="showcase-question">{node.question}</p>

                <div className="showcase-options">
                    {node.options.map((opt) => (
                        <div
                            key={opt.label}
                            className={`showcase-option${phase === "select" && opt === correctOption ? " showcase-option-selected" : ""}`}
                        >
                            <span className="showcase-option-label">{opt.label}</span>
                            <span className="showcase-option-text">{opt.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/** Progress bar that drains over the full cycle duration. */}
            <div className="showcase-progress-track">
                <div
                    key={progressKey}
                    className="showcase-progress-bar"
                    style={{ animationDuration: `${CYCLE_DURATION}ms` }}
                />
            </div>

            {/** Branding footer. */}
            <p className="showcase-branding">S.I.R.E. — Simulated Incident Response Environment</p>

        </div>
    );
}
