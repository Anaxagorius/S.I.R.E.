/**
 * ActionTracker/index.jsx
 * Persistent action-task tracker screen.
 *
 * Displays all action tasks pushed from AARs across all sessions.
 * Supports filtering by status, inline owner/due-date/status editing,
 * and closure tracking with per-session grouping.
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboardLayout from "../../layouts/AdminDashboardLayout";
import BackButton from "../../components/BackButton";
import { getActionTasks, updateActionTask } from "../../services/api/api";
import "./ActionTracker.css";

const STATUS_LABELS = {
    open: "Open",
    "in-progress": "In Progress",
    closed: "Closed",
};

const STATUS_COLORS = {
    open: "rgb(255,180,40)",
    "in-progress": "rgb(80,160,255)",
    closed: "rgb(80,220,80)",
};

const SOURCE_LABELS = {
    aar_finding: "AAR Finding",
    aar_action:  "AAR Action",
    live:        "Live Session",
};

/** Format YYYY-MM-DD as a short human-readable string. */
function fmtDate(dateStr) {
    if (!dateStr) return "—";
    try {
        return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
        return dateStr;
    }
}

/** Returns true if the given YYYY-MM-DD date is in the past (overdue). */
function isOverdue(dateStr, status) {
    if (!dateStr || status === "closed") return false;
    return new Date(dateStr + "T23:59:59") < new Date();
}

/** Function that returns the ActionTracker screen component. */
export default function ActionTracker() {
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterSource, setFilterSource] = useState("all");
    const [savingId, setSavingId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editDraft, setEditDraft] = useState({});
    const [saveError, setSaveError] = useState(null);

    const loadTasks = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getActionTasks();
            setTasks(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || "Failed to load action tasks.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    /** Compute summary counts. */
    const total   = tasks.length;
    const open    = tasks.filter(t => t.status === "open").length;
    const inProg  = tasks.filter(t => t.status === "in-progress").length;
    const closed  = tasks.filter(t => t.status === "closed").length;
    const overdue = tasks.filter(t => isOverdue(t.due_date, t.status)).length;

    /** Apply filters. */
    const visible = tasks.filter(t => {
        if (filterStatus !== "all" && t.status !== filterStatus) return false;
        if (filterSource !== "all" && t.source !== filterSource) return false;
        return true;
    });

    /** Begin editing a task row. */
    function handleEdit(task) {
        setEditingId(task.id);
        setEditDraft({
            owner: task.owner || "",
            dueDate: task.due_date || "",
            status: task.status || "open",
            standardsRef: task.standards_ref || "",
        });
        setSaveError(null);
    }

    /** Cancel editing. */
    function handleCancelEdit() {
        setEditingId(null);
        setEditDraft({});
        setSaveError(null);
    }

    /** Save edits for a task. */
    async function handleSave(taskId) {
        setSavingId(taskId);
        setSaveError(null);
        try {
            const updated = await updateActionTask(taskId, {
                owner: editDraft.owner || null,
                dueDate: editDraft.dueDate || null,
                status: editDraft.status || "open",
                standardsRef: editDraft.standardsRef || null,
            });
            setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
            setEditingId(null);
            setEditDraft({});
        } catch (err) {
            setSaveError(err.message || "Failed to save task.");
        } finally {
            setSavingId(false);
        }
    }

    /** Quick-close a task without opening the edit form. */
    async function handleQuickClose(task) {
        setSavingId(task.id);
        setSaveError(null);
        try {
            const updated = await updateActionTask(task.id, {
                owner: task.owner || null,
                dueDate: task.due_date || null,
                status: "closed",
                standardsRef: task.standards_ref || null,
            });
            setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
        } catch (err) {
            setSaveError(err.message || "Failed to close task.");
        } finally {
            setSavingId(null);
        }
    }

    return (
        <AdminDashboardLayout>
            <BackButton to="/" />

            <div className="dashboard-card">
                <h2>Action Tracker</h2>
                <p>Manage findings and improvement actions captured from After-Action Reviews.</p>
            </div>

            {/** Summary KPI bar */}
            <div className="at-kpi-bar">
                <div className="at-kpi">
                    <span className="at-kpi-value">{total}</span>
                    <span className="at-kpi-label">Total</span>
                </div>
                <div className="at-kpi">
                    <span className="at-kpi-value" style={{ color: STATUS_COLORS.open }}>{open}</span>
                    <span className="at-kpi-label">Open</span>
                </div>
                <div className="at-kpi">
                    <span className="at-kpi-value" style={{ color: STATUS_COLORS["in-progress"] }}>{inProg}</span>
                    <span className="at-kpi-label">In Progress</span>
                </div>
                <div className="at-kpi">
                    <span className="at-kpi-value" style={{ color: STATUS_COLORS.closed }}>{closed}</span>
                    <span className="at-kpi-label">Closed</span>
                </div>
                {overdue > 0 && (
                    <div className="at-kpi">
                        <span className="at-kpi-value" style={{ color: "rgb(255,80,80)" }}>{overdue}</span>
                        <span className="at-kpi-label">Overdue</span>
                    </div>
                )}
            </div>

            {/** Filter bar */}
            <div className="at-filter-bar">
                <span className="filter-label">Status:</span>
                {["all", "open", "in-progress", "closed"].map(s => (
                    <button
                        key={s}
                        className={`filter-btn${filterStatus === s ? " active" : ""}`}
                        onClick={() => setFilterStatus(s)}
                    >
                        {s === "all" ? "All" : STATUS_LABELS[s]}
                    </button>
                ))}
                <span className="filter-label" style={{ marginLeft: "1rem" }}>Source:</span>
                {["all", "aar_finding", "aar_action", "live"].map(src => (
                    <button
                        key={src}
                        className={`filter-btn${filterSource === src ? " active" : ""}`}
                        onClick={() => setFilterSource(src)}
                    >
                        {src === "all" ? "All" : SOURCE_LABELS[src]}
                    </button>
                ))}
            </div>

            {error && (
                <div className="dashboard-card" style={{ borderColor: "rgb(200,40,40)" }}>
                    <p style={{ color: "rgb(255,80,80)" }}>{error}</p>
                </div>
            )}

            {saveError && (
                <div className="dashboard-card" style={{ borderColor: "rgb(200,40,40)" }}>
                    <p style={{ color: "rgb(255,80,80)" }}>{saveError}</p>
                </div>
            )}

            {loading ? (
                <div className="dashboard-card"><p>Loading tasks...</p></div>
            ) : visible.length === 0 ? (
                <div className="dashboard-card">
                    <p style={{ opacity: 0.6 }}>
                        {tasks.length === 0
                            ? "No action tasks yet. Push findings from an After-Action Review to get started."
                            : "No tasks match the selected filters."}
                    </p>
                </div>
            ) : (
                <div className="dashboard-card" style={{ padding: 0, overflow: "hidden" }}>
                    <table className="at-table">
                        <thead>
                            <tr>
                                <th style={{ width: "35%" }}>Finding / Action</th>
                                <th>Status</th>
                                <th>Owner</th>
                                <th>Due Date</th>
                                <th>Standards</th>
                                <th>Session</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map(task => {
                                const overdueFl = isOverdue(task.due_date, task.status);
                                const isEditing = editingId === task.id;
                                const isSaving  = savingId === task.id;

                                return (
                                    <tr
                                        key={task.id}
                                        className={`at-row${overdueFl ? " at-row-overdue" : ""}${task.status === "closed" ? " at-row-closed" : ""}`}
                                    >
                                        <td className="at-cell-text">
                                            <span className="at-source-badge">{SOURCE_LABELS[task.source] || task.source}</span>
                                            <span style={{ marginLeft: "0.4rem" }}>{task.text}</span>
                                        </td>

                                        {isEditing ? (
                                            <>
                                                <td>
                                                    <select
                                                        value={editDraft.status}
                                                        onChange={e => setEditDraft(d => ({ ...d, status: e.target.value }))}
                                                        className="at-inline-input"
                                                    >
                                                        <option value="open">Open</option>
                                                        <option value="in-progress">In Progress</option>
                                                        <option value="closed">Closed</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={editDraft.owner}
                                                        onChange={e => setEditDraft(d => ({ ...d, owner: e.target.value }))}
                                                        placeholder="Owner…"
                                                        maxLength={120}
                                                        className="at-inline-input"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="date"
                                                        value={editDraft.dueDate}
                                                        onChange={e => setEditDraft(d => ({ ...d, dueDate: e.target.value }))}
                                                        className="at-inline-input"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={editDraft.standardsRef}
                                                        onChange={e => setEditDraft(d => ({ ...d, standardsRef: e.target.value }))}
                                                        placeholder="Standards ref…"
                                                        maxLength={500}
                                                        className="at-inline-input"
                                                        style={{ minWidth: "12rem" }}
                                                    />
                                                </td>
                                                <td style={{ opacity: 0.6, fontSize: "0.8rem" }}>
                                                    {task.session_code || "—"}
                                                </td>
                                                <td className="at-cell-actions">
                                                    <button
                                                        className="at-btn at-btn-save"
                                                        onClick={() => handleSave(task.id)}
                                                        disabled={isSaving}
                                                    >
                                                        {isSaving ? "Saving…" : "Save"}
                                                    </button>
                                                    <button className="at-btn at-btn-cancel" onClick={handleCancelEdit}>
                                                        Cancel
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>
                                                    <span
                                                        className="at-status-badge"
                                                        style={{ color: STATUS_COLORS[task.status] || "inherit" }}
                                                    >
                                                        {STATUS_LABELS[task.status] || task.status}
                                                    </span>
                                                </td>
                                                <td style={{ fontSize: "0.85rem" }}>
                                                    {task.owner || <span style={{ opacity: 0.4 }}>Unassigned</span>}
                                                </td>
                                                <td style={{ fontSize: "0.85rem" }}>
                                                    <span style={{ color: overdueFl ? "rgb(255,80,80)" : "inherit" }}>
                                                        {fmtDate(task.due_date)}
                                                        {overdueFl && <span style={{ marginLeft: "0.3rem", fontSize: "0.75rem" }}>⚠ Overdue</span>}
                                                    </span>
                                                </td>
                                                <td className="at-cell-standards">
                                                    {task.standards_ref
                                                        ? task.standards_ref.split("|").map((s, i) => (
                                                            <span key={i} className="at-standards-tag">{s.trim()}</span>
                                                        ))
                                                        : <span style={{ opacity: 0.4, fontSize: "0.8rem" }}>—</span>
                                                    }
                                                </td>
                                                <td style={{ opacity: 0.6, fontSize: "0.8rem" }}>
                                                    {task.session_code || "—"}
                                                </td>
                                                <td className="at-cell-actions">
                                                    <button
                                                        className="at-btn at-btn-edit"
                                                        onClick={() => handleEdit(task)}
                                                        disabled={isSaving}
                                                    >
                                                        Edit
                                                    </button>
                                                    {task.status !== "closed" && (
                                                        <button
                                                            className="at-btn at-btn-close"
                                                            onClick={() => handleQuickClose(task)}
                                                            disabled={isSaving}
                                                        >
                                                            {isSaving ? "…" : "Close"}
                                                        </button>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button className="filter-btn" onClick={() => navigate("/analytics")}>
                    📊 View Analytics
                </button>
                <button className="filter-btn" onClick={loadTasks}>
                    ↻ Refresh
                </button>
            </div>
        </AdminDashboardLayout>
    );
}
