import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import EventLog from './EventLog';
import TimelineDisplay from './TimelineDisplay';
import { SCENARIOS } from './ScenarioSelector';
import { deleteSession } from '../services/api';

const QUICK_INJECTS = [
  { label: '🔔 All-Clear', message: 'All clear — threat has been resolved. Resume normal operations.', severity: 'info' },
  { label: '⚠️ Escalate', message: 'Situation is escalating. Increase response level immediately.', severity: 'warning' },
  { label: '🚨 Evacuate Now', message: 'IMMEDIATE EVACUATION required. All personnel exit via designated routes.', severity: 'critical' },
  { label: '🛑 Shelter-In-Place', message: 'Shelter in place. Do NOT leave your current location until further notice.', severity: 'critical' },
  { label: '📞 Call Emergency Services', message: 'Contact emergency services immediately. Report your location and situation.', severity: 'warning' },
  { label: '✅ Stand Down', message: 'Stand down. Exercise concluded. Await debrief instructions.', severity: 'info' },
];

const DebriefModal = ({ events, sessionCode, onClose }) => {
  const traineeActions = events.filter(e => e.actorRole === 'trainee');
  const adminEvents = events.filter(e => e.actorRole === 'admin');
  const timelineEvents = events.filter(e => e.actorRole === 'timeline');

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Session Debrief">
      <div className="modal-content debrief-modal">
        <div className="debrief-header">
          <h2>📋 After-Action Report</h2>
          <p className="debrief-session-code">Session: {sessionCode}</p>
        </div>

        <div className="debrief-stats">
          <div className="debrief-stat">
            <span className="stat-value">{timelineEvents.length}</span>
            <span className="stat-label">Timeline Events</span>
          </div>
          <div className="debrief-stat">
            <span className="stat-value">{adminEvents.length}</span>
            <span className="stat-label">Admin Injections</span>
          </div>
          <div className="debrief-stat">
            <span className="stat-value">{traineeActions.length}</span>
            <span className="stat-label">Trainee Responses</span>
          </div>
        </div>

        {traineeActions.length > 0 && (
          <div className="debrief-section">
            <h3>Trainee Actions</h3>
            <div className="debrief-actions-list">
              {traineeActions.map((evt, idx) => (
                <div key={idx} className="debrief-action-item">
                  <div className="debrief-action-header">
                    <span className="debrief-trainee-name">👤 {evt.displayName}</span>
                    <span className="debrief-action-time">
                      {evt.timestampIso ? new Date(evt.timestampIso).toLocaleTimeString() : ''}
                    </span>
                  </div>
                  <p className="debrief-action-text">{evt.action}</p>
                  {evt.rationale && <p className="debrief-rationale">Rationale: {evt.rationale}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose} className="btn-primary debrief-close-btn">
          Close &amp; Return to Home
        </button>
      </div>
    </div>
  );
};

const AdminDashboard = ({ session }) => {
  const { connected, emit, on } = useSocket();
  const [roster, setRoster] = useState([]);
  const [events, setEvents] = useState([]);
  const [currentTimelineIndex, setCurrentTimelineIndex] = useState(-1);
  const [timeline, setTimeline] = useState([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [injectMessage, setInjectMessage] = useState('');
  const [injectSeverity, setInjectSeverity] = useState('warning');
  const [injectFeedback, setInjectFeedback] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [showDebrief, setShowDebrief] = useState(false);

  const scenarioInfo = SCENARIOS.find(s => s.key === session.scenarioKey);

  // Elapsed-time clock
  useEffect(() => {
    if (!sessionStarted || !startTime) return;
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [sessionStarted, startTime]);

  const formatElapsed = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (!connected) return;

    emit('admin:join', { sessionCode: session.sessionCode });

    const unsubJoined = on('session:joined', (data) => {
      if (data.roster) setRoster(data.roster);
      if (data.currentTimelineIndex !== undefined) setCurrentTimelineIndex(data.currentTimelineIndex);
    });

    const unsubTick = on('timeline:tick', (data) => {
      setCurrentTimelineIndex(data.index);
      setEvents(prev => [...prev, {
        actorRole: 'timeline',
        displayName: 'System',
        action: `${data.title}: ${data.description}`,
        timestampIso: new Date().toISOString()
      }]);
      setTimeline(prev => {
        if (prev.find(e => e.index === data.index)) return prev;
        return [...prev, data].sort((a, b) => a.index - b.index);
      });
    });

    const unsubLog = on('event:log:broadcast', (data) => {
      setEvents(prev => [...prev, data]);
    });

    const unsubEnd = on('session:end', () => {
      setShowDebrief(true);
    });

    return () => {
      if (unsubJoined) unsubJoined();
      if (unsubTick) unsubTick();
      if (unsubLog) unsubLog();
      if (unsubEnd) unsubEnd();
    };
  }, [connected, emit, on, session.sessionCode]);

  const handleStartScenario = () => {
    if (!connected) { alert('Not connected to server'); return; }
    emit('session:start', { sessionCode: session.sessionCode });
    setSessionStarted(true);
    setStartTime(Date.now());
    setEvents(prev => [...prev, {
      actorRole: 'admin',
      displayName: 'Instructor',
      action: 'Started scenario',
      timestampIso: new Date().toISOString()
    }]);
  };

  const handleInjectEvent = (e) => {
    e.preventDefault();
    if (!injectMessage.trim()) return;
    emit('admin:inject', { sessionCode: session.sessionCode, message: injectMessage, severity: injectSeverity });
    setInjectFeedback('Event injected!');
    setTimeout(() => setInjectFeedback(''), 2000);
    setInjectMessage('');
  };

  const handleQuickInject = useCallback((preset) => {
    emit('admin:inject', {
      sessionCode: session.sessionCode,
      message: preset.message,
      severity: preset.severity
    });
    setInjectFeedback(`Injected: ${preset.label}`);
    setTimeout(() => setInjectFeedback(''), 2000);
  }, [emit, session.sessionCode]);

  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this session?')) return;
    try {
      await deleteSession(session.sessionCode);
      setShowDebrief(true);
    } catch (err) {
      alert('Failed to end session');
      console.error(err);
    }
  };

  const handleDebriefClose = () => {
    window.location.reload();
  };

  return (
    <div className="admin-dashboard">
      {showDebrief && (
        <DebriefModal
          events={events}
          sessionCode={session.sessionCode}
          onClose={handleDebriefClose}
        />
      )}

      <div className="dashboard-header">
        <div className="header-left">
          <h1>🚨 S.I.R.E. — Incident Response Simulator</h1>
          <span className="role-badge">Instructor</span>
        </div>
        <div className="header-right">
          {sessionStarted && (
            <div className="session-timer" aria-label="Elapsed time">
              ⏱ {formatElapsed(elapsedSec)}
            </div>
          )}
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '● Connected' : '○ Disconnected'}
          </span>
        </div>
      </div>

      <div className="session-info-bar">
        <div className="session-code-info">
          <label>Session Code:</label>
          <span className="code">{session.sessionCode}</span>
        </div>
        <button onClick={handleEndSession} className="btn-danger">
          End Session
        </button>
      </div>

      <div className="dashboard-content">
        <aside className="dashboard-sidebar">
          <div className="control-panel">
            <h3>Session Controls</h3>

            <div className="scenario-info" style={{ '--scenario-color': scenarioInfo?.color || '#1e3a8a' }}>
              <div className="scenario-info-title">
                <span className="scenario-info-icon">{scenarioInfo?.icon || '🚨'}</span>
                <h4>{scenarioInfo?.title || session.scenarioKey}</h4>
              </div>
              <p className="scenario-desc">{scenarioInfo?.description}</p>
              <div className="scenario-info-meta">
                {scenarioInfo && (
                  <>
                    <span className="scenario-category-badge">{scenarioInfo.category}</span>
                    <span className="scenario-duration-badge">~{scenarioInfo.durationMin} min</span>
                  </>
                )}
                <span className={`status-badge ${sessionStarted ? 'active' : 'pending'}`}>
                  {sessionStarted ? '▶ Active' : '⏸ Pending'}
                </span>
              </div>
            </div>

            <button
              onClick={handleStartScenario}
              disabled={sessionStarted || !connected}
              className="btn-start"
            >
              {sessionStarted ? '✓ Scenario Running' : '▶ Start Scenario'}
            </button>

            <div className="participants-section">
              <h4>Participants ({roster.length})</h4>
              <ul className="roster-list">
                {roster.length === 0 ? (
                  <li className="no-participants">Waiting for trainees…</li>
                ) : (
                  roster.map((trainee, idx) => (
                    <li key={idx}>
                      <span className="participant-icon">
                        {trainee.roleIcon || '👤'}
                      </span>
                      <span className="participant-name">{trainee.displayName}</span>
                      {trainee.role && (
                        <span className="participant-role-badge">{trainee.role}</span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

          <div className="inject-panel">
            <h3>Admin Injection</h3>

            <div className="quick-injects">
              <p className="quick-inject-label">Quick Actions:</p>
              <div className="quick-inject-grid">
                {QUICK_INJECTS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className={`btn-quick-inject severity-${preset.severity}`}
                    onClick={() => handleQuickInject(preset)}
                    disabled={!connected}
                    title={preset.message}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleInjectEvent} className="inject-form">
              <div className="form-group">
                <label htmlFor="inject-message">Custom Message:</label>
                <textarea
                  id="inject-message"
                  value={injectMessage}
                  onChange={(e) => setInjectMessage(e.target.value)}
                  placeholder="Enter custom event or instruction…"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="inject-severity">Severity:</label>
                <select
                  id="inject-severity"
                  value={injectSeverity}
                  onChange={(e) => setInjectSeverity(e.target.value)}
                >
                  <option value="info">ℹ Info</option>
                  <option value="warning">⚠ Warning</option>
                  <option value="critical">🚨 Critical</option>
                </select>
              </div>

              <button type="submit" disabled={!connected || !injectMessage.trim()} className="btn-inject">
                Inject Custom Event
              </button>

              {injectFeedback && (
                <div className="inject-feedback">{injectFeedback}</div>
              )}
            </form>
          </div>
        </aside>

        <main className="dashboard-main">
          <TimelineDisplay timeline={timeline} currentIndex={currentTimelineIndex} />
          <EventLog events={events} />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
