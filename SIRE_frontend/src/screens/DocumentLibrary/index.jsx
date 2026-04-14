/**
 * Author: Leon Wasiliew
 * Last Update: 2026-04-14
 * Description: Document Library screen for managing reference documents.
 * Administrators can add URL-based document references (policies, threat reports,
 * standards) and optionally link them to specific scenarios. Participants can
 * reference linked documents during exercises via the Trainee Interface.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboardLayout from "../../layouts/AdminDashboardLayout";
import BackButton from "../../components/BackButton";
import Button from "../../components/Button";
import { getDocuments, createDocument, updateDocument, deleteDocument, getScenarios } from "../../services/api/api";

const EMPTY_FORM = { name: "", description: "", url: "", scenarioId: "" };

/** Document Library screen — manage reference documents for scenarios. */
export default function DocumentLibrary() {
    const navigate = useNavigate();

    const [documents, setDocuments] = useState([]);
    const [scenarios, setScenarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /** Form state for add/edit. */
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState(null);

    /** Filter by scenario. */
    const [filterScenarioId, setFilterScenarioId] = useState("");

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const [docs, scens] = await Promise.all([getDocuments(), getScenarios()]);
                if (!cancelled) {
                    setDocuments(docs);
                    setScenarios(scens);
                }
            } catch (err) {
                if (!cancelled) setError(err.message || "Failed to load documents.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    const filteredDocs = filterScenarioId
        ? documents.filter((d) => d.scenario_id === filterScenarioId)
        : documents;

    function handleEditStart(doc) {
        setEditingId(doc.id);
        setForm({
            name: doc.name,
            description: doc.description || "",
            url: doc.url,
            scenarioId: doc.scenario_id || "",
        });
        setFormError(null);
    }

    function handleEditCancel() {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormError(null);
    }

    async function handleSave() {
        if (!form.name.trim() || !form.url.trim()) {
            setFormError("Name and URL are required.");
            return;
        }
        setSaving(true);
        setFormError(null);
        try {
            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                url: form.url.trim(),
                scenarioId: form.scenarioId || null,
            };
            if (editingId) {
                const updated = await updateDocument(editingId, payload);
                setDocuments((prev) => prev.map((d) => (d.id === editingId ? updated : d)));
                setEditingId(null);
            } else {
                const created = await createDocument(payload);
                setDocuments((prev) => [...prev, created]);
            }
            setForm(EMPTY_FORM);
        } catch (err) {
            setFormError(err.message || "Failed to save document.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm("Delete this document?")) return;
        try {
            await deleteDocument(id);
            setDocuments((prev) => prev.filter((d) => d.id !== id));
        } catch (err) {
            setError(err.message || "Failed to delete document.");
        }
    }

    function scenarioName(scenarioId) {
        const s = scenarios.find((sc) => sc.id === scenarioId);
        return s ? (s.name || s.id) : scenarioId;
    }

    return (
        <AdminDashboardLayout>
            <BackButton to="/" />

            <div className="dashboard-card">
                <h2>📚 Document Library</h2>
                <p>
                    Add reference documents (policies, standards, threat reports) and optionally
                    link them to scenarios. Participants can access linked documents during
                    exercises from the Trainee Interface.
                </p>
            </div>

            {error && (
                <div className="dashboard-card" style={{ borderColor: "rgb(200,40,40)" }}>
                    <p style={{ color: "rgb(255,80,80)" }}>{error}</p>
                </div>
            )}

            {/** Add / Edit form */}
            <div className="dashboard-card">
                <h3>{editingId ? "Edit Document" : "Add Document"}</h3>

                {formError && (
                    <p style={{ color: "rgb(255,80,80)", marginBottom: "0.5rem", fontSize: "0.85rem" }}>{formError}</p>
                )}

                <div className="form-group">
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Document name *"
                        maxLength={200}
                        style={{ width: "100%", boxSizing: "border-box" }}
                    />
                </div>
                <div className="form-group">
                    <input
                        type="url"
                        value={form.url}
                        onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                        placeholder="URL (https://…) *"
                        maxLength={2000}
                        style={{ width: "100%", boxSizing: "border-box" }}
                    />
                </div>
                <div className="form-group">
                    <input
                        type="text"
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder="Short description (optional)"
                        maxLength={500}
                        style={{ width: "100%", boxSizing: "border-box" }}
                    />
                </div>
                <div className="form-group">
                    <select
                        value={form.scenarioId}
                        onChange={(e) => setForm((f) => ({ ...f, scenarioId: e.target.value }))}
                        style={{
                            width: "100%",
                            background: "var(--color-surface)",
                            color: "inherit",
                            border: "1px solid var(--color-border-mid)",
                            borderRadius: "4px",
                            padding: "0.35rem 0.5rem",
                        }}
                    >
                        <option value="">No scenario link (general library)</option>
                        {scenarios.map((s) => (
                            <option key={s.id} value={s.id}>{s.name || s.id}</option>
                        ))}
                    </select>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <Button
                        text={saving ? "Saving…" : editingId ? "Save Changes" : "Add Document"}
                        onClick={handleSave}
                        disabled={saving || !form.name.trim() || !form.url.trim()}
                    />
                    {editingId && (
                        <Button text="Cancel" onClick={handleEditCancel} />
                    )}
                </div>
            </div>

            {/** Filter bar */}
            <div className="filter-bar" style={{ flexWrap: "wrap" }}>
                <span className="filter-label">Filter by scenario:</span>
                <button
                    className={`filter-btn${filterScenarioId === "" ? " active" : ""}`}
                    onClick={() => setFilterScenarioId("")}
                >
                    All
                </button>
                {scenarios.map((s) => (
                    <button
                        key={s.id}
                        className={`filter-btn${filterScenarioId === s.id ? " active" : ""}`}
                        onClick={() => setFilterScenarioId(s.id)}
                    >
                        {s.name || s.id}
                    </button>
                ))}
            </div>

            {/** Document list */}
            <div className="dashboard-card">
                <h3>Documents ({filteredDocs.length})</h3>

                {loading ? (
                    <p>Loading…</p>
                ) : filteredDocs.length === 0 ? (
                    <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>No documents found.</p>
                ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {filteredDocs.map((doc) => (
                            <li
                                key={doc.id}
                                style={{
                                    padding: "0.7rem 0.75rem",
                                    marginBottom: "0.5rem",
                                    borderRadius: "6px",
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    fontSize: "0.85rem",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap" }}>
                                    <div>
                                        <strong>{doc.name}</strong>
                                        {doc.scenario_id && (
                                            <span className="role-badge" style={{ marginLeft: "0.5rem" }}>
                                                {scenarioName(doc.scenario_id)}
                                            </span>
                                        )}
                                        {doc.description && (
                                            <p style={{ margin: "0.2rem 0 0", opacity: 0.7 }}>{doc.description}</p>
                                        )}
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: "rgb(100,180,255)", wordBreak: "break-all" }}
                                        >
                                            {doc.url}
                                        </a>
                                    </div>
                                    <div style={{ display: "flex", gap: "0.3rem", flexShrink: 0 }}>
                                        <button
                                            onClick={() => handleEditStart(doc)}
                                            style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", cursor: "pointer" }}
                                        >
                                            ✏ Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            style={{
                                                fontSize: "0.75rem",
                                                padding: "0.2rem 0.5rem",
                                                cursor: "pointer",
                                                background: "rgba(200,40,40,0.15)",
                                                border: "1px solid rgba(200,40,40,0.4)",
                                                borderRadius: "4px",
                                                color: "rgb(255,100,100)",
                                            }}
                                        >
                                            🗑 Delete
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="session-actions">
                <Button text="Return to Home" onClick={() => navigate("/")} />
            </div>
        </AdminDashboardLayout>
    );
}
