/**
 * HseepReport screen
 * Displays a HSEEP-aligned After-Action Report for a completed EMS/Medical session.
 */

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton";
import { getHseepReport } from "../../services/api/api";

export default function HseepReport() {
    const location = useLocation();
    const navigate = useNavigate();

    const sessionCode = location.state?.sessionCode || new URLSearchParams(location.search).get("sessionCode");
    const scenarioKey = location.state?.scenarioKey || new URLSearchParams(location.search).get("scenarioKey");

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!sessionCode) {
            setError("No session code provided.");
            setLoading(false);
            return;
        }
        let cancelled = false;
        async function fetchReport() {
            try {
                const data = await getHseepReport(sessionCode);
                if (!cancelled) setReport(data);
            } catch (err) {
                if (!cancelled) setError(err.message || "Failed to load HSEEP report.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchReport();
        return () => { cancelled = true; };
    }, [sessionCode]);

    function handleExportJson() {
        if (!report) return;
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `hseep-report-${report.sessionCode || "session"}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return (
        <div className="page-container" style={{ maxWidth: "860px", margin: "0 auto", padding: "1.5rem" }}>
            <BackButton to="/admin-dashboard" />

            {loading && <p style={{ opacity: 0.7 }}>Loading HSEEP report…</p>}

            {error && (
                <div className="dashboard-card" style={{ borderColor: "rgb(200,40,40)" }}>
                    <p style={{ color: "rgb(255,80,80)" }}>{error}</p>
                </div>
            )}

            {report && (
                <div>
                    {/* Header */}
                    <div className="dashboard-card">
                        <h2>HSEEP After-Action Report</h2>
                        <p><strong>Session Code:</strong> {report.sessionCode}</p>
                        <p><strong>Scenario:</strong> {report.scenarioKey}</p>
                        <p style={{ fontSize: "0.82rem", opacity: 0.6 }}>
                            Generated: {new Date(report.generatedAt).toLocaleString()}
                        </p>
                        <div style={{ marginTop: "0.75rem" }}>
                            <button
                                onClick={handleExportJson}
                                style={{ padding: "0.4rem 0.85rem", borderRadius: "6px", fontSize: "0.82rem", cursor: "pointer", background: "rgba(80,160,255,0.15)", border: "1px solid rgba(80,160,255,0.4)", color: "rgb(120,190,255)" }}
                            >
                                Export JSON
                            </button>
                        </div>
                    </div>

                    {/* Exercise Objectives */}
                    <div className="dashboard-card">
                        <h3>Exercise Objectives</h3>
                        <ul style={{ paddingLeft: "1.2rem", fontSize: "0.9rem", lineHeight: 1.7 }}>
                            {report.exerciseObjectives.map((obj, i) => (
                                <li key={i}>{obj}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Core Capabilities */}
                    <div className="dashboard-card">
                        <h3>Core Capabilities Assessed</h3>
                        <ul style={{ paddingLeft: "1.2rem", fontSize: "0.9rem", lineHeight: 1.7 }}>
                            {report.coreCapabilities.map((cap, i) => (
                                <li key={i}>{cap}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Strengths */}
                    <div className="dashboard-card">
                        <h3>Strengths</h3>
                        {report.strengths.length === 0 ? (
                            <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>No correct decisions recorded.</p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem" }}>
                                {report.strengths.map((s, i) => (
                                    <li key={i} style={{ padding: "0.35rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                        <span style={{ color: "rgb(80,220,80)", marginRight: "0.4rem" }}>✅</span>
                                        {s.participant && <strong style={{ marginRight: "0.4rem" }}>{s.participant}</strong>}
                                        {s.role && <span className="role-badge" style={{ marginRight: "0.4rem" }}>{s.role}</span>}
                                        {s.description}
                                        {s.timestamp && <span style={{ opacity: 0.5, marginLeft: "0.5rem", fontSize: "0.8rem" }}>{new Date(s.timestamp).toLocaleTimeString()}</span>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Areas for Improvement */}
                    <div className="dashboard-card">
                        <h3>Areas for Improvement</h3>
                        {report.areasForImprovement.length === 0 ? (
                            <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>No incorrect decisions recorded.</p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem" }}>
                                {report.areasForImprovement.map((a, i) => (
                                    <li key={i} style={{ padding: "0.35rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                        <span style={{ color: "rgb(255,100,100)", marginRight: "0.4rem" }}>❌</span>
                                        {a.participant && <strong style={{ marginRight: "0.4rem" }}>{a.participant}</strong>}
                                        {a.role && <span className="role-badge" style={{ marginRight: "0.4rem" }}>{a.role}</span>}
                                        {a.description}
                                        {a.timestamp && <span style={{ opacity: 0.5, marginLeft: "0.5rem", fontSize: "0.8rem" }}>{new Date(a.timestamp).toLocaleTimeString()}</span>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Corrective Actions */}
                    <div className="dashboard-card">
                        <h3>Corrective Actions</h3>
                        {report.correctiveActions.length === 0 ? (
                            <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>No corrective actions captured.</p>
                        ) : (
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem" }}>
                                {report.correctiveActions.map((item, i) => (
                                    <li key={item.id || i} style={{ padding: "0.35rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                        <span style={{ opacity: 0.7, marginRight: "0.4rem" }}>[{item.status || "open"}]</span>
                                        {item.capturedBy && <strong style={{ marginRight: "0.4rem" }}>{item.capturedBy}</strong>}
                                        {item.text}
                                        {item.owner && <span style={{ opacity: 0.6, marginLeft: "0.4rem" }}>Owner: {item.owner}</span>}
                                        {item.dueDate && <span style={{ opacity: 0.6, marginLeft: "0.4rem" }}>Due: {item.dueDate}</span>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* MCI Decision Log */}
                    {report.decisionLog && report.decisionLog.length > 0 && (
                        <div className="dashboard-card">
                            <h3>MCI Decision Log</h3>
                            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.85rem" }}>
                                {report.decisionLog.map((d) => (
                                    <li key={d.id} style={{ padding: "0.35rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                        <span style={{ opacity: 0.6, marginRight: "0.4rem" }}>{new Date(d.timestamp).toLocaleTimeString()}</span>
                                        <strong>{d.decision}</strong>
                                        {d.madeBy && <span style={{ opacity: 0.7 }}> — {d.madeBy}</span>}
                                        {d.rationale && <span style={{ opacity: 0.6, marginLeft: "0.4rem", fontStyle: "italic" }}>{d.rationale}</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Participants and Roles */}
                    <div className="dashboard-card">
                        <h3>Participants &amp; Roles</h3>
                        <p style={{ fontSize: "0.85rem" }}>
                            <strong>Total Participants:</strong> {report.participantCount}
                        </p>
                        {report.roles.length > 0 && (
                            <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                {report.roles.map(role => (
                                    <span key={role} className="role-badge">{role}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
