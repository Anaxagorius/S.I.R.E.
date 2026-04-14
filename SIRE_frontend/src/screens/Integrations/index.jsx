/**
 * Author: Copilot
 * Last Update: 2026-04-14
 * Description: Integrations management screen.
 * Allows administrators to configure ITSM webhook integrations and threat intel feeds.
 *
 * ITSM section:
 *   - Add / edit a webhook URL (ServiceNow, Jira, PagerDuty, or any generic webhook)
 *   - Test the connection with a sample payload
 *   - Push an evidence pack from the most-recent session
 *
 * Threat Intel section:
 *   - Register external JSON feed URLs to enrich scenario realism
 *   - Preview items fetched from a configured feed
 */

import { useEffect, useState } from "react";
import AdminDashboardLayout from "../../layouts/AdminDashboardLayout";
import BackButton from "../../components/BackButton";
import {
    getItsmIntegrations,
    saveItsmIntegration,
    testItsmIntegration,
    getThreatIntelFeeds,
    addThreatIntelFeed,
    fetchThreatIntelFeed,
    deleteIntegration,
} from "../../services/api/api";
import "./Integrations.css";

/** Platform type options for ITSM webhooks. */
const PLATFORM_TYPES = [
    { value: "generic",      label: "Generic Webhook" },
    { value: "servicenow",   label: "ServiceNow" },
    { value: "jira",         label: "Jira Service Management" },
    { value: "pagerduty",    label: "PagerDuty" },
    { value: "opsgenie",     label: "Opsgenie" },
];

/** Feed type options for threat intel feeds. */
const FEED_TYPES = [
    { value: "json", label: "JSON API" },
];

/** Inline status badge. */
function StatusBadge({ ok, label }) {
    return (
        <span
            className="status-badge"
            style={{ color: ok ? "rgb(80,220,80)" : "rgb(255,100,100)" }}
        >
            {ok ? "✅" : "❌"} {label}
        </span>
    );
}

/** Function that returns the Integrations screen component. */
export default function Integrations() {
    /* ---- shared state ---- */
    const [activeTab, setActiveTab] = useState("itsm");

    /* ---- ITSM state ---- */
    const [itsmList, setItsmList] = useState([]);
    const [itsmLoading, setItsmLoading] = useState(true);
    const [itsmError, setItsmError] = useState(null);

    const [showItsmForm, setShowItsmForm] = useState(false);
    const [itsmFormId, setItsmFormId] = useState(null);       // null = create, string = update
    const [itsmName, setItsmName] = useState("");
    const [itsmWebhookUrl, setItsmWebhookUrl] = useState("");
    const [itsmPlatformType, setItsmPlatformType] = useState("generic");
    const [itsmAuthToken, setItsmAuthToken] = useState("");
    const [itsmSaving, setItsmSaving] = useState(false);
    const [itsmSaveError, setItsmSaveError] = useState(null);

    const [testResults, setTestResults] = useState({});  // id → { loading, success, message }

    /* ---- Threat Intel state ---- */
    const [feedList, setFeedList] = useState([]);
    const [feedLoading, setFeedLoading] = useState(true);
    const [feedError, setFeedError] = useState(null);

    const [feedName, setFeedName] = useState("");
    const [feedUrl, setFeedUrl] = useState("");
    const [feedType, setFeedType] = useState("json");
    const [feedSaving, setFeedSaving] = useState(false);
    const [feedSaveError, setFeedSaveError] = useState(null);

    const [feedPreviews, setFeedPreviews] = useState({}); // id → { loading, data, error }

    /* ------------------------------------------------------------------ */
    /*  Load ITSM integrations                                              */
    /* ------------------------------------------------------------------ */

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setItsmLoading(true);
            try {
                const data = await getItsmIntegrations();
                if (!cancelled) setItsmList(data);
            } catch (err) {
                if (!cancelled) setItsmError(err.message || "Failed to load ITSM integrations.");
            } finally {
                if (!cancelled) setItsmLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    /* ------------------------------------------------------------------ */
    /*  Load threat intel feeds                                             */
    /* ------------------------------------------------------------------ */

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setFeedLoading(true);
            try {
                const data = await getThreatIntelFeeds();
                if (!cancelled) setFeedList(data);
            } catch (err) {
                if (!cancelled) setFeedError(err.message || "Failed to load threat intel feeds.");
            } finally {
                if (!cancelled) setFeedLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    /* ------------------------------------------------------------------ */
    /*  ITSM handlers                                                       */
    /* ------------------------------------------------------------------ */

    function openCreateForm() {
        setItsmFormId(null);
        setItsmName("");
        setItsmWebhookUrl("");
        setItsmPlatformType("generic");
        setItsmAuthToken("");
        setItsmSaveError(null);
        setShowItsmForm(true);
    }

    function openEditForm(integration) {
        setItsmFormId(integration.id);
        setItsmName(integration.name);
        setItsmWebhookUrl(integration.config?.webhookUrl || "");
        setItsmPlatformType(integration.config?.platformType || "generic");
        setItsmAuthToken(integration.config?.authToken || "");
        setItsmSaveError(null);
        setShowItsmForm(true);
    }

    async function handleSaveItsm(e) {
        e.preventDefault();
        setItsmSaving(true);
        setItsmSaveError(null);
        try {
            const saved = await saveItsmIntegration({
                id: itsmFormId || undefined,
                name: itsmName,
                webhookUrl: itsmWebhookUrl,
                platformType: itsmPlatformType,
                authToken: itsmAuthToken || undefined,
            });
            if (itsmFormId) {
                setItsmList(prev => prev.map(i => i.id === saved.id ? saved : i));
            } else {
                setItsmList(prev => [...prev, saved]);
            }
            setShowItsmForm(false);
        } catch (err) {
            setItsmSaveError(err.message || "Failed to save integration.");
        } finally {
            setItsmSaving(false);
        }
    }

    async function handleTestItsm(id) {
        setTestResults(prev => ({ ...prev, [id]: { loading: true } }));
        try {
            const result = await testItsmIntegration(id);
            setTestResults(prev => ({
                ...prev,
                [id]: {
                    loading: false,
                    success: result.success,
                    message: `HTTP ${result.statusCode} ${result.statusText}`,
                },
            }));
        } catch (err) {
            setTestResults(prev => ({
                ...prev,
                [id]: { loading: false, success: false, message: err.message || "Request failed" },
            }));
        }
    }

    async function handleDeleteItsm(id) {
        if (!window.confirm("Delete this ITSM integration?")) return;
        try {
            await deleteIntegration(id);
            setItsmList(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            alert(err.message || "Failed to delete integration.");
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Threat Intel handlers                                               */
    /* ------------------------------------------------------------------ */

    async function handleAddFeed(e) {
        e.preventDefault();
        setFeedSaving(true);
        setFeedSaveError(null);
        try {
            const saved = await addThreatIntelFeed({ name: feedName, feedUrl, feedType });
            setFeedList(prev => [...prev, saved]);
            setFeedName("");
            setFeedUrl("");
            setFeedType("json");
        } catch (err) {
            setFeedSaveError(err.message || "Failed to add feed.");
        } finally {
            setFeedSaving(false);
        }
    }

    async function handleFetchPreview(id) {
        setFeedPreviews(prev => ({ ...prev, [id]: { loading: true } }));
        try {
            const result = await fetchThreatIntelFeed(id);
            setFeedPreviews(prev => ({ ...prev, [id]: { loading: false, data: result.data, ok: result.ok, statusCode: result.statusCode } }));
        } catch (err) {
            setFeedPreviews(prev => ({ ...prev, [id]: { loading: false, error: err.message || "Fetch failed" } }));
        }
    }

    async function handleDeleteFeed(id) {
        if (!window.confirm("Remove this threat intel feed?")) return;
        try {
            await deleteIntegration(id);
            setFeedList(prev => prev.filter(f => f.id !== id));
            setFeedPreviews(prev => { const next = { ...prev }; delete next[id]; return next; });
        } catch (err) {
            alert(err.message || "Failed to remove feed.");
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Render                                                              */
    /* ------------------------------------------------------------------ */

    return (
        <AdminDashboardLayout>
            <BackButton to="/" />

            <div className="dashboard-card">
                <h2>🔌 Integrations</h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                    Connect S.I.R.E. to external ITSM platforms and threat intelligence feeds.
                </p>
            </div>

            {/** Tab navigation */}
            <div className="integration-tabs">
                <button
                    className={`integration-tab${activeTab === "itsm" ? " active" : ""}`}
                    onClick={() => setActiveTab("itsm")}
                >
                    🎫 ITSM / Ticketing
                </button>
                <button
                    className={`integration-tab${activeTab === "threat-intel" ? " active" : ""}`}
                    onClick={() => setActiveTab("threat-intel")}
                >
                    🧬 Threat Intelligence
                </button>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* ITSM tab                                                          */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === "itsm" && (
                <>
                    <div className="dashboard-card">
                        <h3>ITSM / Incident Management</h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                            Configure a webhook endpoint to push session findings and evidence packs into your
                            ticketing or incident management platform (ServiceNow, Jira, PagerDuty, or any
                            generic webhook).
                        </p>
                        <button className="filter-btn active" onClick={openCreateForm}>
                            + Add ITSM Webhook
                        </button>
                    </div>

                    {/** ITSM create / edit form */}
                    {showItsmForm && (
                        <div className="dashboard-card">
                            <h3>{itsmFormId ? "Edit ITSM Integration" : "New ITSM Integration"}</h3>
                            <form onSubmit={handleSaveItsm} className="integration-form">
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={itsmName}
                                        onChange={e => setItsmName(e.target.value)}
                                        placeholder="e.g. Jira Service Desk"
                                        required
                                        maxLength={80}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Platform Type</label>
                                    <select value={itsmPlatformType} onChange={e => setItsmPlatformType(e.target.value)}>
                                        {PLATFORM_TYPES.map(p => (
                                            <option key={p.value} value={p.value}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Webhook URL <span style={{ color: "var(--color-text-muted)", fontSize: "0.78rem" }}>(HTTPS required)</span></label>
                                    <input
                                        type="url"
                                        value={itsmWebhookUrl}
                                        onChange={e => setItsmWebhookUrl(e.target.value)}
                                        placeholder="https://your-platform.example.com/webhook"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Auth Token <span style={{ color: "var(--color-text-muted)", fontSize: "0.78rem" }}>(optional — sent as Bearer token)</span></label>
                                    <input
                                        type="password"
                                        value={itsmAuthToken}
                                        onChange={e => setItsmAuthToken(e.target.value)}
                                        placeholder="Leave blank if not required"
                                        autoComplete="off"
                                    />
                                </div>
                                {itsmSaveError && (
                                    <p style={{ color: "rgb(255,100,100)", fontSize: "0.85rem" }}>{itsmSaveError}</p>
                                )}
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button type="submit" className="filter-btn active" disabled={itsmSaving}>
                                        {itsmSaving ? "Saving…" : "Save"}
                                    </button>
                                    <button type="button" className="filter-btn" onClick={() => setShowItsmForm(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/** ITSM integrations list */}
                    {itsmLoading ? (
                        <div className="dashboard-card"><p>Loading…</p></div>
                    ) : itsmError ? (
                        <div className="dashboard-card">
                            <p style={{ color: "rgb(255,100,100)" }}>{itsmError}</p>
                        </div>
                    ) : itsmList.length === 0 ? (
                        <div className="dashboard-card">
                            <p style={{ opacity: 0.65 }}>No ITSM integrations configured yet. Add one above to start pushing findings to your ticketing platform.</p>
                        </div>
                    ) : (
                        itsmList.map(integration => {
                            const test = testResults[integration.id] || {};
                            return (
                                <div key={integration.id} className="dashboard-card integration-card">
                                    <div className="integration-header">
                                        <div>
                                            <strong>{integration.name}</strong>
                                            <span className="platform-badge">
                                                {PLATFORM_TYPES.find(p => p.value === integration.config?.platformType)?.label || "Generic Webhook"}
                                            </span>
                                        </div>
                                        <div className="integration-actions">
                                            <button
                                                className="filter-btn"
                                                onClick={() => handleTestItsm(integration.id)}
                                                disabled={test.loading}
                                            >
                                                {test.loading ? "Testing…" : "🔗 Test"}
                                            </button>
                                            <button className="filter-btn" onClick={() => openEditForm(integration)}>✏ Edit</button>
                                            <button className="filter-btn danger" onClick={() => handleDeleteItsm(integration.id)}>🗑 Delete</button>
                                        </div>
                                    </div>

                                    <p className="integration-url">{integration.config?.webhookUrl}</p>

                                    {test.message && (
                                        <div style={{ marginTop: "0.4rem" }}>
                                            <StatusBadge ok={test.success} label={test.message} />
                                        </div>
                                    )}

                                    <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
                                        Use the <strong>Push to ITSM</strong> button on the post-session report to send an evidence pack here.
                                    </p>
                                </div>
                            );
                        })
                    )}
                </>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* Threat Intel tab                                                  */}
            {/* ---------------------------------------------------------------- */}
            {activeTab === "threat-intel" && (
                <>
                    <div className="dashboard-card">
                        <h3>Threat Intelligence Feeds</h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                            Register external threat intelligence sources to enrich scenario realism and
                            reporting. S.I.R.E. will proxy-fetch items from configured JSON API feeds so
                            you can reference real-world indicators when authoring or reviewing scenarios.
                        </p>

                        {/** Add feed form */}
                        <form onSubmit={handleAddFeed} className="integration-form">
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                <input
                                    type="text"
                                    value={feedName}
                                    onChange={e => setFeedName(e.target.value)}
                                    placeholder="Feed name (e.g. CISA KEV)"
                                    required
                                    maxLength={80}
                                    style={{ flex: "1 1 160px" }}
                                />
                                <input
                                    type="url"
                                    value={feedUrl}
                                    onChange={e => setFeedUrl(e.target.value)}
                                    placeholder="https://feed.example.com/api/indicators"
                                    required
                                    style={{ flex: "2 1 280px" }}
                                />
                                <select
                                    value={feedType}
                                    onChange={e => setFeedType(e.target.value)}
                                    style={{ flex: "0 0 auto", background: "var(--color-surface)", color: "inherit", border: "1px solid var(--color-border-mid)", borderRadius: "4px", padding: "0.35rem 0.5rem" }}
                                >
                                    {FEED_TYPES.map(f => (
                                        <option key={f.value} value={f.value}>{f.label}</option>
                                    ))}
                                </select>
                                <button type="submit" className="filter-btn active" disabled={feedSaving}>
                                    {feedSaving ? "Adding…" : "+ Add Feed"}
                                </button>
                            </div>
                            {feedSaveError && (
                                <p style={{ color: "rgb(255,100,100)", fontSize: "0.85rem", marginTop: "0.4rem" }}>{feedSaveError}</p>
                            )}
                        </form>
                    </div>

                    {/** Feed list */}
                    {feedLoading ? (
                        <div className="dashboard-card"><p>Loading…</p></div>
                    ) : feedError ? (
                        <div className="dashboard-card">
                            <p style={{ color: "rgb(255,100,100)" }}>{feedError}</p>
                        </div>
                    ) : feedList.length === 0 ? (
                        <div className="dashboard-card">
                            <p style={{ opacity: 0.65 }}>No threat intel feeds configured yet. Add one above.</p>
                            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
                                Example public feeds: CISA Known Exploited Vulnerabilities catalogue
                                (<code>https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json</code>),
                                AlienVault OTX, or any JSON REST API that returns threat indicators.
                            </p>
                        </div>
                    ) : (
                        feedList.map(feed => {
                            const preview = feedPreviews[feed.id] || {};
                            return (
                                <div key={feed.id} className="dashboard-card integration-card">
                                    <div className="integration-header">
                                        <div>
                                            <strong>{feed.name}</strong>
                                            <span className="platform-badge">{feed.config?.feedType?.toUpperCase() || "JSON"}</span>
                                        </div>
                                        <div className="integration-actions">
                                            <button
                                                className="filter-btn"
                                                onClick={() => handleFetchPreview(feed.id)}
                                                disabled={preview.loading}
                                            >
                                                {preview.loading ? "Fetching…" : "👁 Preview"}
                                            </button>
                                            <button className="filter-btn danger" onClick={() => handleDeleteFeed(feed.id)}>🗑 Remove</button>
                                        </div>
                                    </div>

                                    <p className="integration-url">{feed.config?.feedUrl}</p>

                                    {/** Feed preview */}
                                    {preview.error && (
                                        <p style={{ color: "rgb(255,100,100)", fontSize: "0.82rem", marginTop: "0.4rem" }}>
                                            ❌ {preview.error}
                                        </p>
                                    )}
                                    {preview.data && !preview.error && (
                                        <div className="feed-preview">
                                            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "0.4rem" }}>
                                                HTTP {preview.statusCode} — Preview (first 2&nbsp;000 chars of JSON response):
                                            </p>
                                            <pre className="feed-preview-content">
                                                {JSON.stringify(preview.data, null, 2).slice(0, 2000)}
                                                {JSON.stringify(preview.data, null, 2).length > 2000 ? "\n…" : ""}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </>
            )}
        </AdminDashboardLayout>
    );
}
