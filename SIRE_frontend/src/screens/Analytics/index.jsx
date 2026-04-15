/**
 * Author: Copilot
 * Description: Program-level analytics dashboard.
 * Displays KPI summary, role breakdown, trend view of recent exercises, and top performance gaps.
 * Data is loaded from the backend via GET /api/analytics.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboardLayout from "../../layouts/AdminDashboardLayout";
import BackButton from "../../components/BackButton";
import { getAnalytics, getUsers, setUserRole } from "../../services/api/api";
import { useAuth } from "../../context/AuthContext";
import { accuracyColor, readinessLabel, formatScenarioName } from "../../utils/scoringUtils";
import "./Analytics.css";

/** Human-readable labels for role keys. */
const ROLE_LABELS = {
    "it-secops":  "IT / SecOps",
    "legal":      "Legal",
    "comms":      "Communications / PR",
    "exec":       "Executive",
    "security":   "Security",
    "safety":     "Safety",
    "medical":    "Medical",
    "facilities": "Facilities",
    "evacuation": "Evacuation",
};

/** Format milliseconds as a human-readable duration string. */
function formatMs(ms) {
    if (ms == null) return "—";
    if (ms < 1000) return `${ms}ms`;
    const s = (ms / 1000).toFixed(1);
    return `${s}s`;
}

/** Format a decimal ratio as a percentage string. */
function fmtPct(v) {
    if (v == null) return "—";
    return `${(v * 100).toFixed(0)}%`;
}

/** Format an ISO timestamp as a short local date string. */
function fmtDate(iso) {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
        return iso;
    }
}

/** Function that returns the Analytics screen component. */
export default function Analytics() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /** User management state — only loaded for admin users. */
    const [users, setUsers] = useState(null);
    const [usersLoading, setUsersLoading] = useState(false);
    const [roleUpdating, setRoleUpdating] = useState(null);
    const [roleError, setRoleError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const result = await getAnalytics();
                if (!cancelled) setData(result);
            } catch (err) {
                if (!cancelled) setError(err.message || "Failed to load analytics.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    /** Load user list for admin users. */
    useEffect(() => {
        if (currentUser?.role !== "admin") return;
        setUsersLoading(true);
        getUsers()
            .then((list) => setUsers(list))
            .catch(() => setUsers([]))
            .finally(() => setUsersLoading(false));
    }, [currentUser]);

    /** Handle role change for a user. */
    async function handleRoleChange(userId, newRole) {
        setRoleUpdating(userId);
        setRoleError(null);
        try {
            await setUserRole(userId, newRole);
            setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            setRoleError(err.message || "Failed to update role");
        } finally {
            setRoleUpdating(null);
        }
    }

    if (loading) {
        return (
            <AdminDashboardLayout>
                <BackButton to="/" />
                <div className="dashboard-card"><p>Loading analytics…</p></div>
            </AdminDashboardLayout>
        );
    }

    if (error) {
        return (
            <AdminDashboardLayout>
                <BackButton to="/" />
                <div className="dashboard-card" style={{ borderColor: "rgb(200,40,40)" }}>
                    <p style={{ color: "rgb(255,80,80)" }}>{error}</p>
                </div>
            </AdminDashboardLayout>
        );
    }

    const summary = data?.summary || {};
    const recentSessions = data?.recentSessions || [];
    const roleBreakdown = data?.roleBreakdown || {};
    const topGaps = data?.topGaps || [];

    const hasData = summary.totalExercises > 0;

    return (
        <AdminDashboardLayout>
            <BackButton to="/" />

            <div className="dashboard-card">
                <h2>📊 Analytics Dashboard</h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                    Program-level performance metrics across all completed exercises.
                </p>
            </div>

            {!hasData && (
                <div className="dashboard-card">
                    <p style={{ opacity: 0.65 }}>No exercise data yet. Complete a session to see analytics here.</p>
                    <button
                        className="filter-btn active"
                        style={{ marginTop: "0.75rem" }}
                        onClick={() => navigate("/admin-dashboard")}
                    >
                        Start a Session
                    </button>
                </div>
            )}

            {hasData && (
                <>
                    {/** KPI Summary Cards */}
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div className="kpi-label">Exercises Run</div>
                            <div className="kpi-value">{summary.totalExercises}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-label">Avg Participants</div>
                            <div className="kpi-value">{summary.avgParticipants ?? "—"}</div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-label">Overall Accuracy</div>
                            <div className="kpi-value" style={{ color: accuracyColor(summary.avgAccuracy) }}>
                                {fmtPct(summary.avgAccuracy)}
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-label">Avg Time-to-Decision</div>
                            <div className="kpi-value">{formatMs(summary.avgTimeToDecisionMs)}</div>
                        </div>
                    </div>

                    {/** Top Gaps */}
                    {topGaps.length > 0 && (
                        <div className="dashboard-card">
                            <h3>🎯 Top Performance Gaps</h3>
                            <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                                Roles with the lowest decision accuracy — prioritise these for targeted training.
                            </p>
                            <div className="gap-list">
                                {topGaps.map((gap, i) => (
                                    <div key={gap.role} className="gap-item">
                                        <div className="gap-rank">#{i + 1}</div>
                                        <div className="gap-role">
                                            <span className="role-badge">{gap.role}</span>
                                            <span style={{ marginLeft: "0.5rem", fontSize: "0.85rem" }}>{ROLE_LABELS[gap.role] || gap.role}</span>
                                        </div>
                                        <div className="gap-bar-wrap">
                                            <div
                                                className="gap-bar"
                                                style={{
                                                    width: `${(gap.avgAccuracy * 100).toFixed(0)}%`,
                                                    background: accuracyColor(gap.avgAccuracy),
                                                }}
                                            />
                                        </div>
                                        <div className="gap-pct" style={{ color: accuracyColor(gap.avgAccuracy) }}>
                                            {fmtPct(gap.avgAccuracy)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/** Role Breakdown */}
                    {Object.keys(roleBreakdown).length > 0 && (
                        <div className="dashboard-card">
                            <h3>👥 Role Performance Breakdown</h3>
                            <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                                Average accuracy and decision speed across all exercises per role.
                            </p>
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th>Role</th>
                                        <th>Sessions</th>
                                        <th>Accuracy</th>
                                        <th>Avg Decision Time</th>
                                        <th>Readiness</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(roleBreakdown)
                                        .sort(([, a], [, b]) => (b.avgAccuracy ?? 0) - (a.avgAccuracy ?? 0))
                                        .map(([role, stats]) => {
                                            const color = accuracyColor(stats.avgAccuracy);
                                            return (
                                                <tr key={role}>
                                                    <td>
                                                        <span className="role-badge">{role}</span>
                                                        <span style={{ marginLeft: "0.4rem", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                                                            {ROLE_LABELS[role] || ""}
                                                        </span>
                                                    </td>
                                                    <td>{stats.sessionCount}</td>
                                                    <td>
                                                        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                            <span className="accuracy-track">
                                                                <span
                                                                    className="accuracy-fill"
                                                                    style={{
                                                                        width: stats.avgAccuracy != null ? `${(stats.avgAccuracy * 100).toFixed(0)}%` : "0%",
                                                                        background: color,
                                                                    }}
                                                                />
                                                            </span>
                                                            <span style={{ color }}>{fmtPct(stats.avgAccuracy)}</span>
                                                        </span>
                                                    </td>
                                                    <td>{formatMs(stats.avgDecisionTimeMs)}</td>
                                                    <td style={{ color, fontWeight: 600 }}>{readinessLabel(stats.avgAccuracy)}</td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/** Trend View — recent sessions */}
                    {recentSessions.length > 0 && (
                        <div className="dashboard-card">
                            <h3>📈 Exercise Trend</h3>
                            <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                                Last {recentSessions.length} completed exercise{recentSessions.length !== 1 ? "s" : ""}.
                            </p>

                            {/** Mini bar chart: accuracy per session */}
                            <div className="trend-bars">
                                {[...recentSessions].reverse().map((s) => {
                                    const pct = s.overallAccuracy != null ? s.overallAccuracy * 100 : null;
                                    const color = accuracyColor(s.overallAccuracy);
                                    const label = formatScenarioName(s.scenarioKey) || s.sessionCode;
                                    return (
                                        <div key={s.id} className="trend-bar-col" title={`${label} — ${fmtPct(s.overallAccuracy)} accuracy`}>
                                            <div className="trend-bar-track">
                                                <div
                                                    className="trend-bar-fill"
                                                    style={{
                                                        height: pct != null ? `${pct}%` : "4px",
                                                        background: color,
                                                    }}
                                                />
                                            </div>
                                            <div className="trend-bar-label">{label}</div>
                                        </div>
                                    );
                                })}
                            </div>

                            <table className="analytics-table" style={{ marginTop: "1rem" }}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Scenario</th>
                                        <th>Participants</th>
                                        <th>Accuracy</th>
                                        <th>Participation</th>
                                        <th>Milestones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentSessions.map((s) => (
                                        <tr key={s.id}>
                                            <td style={{ opacity: 0.7 }}>{fmtDate(s.endedAt)}</td>
                                            <td>{formatScenarioName(s.scenarioKey) || s.sessionCode}</td>
                                            <td>{s.participantCount}</td>
                                            <td style={{ color: accuracyColor(s.overallAccuracy) }}>{fmtPct(s.overallAccuracy)}</td>
                                            <td>{fmtPct(s.participationRate)}</td>
                                            <td>{s.milestonesCompleted ?? "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/** User Management — admin only */}
            {currentUser?.role === "admin" && (
                <div className="dashboard-card">
                    <h3>👤 User Management</h3>
                    <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                        Manage system roles for all registered users. Promote participants to facilitator or admin.
                    </p>
                    {roleError && <p style={{ color: "rgb(255,80,80)", marginBottom: "0.5rem" }}>{roleError}</p>}
                    {usersLoading ? (
                        <p style={{ opacity: 0.6 }}>Loading users…</p>
                    ) : users && users.length > 0 ? (
                        <table className="analytics-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Current Role</th>
                                    <th>Change Role</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td>{u.name}</td>
                                        <td style={{ opacity: 0.75 }}>{u.email}</td>
                                        <td>
                                            <span className="role-badge">{u.role}</span>
                                        </td>
                                        <td>
                                            {u.id === currentUser?.id ? (
                                                <span style={{ opacity: 0.5, fontSize: "0.8rem" }}>You</span>
                                            ) : (
                                                <select
                                                    value={u.role}
                                                    disabled={roleUpdating === u.id}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    style={{
                                                        background: "var(--color-surface-alt, #0f172a)",
                                                        color: "var(--color-text, #f1f5f9)",
                                                        border: "1px solid var(--color-border, #334155)",
                                                        borderRadius: "4px",
                                                        padding: "0.2rem 0.4rem",
                                                        fontSize: "0.85rem",
                                                    }}
                                                >
                                                    <option value="participant">participant</option>
                                                    <option value="facilitator">facilitator</option>
                                                    <option value="admin">admin</option>
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p style={{ opacity: 0.6 }}>No users found.</p>
                    )}
                </div>
            )}
        </AdminDashboardLayout>
    );
}
