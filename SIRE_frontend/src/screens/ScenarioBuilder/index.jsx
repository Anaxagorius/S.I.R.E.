/**
 * Author: Leon Wasiliew
 * Last Update: 2026-04-14
 * Description: Scenario Authoring & Content Engine.
 *
 * Provides a comprehensive authoring interface for creating, editing, and previewing
 * training scenarios. Supports:
 *   - Scenario metadata (title, description, category, difficulty, tags)
 *   - Objectives and discussion prompt templates
 *   - Timeline inject editor (≥10 injects enforced for preview/launch)
 *   - Decision tree (branching node) editor
 *   - Timeline preview before launch
 *   - AI-assisted scenario generation from an organisational profile
 *   - Clone from the built-in scenario library
 *   - Export as a facilitator pack (JSON download)
 *   - Difficulty / cadence controls
 *   - Persistence via the backend custom-scenario API
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ScenarioBuilderLayout from "../../layouts/ScenarioBuilderLayout";
import BackButton from "../../components/BackButton";
import {
    createCustomScenario,
    updateCustomScenario,
    createSession,
    getScenarios,
    getScenario,
} from "../../services/api/api";
import { generateScenario, THREAT_TYPES, INDUSTRIES } from "../../data/aiScenarioTemplates";
import "./ScenarioBuilder.css";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES  = ["Cyber", "Physical", "Medical", "HAZMAT", "Threat", "Network", "Web", "Cloud", "Police"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const MIN_INJECTS  = 10;

/** Format seconds as MM:SS for the timeline preview. */
function fmtSec(secs) {
    const s = Math.max(0, Number(secs) || 0);
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const r = (s % 60).toString().padStart(2, "0");
    return `${m}:${r}`;
}

/** Generate a simple unique DOM-safe ID string. */
function uid() {
    return `node-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Build a blank inject object at the given suggested time offset. */
function blankInject(index, timeOffsetSec = 30) {
    return { index, title: "", description: "", timeOffsetSec };
}

/** Build a blank decision node. */
function blankNode() {
    const id = uid();
    return {
        id,
        title: "",
        situation: "",
        question: "",
        options: [],
    };
}

/** Build a blank option for a decision node. */
function blankOption(label) {
    return { label, text: "", outcome: { type: "node", target: "" } };
}

/** Export the current scenario as a facilitator-pack JSON download. */
function exportFacilitatorPack(scenario, title) {
    const pack = {
        facilitatorPack: true,
        generatedAt: new Date().toISOString(),
        scenarioTitle: title,
        description: scenario.description,
        category: scenario.category,
        difficulty: scenario.difficulty,
        tags: scenario.tags,
        objectives: scenario.objectives,
        discussionPrompts: scenario.discussionPrompts,
        timeline: scenario.timeline,
        decisionTree: {
            root: scenario.root,
            nodes: scenario.nodes,
        },
    };
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${title.replace(/\s+/g, "_").toLowerCase()}_facilitator_pack.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty scenario state
// ─────────────────────────────────────────────────────────────────────────────

const BLANK_SCENARIO = () => ({
    id: null,
    title: "",
    description: "",
    category: "Cyber",
    difficulty: "Intermediate",
    tags: [],
    objectives: [""],
    discussionPrompts: [""],
    timeline: Array.from({ length: MIN_INJECTS }, (_, i) => blankInject(i, (i + 1) * 30)),
    root: null,
    nodes: {},
});

// ─────────────────────────────────────────────────────────────────────────────
// Tab components (inline to keep the file self-contained)
// ─────────────────────────────────────────────────────────────────────────────

/** Overview tab — title, description, metadata, objectives, discussion prompts. */
function OverviewTab({ scenario, onChange, onOpenAI }) {

    function setField(field) {
        return (e) => onChange({ ...scenario, [field]: e.target.value });
    }

    function setListItem(field, index, value) {
        const next = [...scenario[field]];
        next[index] = value;
        onChange({ ...scenario, [field]: next });
    }

    function addListItem(field) {
        onChange({ ...scenario, [field]: [...scenario[field], ""] });
    }

    function removeListItem(field, index) {
        const next = scenario[field].filter((_, i) => i !== index);
        onChange({ ...scenario, [field]: next.length ? next : [""] });
    }

    function setTagsFromInput(e) {
        const tags = e.target.value.split(",").map(t => t.trim()).filter(Boolean);
        onChange({ ...scenario, tags });
    }

    return (
        <div className="sb-panel">

            {/* ── Title ── */}
            <div className="sb-field">
                <label>Scenario Title *</label>
                <input
                    className="sb-input"
                    maxLength={200}
                    placeholder="E.g. Ransomware Attack – Healthcare Sector"
                    value={scenario.title}
                    onChange={setField("title")}
                />
            </div>

            {/* ── Description ── */}
            <div className="sb-field">
                <label>Description</label>
                <textarea
                    className="sb-textarea"
                    maxLength={500}
                    placeholder="Brief summary shown to participants and in the session selection grid."
                    value={scenario.description}
                    onChange={setField("description")}
                />
            </div>

            {/* ── Metadata row ── */}
            <div className="sb-row">
                <div className="sb-field">
                    <label>Category</label>
                    <select className="sb-select" value={scenario.category} onChange={setField("category")}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
                <div className="sb-field">
                    <label>Difficulty</label>
                    <select className="sb-select" value={scenario.difficulty} onChange={setField("difficulty")}>
                        {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            {/* ── Tags ── */}
            <div className="sb-field">
                <label>Tags (comma-separated)</label>
                <input
                    className="sb-input"
                    placeholder="ransomware, encryption, backup"
                    value={scenario.tags.join(", ")}
                    onChange={setTagsFromInput}
                />
            </div>

            {/* ── Objectives ── */}
            <div>
                <p className="sb-section-title">Objectives</p>
                <div className="sb-list">
                    {scenario.objectives.map((obj, i) => (
                        <div key={i} className="sb-list-item">
                            <input
                                className="sb-input"
                                placeholder={`Objective ${i + 1}`}
                                value={obj}
                                onChange={e => setListItem("objectives", i, e.target.value)}
                            />
                            <button className="sb-remove-btn" onClick={() => removeListItem("objectives", i)} title="Remove">✕</button>
                        </div>
                    ))}
                    <button className="sb-add-btn" onClick={() => addListItem("objectives")}>+ Add Objective</button>
                </div>
            </div>

            {/* ── Discussion Prompts ── */}
            <div>
                <p className="sb-section-title">Discussion Prompts</p>
                <div className="sb-list">
                    {scenario.discussionPrompts.map((prompt, i) => (
                        <div key={i} className="sb-list-item">
                            <input
                                className="sb-input"
                                placeholder={`Discussion prompt ${i + 1}`}
                                value={prompt}
                                onChange={e => setListItem("discussionPrompts", i, e.target.value)}
                            />
                            <button className="sb-remove-btn" onClick={() => removeListItem("discussionPrompts", i)} title="Remove">✕</button>
                        </div>
                    ))}
                    <button className="sb-add-btn" onClick={() => addListItem("discussionPrompts")}>+ Add Prompt</button>
                </div>
            </div>

            {/* ── AI Generate ── */}
            <div>
                <p className="sb-section-title">AI Scenario Generation</p>
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                    Generate a complete scenario from a short organisational profile. Fills all tabs with relevant content.
                </p>
                <button className="sb-btn sb-btn-secondary" onClick={onOpenAI}>
                    ✨ Generate from Org Profile
                </button>
            </div>

        </div>
    );
}

/** Timeline tab — ordered inject editor. */
function TimelineTab({ scenario, onChange }) {

    const injects = scenario.timeline;

    function updateInject(index, field, value) {
        const next = injects.map((inj, i) =>
            i === index ? { ...inj, [field]: field === "timeOffsetSec" ? Number(value) || 0 : value } : inj
        );
        onChange({ ...scenario, timeline: next });
    }

    function addInject() {
        const lastOffset = injects.length ? injects[injects.length - 1].timeOffsetSec : 0;
        const newInj     = blankInject(injects.length, lastOffset + 30);
        onChange({ ...scenario, timeline: [...injects, newInj] });
    }

    function removeInject(index) {
        const next = injects
            .filter((_, i) => i !== index)
            .map((inj, i) => ({ ...inj, index: i }));
        onChange({ ...scenario, timeline: next });
    }

    function moveInject(index, direction) {
        const next  = [...injects];
        const swapI = index + direction;
        if (swapI < 0 || swapI >= next.length) return;
        [next[index], next[swapI]] = [next[swapI], next[index]];
        onChange({ ...scenario, timeline: next.map((inj, i) => ({ ...inj, index: i })) });
    }

    const count = injects.length;

    return (
        <div className="sb-panel">

            <div className="sb-inject-count">
                <span>Total injects:</span>
                <span className="sb-inject-count-num">{count}</span>
                {count < MIN_INJECTS && (
                    <span className="sb-inject-count-warn">⚠ Minimum {MIN_INJECTS} injects required to launch</span>
                )}
            </div>

            <div className="sb-inject-list">
                {injects.map((inj, i) => (
                    <div key={i} className="sb-inject-card">
                        <div className="sb-inject-header">
                            <span className="sb-inject-index">{i + 1}</span>
                            <input
                                className="sb-input"
                                placeholder={`Inject ${i + 1} title`}
                                value={inj.title}
                                onChange={e => updateInject(i, "title", e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <div className="sb-inject-actions">
                                <button className="sb-icon-btn" onClick={() => moveInject(i, -1)} title="Move up" disabled={i === 0}>↑</button>
                                <button className="sb-icon-btn" onClick={() => moveInject(i, 1)} title="Move down" disabled={i === injects.length - 1}>↓</button>
                                <button className="sb-remove-btn" onClick={() => removeInject(i)} title="Remove inject">✕</button>
                            </div>
                        </div>
                        <textarea
                            className="sb-textarea"
                            placeholder="Inject description — what event or information is presented to participants?"
                            value={inj.description}
                            onChange={e => updateInject(i, "description", e.target.value)}
                            style={{ minHeight: "60px" }}
                        />
                        <div className="sb-inject-time-row">
                            <label>Time offset (seconds from session start):</label>
                            <input
                                className="sb-input"
                                type="number"
                                min="0"
                                max="86400"
                                value={inj.timeOffsetSec}
                                onChange={e => updateInject(i, "timeOffsetSec", e.target.value)}
                            />
                            <span style={{ fontSize: "0.78rem", color: "var(--color-text-dim)" }}>({fmtSec(inj.timeOffsetSec)})</span>
                        </div>
                    </div>
                ))}
            </div>

            <button className="sb-add-btn" onClick={addInject}>+ Add Inject</button>

        </div>
    );
}

/** Decision Tree tab — node and branching logic editor. */
function DecisionTreeTab({ scenario, onChange }) {

    const nodeEntries = Object.entries(scenario.nodes || {});

    function updateNode(id, field, value) {
        onChange({
            ...scenario,
            nodes: {
                ...scenario.nodes,
                [id]: { ...scenario.nodes[id], [field]: value },
            },
        });
    }

    function addNode() {
        const node = blankNode();
        const isFirst = nodeEntries.length === 0;
        onChange({
            ...scenario,
            nodes: { ...scenario.nodes, [node.id]: node },
            root: isFirst ? node.id : scenario.root,
        });
    }

    function removeNode(id) {
        const { [id]: _removed, ...rest } = scenario.nodes;
        const newRoot = scenario.root === id ? (Object.keys(rest)[0] || null) : scenario.root;
        onChange({ ...scenario, nodes: rest, root: newRoot });
    }

    function setRoot(id) {
        onChange({ ...scenario, root: id });
    }

    function addOption(nodeId) {
        const existing = scenario.nodes[nodeId];
        const label    = String.fromCharCode(65 + (existing.options || []).length); // A, B, C…
        const option   = blankOption(label);
        updateNode(nodeId, "options", [...(existing.options || []), option]);
    }

    function updateOption(nodeId, optIdx, field, value) {
        const options = scenario.nodes[nodeId].options.map((opt, i) => {
            if (i !== optIdx) return opt;
            if (field === "outcomeType") {
                return { ...opt, outcome: { type: value, target: value === "node" ? "" : undefined } };
            }
            if (field === "outcomeTarget") {
                return { ...opt, outcome: { ...opt.outcome, target: value } };
            }
            return { ...opt, [field]: value };
        });
        updateNode(nodeId, "options", options);
    }

    function removeOption(nodeId, optIdx) {
        const options = scenario.nodes[nodeId].options
            .filter((_, i) => i !== optIdx)
            .map((opt, i) => ({ ...opt, label: String.fromCharCode(65 + i) }));
        updateNode(nodeId, "options", options);
    }

    const otherNodeIds = nodeEntries.map(([id]) => id);

    return (
        <div className="sb-panel">

            <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: 0 }}>
                Build a branching decision tree. Each node presents a situation and question to participants. Options lead to another node, success, or failure.
            </p>

            <div className="sb-node-list">
                {nodeEntries.map(([id, node]) => (
                    <div key={id} className={`sb-node-card${scenario.root === id ? " root-node" : ""}`}>

                        <div className="sb-node-header">
                            <span className="sb-node-id">{id}</span>
                            {scenario.root === id && <span className="sb-root-badge">Root Node</span>}
                            <div style={{ marginLeft: "auto", display: "flex", gap: "0.4rem" }}>
                                {scenario.root !== id && (
                                    <button className="sb-icon-btn" onClick={() => setRoot(id)} title="Set as root node">Set Root</button>
                                )}
                                <button className="sb-remove-btn" onClick={() => removeNode(id)} title="Remove node">✕</button>
                            </div>
                        </div>

                        <div className="sb-field">
                            <label>Node Title</label>
                            <input className="sb-input" placeholder="Node title" value={node.title || ""} onChange={e => updateNode(id, "title", e.target.value)} />
                        </div>
                        <div className="sb-field">
                            <label>Situation</label>
                            <textarea className="sb-textarea" placeholder="Situation presented to the participant" value={node.situation || ""} onChange={e => updateNode(id, "situation", e.target.value)} />
                        </div>
                        <div className="sb-field">
                            <label>Question</label>
                            <input className="sb-input" placeholder="What question do you ask?" value={node.question || ""} onChange={e => updateNode(id, "question", e.target.value)} />
                        </div>

                        {/* Options */}
                        <p className="sb-section-title" style={{ marginBottom: "0.35rem" }}>Options</p>
                        <div className="sb-options-list">
                            {(node.options || []).map((opt, optIdx) => (
                                <div key={optIdx} className="sb-option-row">
                                    <div className="sb-option-top">
                                        <span className="sb-option-label">{opt.label}</span>
                                        <input
                                            className="sb-input"
                                            placeholder="Option text"
                                            value={opt.text || ""}
                                            onChange={e => updateOption(id, optIdx, "text", e.target.value)}
                                        />
                                        <button className="sb-remove-btn" onClick={() => removeOption(id, optIdx)} title="Remove option">✕</button>
                                    </div>
                                    <div className="sb-option-outcome">
                                        <label>Outcome:</label>
                                        <select
                                            className="sb-select"
                                            style={{ width: "130px" }}
                                            value={opt.outcome?.type || "node"}
                                            onChange={e => updateOption(id, optIdx, "outcomeType", e.target.value)}
                                        >
                                            <option value="node">→ Go to node</option>
                                            <option value="success">✅ Success</option>
                                            <option value="failure">❌ Failure</option>
                                        </select>
                                        {opt.outcome?.type === "node" && (
                                            <select
                                                className="sb-select"
                                                style={{ width: "180px" }}
                                                value={opt.outcome?.target || ""}
                                                onChange={e => updateOption(id, optIdx, "outcomeTarget", e.target.value)}
                                            >
                                                <option value="">Select target node…</option>
                                                {otherNodeIds.filter(nid => nid !== id).map(nid => (
                                                    <option key={nid} value={nid}>{scenario.nodes[nid]?.title || nid}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button className="sb-add-btn" onClick={() => addOption(id)} style={{ marginTop: "0.4rem" }}>+ Add Option</button>
                        </div>

                    </div>
                ))}
            </div>

            <button className="sb-add-btn" onClick={addNode}>+ Add Decision Node</button>

        </div>
    );
}

/** Preview & Export tab — read-only timeline and facilitator pack export. */
function PreviewTab({ scenario, onExport }) {

    const sorted = [...(scenario.timeline || [])].sort((a, b) => a.timeOffsetSec - b.timeOffsetSec);
    const objectives = (scenario.objectives || []).filter(Boolean);
    const prompts    = (scenario.discussionPrompts || []).filter(Boolean);
    const count      = sorted.length;
    const canPreview = count >= MIN_INJECTS;

    return (
        <div className="sb-panel">

            {!canPreview && (
                <div className="sb-banner sb-banner-info">
                    ℹ This preview requires at least {MIN_INJECTS} timeline injects. Add more in the <strong>Timeline</strong> tab.
                </div>
            )}

            {/* ── Timeline ── */}
            <div>
                <p className="sb-section-title">Timeline Preview ({count} injects)</p>
                {sorted.length === 0 ? (
                    <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>No injects defined yet.</p>
                ) : (
                    <div className="sb-preview-timeline">
                        {sorted.map((inj, i) => (
                            <div key={i} className="sb-preview-item">
                                <div className="sb-preview-dot" />
                                <div className="sb-preview-body">
                                    <span className="sb-preview-time">T+{fmtSec(inj.timeOffsetSec)}</span>
                                    <span className="sb-preview-inj-title">{inj.title || "(untitled inject)"}</span>
                                    {inj.description && (
                                        <span className="sb-preview-inj-desc">{inj.description}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Objectives ── */}
            {objectives.length > 0 && (
                <div>
                    <p className="sb-section-title">Objectives ({objectives.length})</p>
                    <ul className="sb-preview-list">
                        {objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                    </ul>
                </div>
            )}

            {/* ── Discussion Prompts ── */}
            {prompts.length > 0 && (
                <div>
                    <p className="sb-section-title">Discussion Prompts ({prompts.length})</p>
                    <ul className="sb-preview-list">
                        {prompts.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                </div>
            )}

            {/* ── Export ── */}
            <div style={{ paddingTop: "0.5rem", borderTop: "1px solid var(--color-border)" }}>
                <p className="sb-section-title">Export Facilitator Pack</p>
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", marginBottom: "0.75rem" }}>
                    Download a structured JSON file containing the full scenario definition — timeline, objectives, discussion prompts, and decision tree — ready for facilitators to use offline.
                </p>
                <button className="sb-btn sb-btn-secondary" onClick={onExport} disabled={!scenario.title}>
                    ⬇ Export Facilitator Pack
                </button>
            </div>

        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Generate Modal
// ─────────────────────────────────────────────────────────────────────────────

function AIGenerateModal({ onClose, onApply }) {

    const [profile, setProfile] = useState({
        threatType:     "ransomware",
        industry:       "Healthcare",
        org:            "",
        primaryAsset:   "",
        secondaryAsset: "",
        teamSize:       "",
        region:         "",
    });
    const [error, setError] = useState(null);

    function set(field) {
        return (e) => setProfile(p => ({ ...p, [field]: e.target.value }));
    }

    function handleGenerate() {
        setError(null);
        try {
            const generated = generateScenario(profile);
            onApply(generated);
        } catch (err) {
            setError(err.message || "Generation failed.");
        }
    }

    return (
        <div className="sb-modal-backdrop" onClick={onClose}>
            <div className="sb-modal" onClick={e => e.stopPropagation()}>
                <h2 className="sb-modal-title">✨ AI Scenario Generation</h2>
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: 0 }}>
                    Fill in a short organisational profile and generate a complete scenario with timeline, decision tree, objectives, and discussion prompts.
                </p>

                <div className="sb-field">
                    <label>Threat Type *</label>
                    <select className="sb-select" value={profile.threatType} onChange={set("threatType")}>
                        {THREAT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>

                <div className="sb-row">
                    <div className="sb-field">
                        <label>Industry *</label>
                        <select className="sb-select" value={profile.industry} onChange={set("industry")}>
                            {INDUSTRIES.map(ind => <option key={ind}>{ind}</option>)}
                        </select>
                    </div>
                    <div className="sb-field">
                        <label>Organisation Name</label>
                        <input className="sb-input" placeholder="Acme Corp" value={profile.org} onChange={set("org")} />
                    </div>
                </div>

                <div className="sb-row">
                    <div className="sb-field">
                        <label>Primary Asset</label>
                        <input className="sb-input" placeholder="e.g. patient records" value={profile.primaryAsset} onChange={set("primaryAsset")} />
                    </div>
                    <div className="sb-field">
                        <label>Team / Responder Size</label>
                        <input className="sb-input" placeholder="e.g. the IR team" value={profile.teamSize} onChange={set("teamSize")} />
                    </div>
                </div>

                <div className="sb-field">
                    <label>Region / Location (optional)</label>
                    <input className="sb-input" placeholder="e.g. Vancouver, BC" value={profile.region} onChange={set("region")} />
                </div>

                {error && <div className="sb-banner sb-banner-error">{error}</div>}

                <div className="sb-modal-footer">
                    <button className="sb-btn sb-btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="sb-btn sb-btn-primary" onClick={handleGenerate}>Generate Scenario</button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Load from Library Modal
// ─────────────────────────────────────────────────────────────────────────────

function LibraryModal({ onClose, onLoad }) {

    const [scenarios,  setScenarios]  = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [loadingKey, setLoadingKey] = useState(null);
    const [error,      setError]      = useState(null);
    const [search,     setSearch]     = useState("");

    useEffect(() => {
        let cancelled = false;
        getScenarios()
            .then(data => { if (!cancelled) setScenarios(data); })
            .catch(err => { if (!cancelled) setError(err.message || "Failed to load library."); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    async function handleLoad(id) {
        setLoadingKey(id);
        setError(null);
        try {
            const data = await getScenario(id);
            onLoad(data, id);
        } catch (err) {
            setError(err.message || "Failed to load scenario.");
        } finally {
            setLoadingKey(null);
        }
    }

    const filtered = scenarios.filter(s =>
        !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.category?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="sb-modal-backdrop" onClick={onClose}>
            <div className="sb-modal" onClick={e => e.stopPropagation()}>
                <h2 className="sb-modal-title">📚 Load from Library</h2>
                <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: 0 }}>
                    Clone a built-in scenario and modify it in the builder. The original will not be changed.
                </p>
                <input
                    className="sb-input"
                    placeholder="Search by name or category…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                {loading && <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>Loading library…</p>}
                {error   && <div className="sb-banner sb-banner-error">{error}</div>}
                <div className="sb-library-list">
                    {filtered.map(s => (
                        <button
                            key={s.id}
                            className="sb-library-item"
                            onClick={() => handleLoad(s.id)}
                            disabled={loadingKey === s.id}
                        >
                            <span className="sb-library-item-name">{s.name}</span>
                            <span className="sb-library-item-meta">{[s.category, s.difficulty].filter(Boolean).join(" · ")}</span>
                        </button>
                    ))}
                    {!loading && filtered.length === 0 && (
                        <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>No scenarios match your search.</p>
                    )}
                </div>
                <div className="sb-modal-footer">
                    <button className="sb-btn sb-btn-ghost" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root ScenarioBuilder component
// ─────────────────────────────────────────────────────────────────────────────

/** Converts a raw scenario JSON (from the library or API) into the builder's state shape. */
function hydrateFromLibrary(raw, sourceId) {
    const nodes = {};
    if (raw.nodes && typeof raw.nodes === "object") {
        for (const [id, node] of Object.entries(raw.nodes)) {
            nodes[id] = {
                id,
                title:    node.title    || "",
                situation: node.situation || "",
                question: node.question || "",
                options:  (node.options || []).map(opt => ({
                    label:   opt.label || "A",
                    text:    opt.text  || "",
                    outcome: opt.outcome || { type: "node", target: "" },
                })),
            };
        }
    }
    return {
        id:               null,           // always null for a clone — creates a new scenario
        title:            `Clone of ${raw.title || sourceId || ""}`.replace(/^scenario_/, "").replace(/_/g, " "),
        description:      raw.description      || "",
        category:         raw.category         || "Cyber",
        difficulty:       raw.difficulty        || "Intermediate",
        tags:             Array.isArray(raw.tags)               ? [...raw.tags]               : [],
        objectives:       Array.isArray(raw.objectives)         ? [...raw.objectives, ""]     : [""],
        discussionPrompts: Array.isArray(raw.discussionPrompts) ? [...raw.discussionPrompts, ""] : [""],
        timeline:         Array.isArray(raw.timeline)           ? raw.timeline.map((t, i) => ({ ...t, index: i })) : Array.from({ length: MIN_INJECTS }, (_, i) => blankInject(i, (i + 1) * 30)),
        root:             raw.root   || null,
        nodes,
    };
}

/** Converts the builder's state into the shape expected by the API. */
function prepareForApi(scenario) {
    const nodeMap = {};
    for (const [id, node] of Object.entries(scenario.nodes || {})) {
        nodeMap[id] = {
            title:    node.title    || "",
            situation: node.situation || "",
            question: node.question || "",
            options:  (node.options || []).map(opt => ({
                label:   opt.label,
                text:    opt.text || "",
                outcome: opt.outcome,
            })),
        };
    }
    return {
        title:             scenario.title.trim(),
        description:       scenario.description.trim(),
        category:          scenario.category,
        difficulty:        scenario.difficulty,
        tags:              scenario.tags.filter(Boolean),
        objectives:        scenario.objectives.filter(Boolean),
        discussionPrompts: scenario.discussionPrompts.filter(Boolean),
        timeline:          scenario.timeline,
        root:              scenario.root || null,
        nodes:             nodeMap,
    };
}

const TABS = ["Overview", "Timeline", "Decision Tree", "Preview & Export"];

/** Main ScenarioBuilder screen component. */
export default function ScenarioBuilder() {

    const location = useLocation();
    const navigate = useNavigate();

    const [scenario,    setScenario]    = useState(BLANK_SCENARIO);
    const [activeTab,   setActiveTab]   = useState("Overview");
    const [saving,      setSaving]      = useState(false);
    const [launching,   setLaunching]   = useState(false);
    const [saveMsg,     setSaveMsg]     = useState(null); // { type: 'success'|'error', text }
    const [showAI,      setShowAI]      = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const saveMsgTimer = useRef(null);

    /** Seed the builder from navigation state (e.g. editing an existing custom scenario). */
    useEffect(() => {
        const state = location.state;
        if (state?.scenario) {
            setScenario(hydrateFromLibrary(state.scenario, state.id));
        }
    }, [location.state]);

    /** Show a transient status message for 4 seconds. */
    function showStatus(type, text) {
        clearTimeout(saveMsgTimer.current);
        setSaveMsg({ type, text });
        saveMsgTimer.current = setTimeout(() => setSaveMsg(null), 4000);
    }

    /** Save the custom scenario to the backend. */
    async function handleSave() {
        if (!scenario.title.trim()) {
            showStatus("error", "Please enter a scenario title before saving.");
            setActiveTab("Overview");
            return;
        }
        setSaving(true);
        try {
            const body = prepareForApi(scenario);
            let saved;
            if (scenario.id) {
                saved = await updateCustomScenario(scenario.id, body);
            } else {
                saved = await createCustomScenario(body);
                setScenario(s => ({ ...s, id: saved.id }));
            }
            showStatus("success", `Scenario saved (ID: ${saved.id || scenario.id}).`);
        } catch (err) {
            showStatus("error", err.message || "Failed to save scenario.");
        } finally {
            setSaving(false);
        }
    }

    /** Save the scenario (if not yet saved) and then launch a session. */
    async function handleLaunch() {
        if (!scenario.title.trim()) {
            showStatus("error", "Please enter a scenario title before launching.");
            setActiveTab("Overview");
            return;
        }
        if (scenario.timeline.length < MIN_INJECTS) {
            showStatus("error", `At least ${MIN_INJECTS} timeline injects are required to launch.`);
            setActiveTab("Timeline");
            return;
        }
        setLaunching(true);
        try {
            let scenarioId = scenario.id;
            if (!scenarioId) {
                const body  = prepareForApi(scenario);
                const saved = await createCustomScenario(body);
                scenarioId  = saved.id;
                setScenario(s => ({ ...s, id: scenarioId }));
            }
            const sessionData = await createSession(scenarioId);
            navigate("/admin-dashboard", {
                state: { sessionCode: sessionData.sessionKey, scenarioKey: scenarioId },
            });
        } catch (err) {
            showStatus("error", err.message || "Failed to launch session.");
        } finally {
            setLaunching(false);
        }
    }

    /** Apply AI-generated scenario data to the builder. */
    const handleAIApply = useCallback((generated) => {
        setScenario(hydrateFromLibrary(generated, null));
        setShowAI(false);
        setActiveTab("Overview");
        showStatus("success", "Scenario generated! Review and adjust each tab before saving.");
    }, []);

    /** Load a scenario from the library into the builder (as a clone). */
    const handleLibraryLoad = useCallback((raw, sourceId) => {
        setScenario(hydrateFromLibrary(raw, sourceId));
        setShowLibrary(false);
        showStatus("success", "Scenario loaded from library. Edit as needed and save.");
    }, []);

    const busy = saving || launching;

    return (
        <ScenarioBuilderLayout scenarioTitle={scenario.title || null}>

            {/* ── Modals ── */}
            {showAI      && <AIGenerateModal  onClose={() => setShowAI(false)}      onApply={handleAIApply}     />}
            {showLibrary && <LibraryModal     onClose={() => setShowLibrary(false)}  onLoad={handleLibraryLoad}  />}

            {/* ── Top action bar ── */}
            <div className="sb-topbar">
                <BackButton to="/admin" />
                <h1 className="sb-topbar-title">
                    {scenario.title || "New Scenario"}
                </h1>
                <button className="sb-btn sb-btn-ghost" onClick={() => setShowLibrary(true)} disabled={busy}>
                    📚 Load from Library
                </button>
                <button className="sb-btn sb-btn-secondary" onClick={handleSave} disabled={busy}>
                    {saving ? "Saving…" : (scenario.id ? "💾 Update" : "💾 Save")}
                </button>
                <button className="sb-btn sb-btn-primary" onClick={handleLaunch} disabled={busy}>
                    {launching ? "Launching…" : "▶ Launch Session"}
                </button>
            </div>

            {/* ── Status banner ── */}
            {saveMsg && (
                <div className={`sb-banner sb-banner-${saveMsg.type === "success" ? "success" : "error"}`}>
                    {saveMsg.text}
                </div>
            )}

            {/* ── Tab navigation ── */}
            <div className="sb-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab}
                        className={`sb-tab${activeTab === tab ? " active" : ""}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* ── Tab content ── */}
            {activeTab === "Overview" && (
                <OverviewTab
                    scenario={scenario}
                    onChange={setScenario}
                    onOpenAI={() => setShowAI(true)}
                />
            )}
            {activeTab === "Timeline" && (
                <TimelineTab scenario={scenario} onChange={setScenario} />
            )}
            {activeTab === "Decision Tree" && (
                <DecisionTreeTab scenario={scenario} onChange={setScenario} />
            )}
            {activeTab === "Preview & Export" && (
                <PreviewTab
                    scenario={scenario}
                    title={scenario.title}
                    onExport={() => exportFacilitatorPack(scenario, scenario.title || "scenario")}
                />
            )}

        </ScenarioBuilderLayout>
    );
}
