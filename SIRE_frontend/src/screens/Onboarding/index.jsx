/**
 * Onboarding.jsx
 * Step-by-step onboarding guide that walks a new facilitator through
 * running their first S.I.R.E. tabletop exercise.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton";
import Button from "../../components/Button";
import "./Onboarding.css";

const STEPS = [
    {
        title: "Welcome to S.I.R.E.",
        icon: "🛡️",
        body: (
            <>
                <p>
                    <strong>S.I.R.E.</strong> (Simulation Incident Response Exercise) lets you run
                    realistic, scenario-driven tabletop exercises for your team — no special hardware
                    or software installation required.
                </p>
                <p>
                    This guide will walk you through creating and running your first exercise in
                    under five minutes.
                </p>
            </>
        ),
    },
    {
        title: "Step 1 — Choose a Scenario",
        icon: "📋",
        body: (
            <>
                <p>
                    S.I.R.E. ships with <strong>10 prebuilt scenarios</strong> covering common
                    incident types:
                </p>
                <ul>
                    <li>🔥 Fire evacuation</li>
                    <li>🌊 Flood response</li>
                    <li>💻 Cyber attack</li>
                    <li>🚑 Mass casualty</li>
                    <li>… and more</li>
                </ul>
                <p>
                    You can also build custom scenarios in the{" "}
                    <strong>Scenario Builder</strong> once you are comfortable with the platform.
                </p>
            </>
        ),
    },
    {
        title: "Step 2 — Create a Session",
        icon: "📡",
        body: (
            <>
                <p>
                    From the <strong>Admin Dashboard</strong>, select a scenario and click{" "}
                    <em>Create Session</em>. A unique <strong>six-character session code</strong> is
                    generated automatically.
                </p>
                <p>
                    Share this code with your participants — they join by visiting the app and
                    entering the code on the <em>Join Session</em> screen. No account is needed for
                    participants.
                </p>
            </>
        ),
    },
    {
        title: "Step 3 — Run the Exercise",
        icon: "▶️",
        body: (
            <>
                <p>
                    Once participants have joined you can see them on the roster. Press{" "}
                    <strong>Start Session</strong> to begin the scenario timeline.
                </p>
                <p>
                    Use the <strong>Inject Queue</strong> to send targeted injects (messages,
                    pressures, or decisions) to specific roles. You can pause the timeline at any
                    time to facilitate discussion, then resume when ready.
                </p>
                <p>
                    Mark injects as <em>Confidential</em> to keep facilitator-only notes hidden
                    from participants.
                </p>
            </>
        ),
    },
    {
        title: "Step 4 — Review & Export",
        icon: "📊",
        body: (
            <>
                <p>
                    When the exercise ends, an <strong>After-Action Review</strong> summarises
                    each participant's decisions, response times, and accuracy scores.
                </p>
                <p>
                    Results are automatically saved to the <strong>Analytics</strong> dashboard
                    for program-level trend reporting across all your exercises.
                </p>
                <p>
                    You can export a full session snapshot (JSON) from the dashboard for offline
                    review or record-keeping.
                </p>
            </>
        ),
    },
    {
        title: "You're ready!",
        icon: "✅",
        body: (
            <>
                <p>
                    That's everything you need to run your first exercise. Head to the{" "}
                    <strong>Admin Dashboard</strong> to get started.
                </p>
                <p>
                    Need to set up additional facilitator accounts? Log in as an admin user and
                    use the <strong>User Management</strong> panel in the Analytics screen to
                    promote participants to the facilitator role.
                </p>
            </>
        ),
    },
];

/** Onboarding wizard that guides new facilitators through their first exercise. */
export default function Onboarding() {
    const [step, setStep] = useState(0);
    const navigate = useNavigate();

    const isFirst = step === 0;
    const isLast = step === STEPS.length - 1;
    const current = STEPS[step];

    return (
        <div className="onboarding-page">
            <BackButton to="/admin" />

            <div className="onboarding-card">
                {/** Progress indicator */}
                <div className="onboarding-progress">
                    {STEPS.map((_, i) => (
                        <span
                            key={i}
                            className={`onboarding-dot${i === step ? " active" : i < step ? " done" : ""}`}
                        />
                    ))}
                </div>

                <div className="onboarding-icon">{current.icon}</div>
                <h2 className="onboarding-title">{current.title}</h2>
                <div className="onboarding-body">{current.body}</div>

                <div className="onboarding-actions">
                    {!isFirst && (
                        <Button text="← Back" onClick={() => setStep((s) => s - 1)} />
                    )}
                    {!isLast ? (
                        <Button text="Next →" onClick={() => setStep((s) => s + 1)} />
                    ) : (
                        <Button text="Go to Dashboard" onClick={() => navigate("/admin-dashboard")} />
                    )}
                </div>
            </div>
        </div>
    );
}
