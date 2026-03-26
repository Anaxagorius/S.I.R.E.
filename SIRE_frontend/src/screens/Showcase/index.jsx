/**
 * Author: Leon Wasiliew
 * Last Update: 2026-03-26
 * Description: Enhanced Showcase/kiosk screen that simulates the full user journey:
 * landing page → Demo button → all eight scenario cards → scenario selection →
 * decision-node walkthrough (with live timeline alert banners) → loop.
 * Cycles through every scenario in sequence before returning to the landing page.
 * Suitable for screen recording or displaying on a kiosk/monitor on loop.
 *
 * Route: /showcase
 */

import { useEffect, useState } from "react";
import DEMO_SCENARIOS from "../../data/demoScenarios";
import "./Showcase.css";

/**
 * Duration (ms) for each phase of the kiosk state machine.
 *
 * Per-scenario timing (approximate, varies by node count):
 *   Landing:           3 000 + 1 500 = 4 500 ms
 *   Scenario list:       600 + 2 500 + 1 500 = 4 600 ms
 *   Per node (no alert): 600 + 2 500 + 1 500 = 4 600 ms
 *   Per node (alert):    600 + 2 500 + 2 000 + 1 500 = 6 600 ms
 *   Scenario end:      2 500 + 800 = 3 300 ms
 */
const DURATIONS = {
    "landing-show":              3000,
    "landing-demo-highlight":    1500,
    "demo-list-enter":            600,
    "demo-list-show":            2500,
    "demo-list-card-highlight":  1500,
    "play-node-enter":            600,
    "play-node-show":            2500,
    "play-node-timeline":        2000,
    "play-option-highlight":     1500,
    "play-scenario-end":         2500,
    "loop-exit":                  800,
};

/** Function that returns the Showcase component for kiosk/demo loop display. */
export default function Showcase() {

    /** Current phase driving the kiosk state machine. */
    const [phase, setPhase] = useState("landing-show");

    /** Index (0–7) of the scenario currently featured in this loop iteration. */
    const [scenarioIdx, setScenarioIdx] = useState(0);

    /** ID of the decision node being displayed during scenario playthrough. */
    const [nodeId, setNodeId] = useState(null);

    /** Index (0–7) of the scenario card highlighted on the selection screen. */
    const [highlightedCardIdx, setHighlightedCardIdx] = useState(null);

    /** Index of the response option highlighted during the option-select phase. */
    const [highlightedOptionIdx, setHighlightedOptionIdx] = useState(null);

    /** Index of the next timeline event to display as an alert banner. */
    const [timelineIdx, setTimelineIdx] = useState(0);

    /** Key incremented each loop to force-reset the progress-bar CSS animation. */
    const [progressKey, setProgressKey] = useState(0);

    /**
     * Advance the state machine after each phase's duration.
     * All transitions are calculated from closed-over state, so every variable
     * that affects the next state is included in the dependency array.
     */
    useEffect(() => {
        const duration = DURATIONS[phase] ?? 2000;
        const scenario = DEMO_SCENARIOS[scenarioIdx];

        const timer = setTimeout(() => {

            if (phase === "landing-show") {
                setPhase("landing-demo-highlight");

            } else if (phase === "landing-demo-highlight") {
                setPhase("demo-list-enter");

            } else if (phase === "demo-list-enter") {
                setHighlightedCardIdx(scenarioIdx);
                setPhase("demo-list-show");

            } else if (phase === "demo-list-show") {
                setPhase("demo-list-card-highlight");

            } else if (phase === "demo-list-card-highlight") {
                setNodeId(scenario.data.root);
                setTimelineIdx(0);
                setHighlightedOptionIdx(null);
                setPhase("play-node-enter");

            } else if (phase === "play-node-enter") {
                setPhase("play-node-show");

            } else if (phase === "play-node-show") {
                const node = scenario.data.nodes[nodeId];

                if (!node?.options?.length) {
                    /** Terminal node (e.g. "Scenario Complete") — finish the playthrough. */
                    setPhase("play-scenario-end");
                } else {
                    const timeline = scenario.data.timeline || [];
                    if (timelineIdx < timeline.length) {
                        setPhase("play-node-timeline");
                    } else {
                        const optIdx = node.options.findIndex((o) => o.outcome?.type === "node");
                        setHighlightedOptionIdx(optIdx >= 0 ? optIdx : 0);
                        setPhase("play-option-highlight");
                    }
                }

            } else if (phase === "play-node-timeline") {
                const node = scenario.data.nodes[nodeId];
                const optIdx = node?.options?.findIndex((o) => o.outcome?.type === "node") ?? -1;
                setHighlightedOptionIdx(optIdx >= 0 ? optIdx : 0);
                setTimelineIdx((prev) => prev + 1);
                setPhase("play-option-highlight");

            } else if (phase === "play-option-highlight") {
                const node = scenario.data.nodes[nodeId];
                const option = node?.options?.[highlightedOptionIdx];

                if (option?.outcome?.type === "node") {
                    /** Follow the correct path to the next node. */
                    setNodeId(option.outcome.target);
                    setHighlightedOptionIdx(null);
                    setPhase("play-node-enter");
                } else {
                    /** No valid next node — end the scenario. */
                    setPhase("play-scenario-end");
                }

            } else if (phase === "play-scenario-end") {
                setPhase("loop-exit");

            } else if (phase === "loop-exit") {
                setScenarioIdx((prev) => (prev + 1) % DEMO_SCENARIOS.length);
                setProgressKey((prev) => prev + 1);
                setNodeId(null);
                setHighlightedCardIdx(null);
                setHighlightedOptionIdx(null);
                setPhase("landing-show");
            }

        }, duration);

        return () => clearTimeout(timer);
    }, [phase, nodeId, scenarioIdx, timelineIdx, highlightedOptionIdx]);

    const scenario      = DEMO_SCENARIOS[scenarioIdx];
    const currentNode   = nodeId ? scenario?.data?.nodes?.[nodeId] : null;
    const timelineEvents = scenario?.data?.timeline || [];
    const currentAlert  = timelineIdx < timelineEvents.length ? timelineEvents[timelineIdx] : null;

    /** Derived booleans for cleaner conditional rendering. */
    const isLanding   = phase === "landing-show" || phase === "landing-demo-highlight";
    const isDemoList  = phase === "demo-list-enter" || phase === "demo-list-show" || phase === "demo-list-card-highlight";
    const isPlay      = phase.startsWith("play-") && phase !== "play-scenario-end";
    const isEnd       = phase === "play-scenario-end" || phase === "loop-exit";
    const isFadingOut = phase === "loop-exit";

    return (
        <div className={`showcase-container${isFadingOut ? " kiosk-fade-out" : ""}`}>

            {/* ── LANDING PAGE SIMULATION ─────────────────────────────── */}
            {isLanding && (
                <div className="kiosk-layout kiosk-fade-in">

                    {/** Left sidebar: branding, navigation buttons, about text. */}
                    <div className="kiosk-sidebar">
                        <div>
                            <div className="kiosk-logo">S.I.R.E.</div>
                            <p className="kiosk-logo-sub">Simulated Incident Response Environment</p>

                            <div className="kiosk-btn-group">
                                <div className="kiosk-btn">Trainee</div>
                                <div className="kiosk-btn">Admin</div>
                                <div className={`kiosk-btn${phase === "landing-demo-highlight" ? " kiosk-btn-active" : ""}`}>
                                    Demo
                                    {phase === "landing-demo-highlight" && (
                                        <span className="kiosk-click-hint">← click</span>
                                    )}
                                </div>
                                <div className="kiosk-btn">Showcase</div>
                            </div>
                        </div>

                        <div className="kiosk-about">
                            <h3>About S.I.R.E.</h3>
                            <hr className="kiosk-hr" />
                            <p>
                                The Simulated Incident Response Environment guides teams through
                                realistic emergency scenarios in an interactive, guided exercise.
                            </p>
                        </div>
                    </div>

                    {/** Right panel: hero display of all scenario icons. */}
                    <div className="kiosk-main kiosk-main-landing">
                        <div className="kiosk-landing-hero">
                            <div className="kiosk-landing-icons">
                                {DEMO_SCENARIOS.map((s) => (
                                    <span key={s.id} className="kiosk-hero-icon">{s.icon}</span>
                                ))}
                            </div>
                            <p className="kiosk-landing-tagline">Emergency Response Training Simulations</p>
                            <p className="kiosk-landing-sub">Eight incident scenarios. Real decisions. No risk.</p>
                        </div>
                    </div>

                </div>
            )}

            {/* ── DEMO SCENARIO LIST SIMULATION ───────────────────────── */}
            {isDemoList && (
                <div className={`kiosk-layout${phase === "demo-list-enter" ? " kiosk-fade-in" : ""}`}>

                    {/** Left sidebar: branding and demo-mode description. */}
                    <div className="kiosk-sidebar">
                        <div>
                            <div className="kiosk-logo">S.I.R.E.</div>
                            <p className="kiosk-logo-sub">Simulated Incident Response Environment</p>
                        </div>
                        <div className="kiosk-section">
                            <h3>Demo Mode</h3>
                            <p>
                                Select a scenario to run a complete incident response exercise
                                entirely in your browser — no account or session code required.
                            </p>
                        </div>
                    </div>

                    {/** Right panel: 4×2 grid of all eight scenario cards. */}
                    <div className="kiosk-main">
                        <h2 className="kiosk-panel-title">Choose a Scenario</h2>
                        <div className="kiosk-scenario-grid">
                            {DEMO_SCENARIOS.map((s, i) => (
                                <div
                                    key={s.id}
                                    className={`kiosk-scenario-card${
                                        i === highlightedCardIdx && phase === "demo-list-card-highlight"
                                            ? " kiosk-scenario-card-selected"
                                            : ""
                                    }`}
                                >
                                    <span className="kiosk-card-icon">{s.icon}</span>
                                    <span className="kiosk-card-name">{s.name}</span>
                                    <span className="kiosk-card-desc">{s.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}

            {/* ── SCENARIO PLAYTHROUGH SIMULATION ─────────────────────── */}
            {isPlay && currentNode && (
                <div className={`kiosk-layout${phase === "play-node-enter" ? " kiosk-fade-in" : ""}`}>

                    {/** Left sidebar: branding and current scenario badge. */}
                    <div className="kiosk-sidebar">
                        <div>
                            <div className="kiosk-logo">S.I.R.E.</div>
                            <p className="kiosk-logo-sub">Simulated Incident Response Environment</p>
                        </div>
                        <div className="kiosk-section">
                            <h3>Trainee Interface</h3>
                            <div className="kiosk-scenario-badge">
                                <span className="kiosk-badge-icon">{scenario.icon}</span>
                                <div>
                                    <span className="kiosk-badge-name">{scenario.name}</span>
                                    <span className="kiosk-badge-sub">Incident Simulation</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/** Right panel: optional alert banner then the decision node card. */}
                    <div className="kiosk-main kiosk-main-scroll">

                        {/** Live timeline alert — shown only during play-node-timeline. */}
                        {phase === "play-node-timeline" && currentAlert && (
                            <div className="kiosk-alert-banner kiosk-slide-in">
                                <span className="kiosk-alert-icon">🚨</span>
                                <div className="kiosk-alert-body">
                                    <strong className="kiosk-alert-title">{currentAlert.title}</strong>
                                    <p className="kiosk-alert-desc">{currentAlert.description}</p>
                                </div>
                            </div>
                        )}

                        {/** Decision node card: situation, question, and response options. */}
                        <div className="showcase-card">
                            <h2 className="showcase-node-title">{currentNode.title}</h2>
                            <p className="showcase-situation">{currentNode.situation}</p>
                            <hr className="showcase-divider" />
                            <p className="showcase-question">{currentNode.question}</p>

                            <div className="showcase-options">
                                {currentNode.options.map((opt, i) => (
                                    <div
                                        key={opt.label}
                                        className={`showcase-option${
                                            phase === "play-option-highlight" && i === highlightedOptionIdx
                                                ? " showcase-option-selected"
                                                : ""
                                        }`}
                                    >
                                        <span className="showcase-option-label">{opt.label}</span>
                                        <span className="showcase-option-text">{opt.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                </div>
            )}

            {/* ── SCENARIO COMPLETE ────────────────────────────────────── */}
            {isEnd && (
                <div className="kiosk-layout kiosk-fade-in">

                    <div className="kiosk-sidebar">
                        <div>
                            <div className="kiosk-logo">S.I.R.E.</div>
                            <p className="kiosk-logo-sub">Simulated Incident Response Environment</p>
                        </div>
                    </div>

                    <div className="kiosk-main kiosk-main-end">
                        <span className="kiosk-end-icon">{scenario.icon}</span>
                        <h2 className="kiosk-end-title">{scenario.name}</h2>
                        <p className="kiosk-end-subtitle">Scenario Complete</p>
                        <p className="kiosk-end-desc">All incidents successfully managed.</p>
                    </div>

                </div>
            )}

            {/* ── SCENARIO INDICATOR (dots) ────────────────────────────── */}
            <div className="kiosk-scenario-dots">
                {DEMO_SCENARIOS.map((_, i) => (
                    <span key={i} className={`kiosk-dot${i === scenarioIdx ? " kiosk-dot-active" : ""}`} />
                ))}
            </div>

            {/* ── PROGRESS BAR ─────────────────────────────────────────── */}
            <div className="showcase-progress-track">
                <div
                    key={progressKey}
                    className="showcase-progress-bar"
                    style={{ animationDuration: "120000ms" }}
                />
            </div>

            {/* ── BRANDING ─────────────────────────────────────────────── */}
            <p className="showcase-branding">S.I.R.E. — Simulated Incident Response Environment</p>

        </div>
    );
}
