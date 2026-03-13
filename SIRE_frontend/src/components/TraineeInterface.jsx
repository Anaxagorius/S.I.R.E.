import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import EventLog from './EventLog';
import { SCENARIOS } from './ScenarioSelector';

const TRAINEE_ROLES = [
  { key: 'security', label: 'Security Officer', icon: '🛡️' },
  { key: 'safety', label: 'Safety Coordinator', icon: '🦺' },
  { key: 'medical', label: 'First Aid / Medical', icon: '🏥' },
  { key: 'communications', label: 'Communications', icon: '📡' },
  { key: 'facilities', label: 'Facilities Manager', icon: '🔧' },
  { key: 'evacuation', label: 'Evacuation Warden', icon: '🚪' },
];

const ROLE_QUICK_ACTIONS = {
  security: ['Securing perimeter', 'Escorting personnel to safety', 'Communicating threat status to leadership', 'Monitoring access points'],
  safety: ['Conducting headcount', 'Assessing hazards', 'Coordinating with emergency services', 'Documenting incident details'],
  medical: ['Assessing injured personnel', 'Administering first aid', 'Preparing for EMS handoff', 'Requesting additional medical support'],
  communications: ['Broadcasting emergency alert', 'Notifying leadership', 'Documenting timeline', 'Coordinating with external agencies'],
  facilities: ['Shutting down affected systems', 'Assessing structural damage', 'Restoring utilities', 'Clearing access routes'],
  evacuation: ['Directing personnel to exits', 'Checking rooms for remaining occupants', 'Confirming all personnel at assembly point', 'Reporting headcount to coordinator'],
};

const DebriefModal = ({ events, displayName, role, onClose }) => {
  const myActions = events.filter(e => e.actorRole === 'trainee' && e.displayName === displayName);
  const totalEvents = events.filter(e => e.actorRole === 'timeline').length;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Session Debrief">
      <div className="modal-content debrief-modal">
        <div className="debrief-header">
          <h2>📋 After-Action Report</h2>
          <p className="debrief-session-code">
            {role ? `${role.icon} ${role.label}` : ''}  — {displayName}
          </p>
        </div>

        <div className="debrief-stats">
          <div className="debrief-stat">
            <span className="stat-value">{totalEvents}</span>
            <span className="stat-label">Scenario Events</span>
          </div>
          <div className="debrief-stat">
            <span className="stat-value">{myActions.length}</span>
            <span className="stat-label">Your Responses</span>
          </div>
          <div className="debrief-stat">
            <span className="stat-value">
              {totalEvents > 0 ? Math.round((myActions.length / totalEvents) * 100) : 0}%
            </span>
            <span className="stat-label">Response Rate</span>
          </div>
        </div>

        {myActions.length > 0 ? (
          <div className="debrief-section">
            <h3>Your Logged Actions</h3>
            <div className="debrief-actions-list">
              {myActions.map((evt, idx) => (
                <div key={idx} className="debrief-action-item">
                  <div className="debrief-action-header">
                    <span className="debrief-action-num">#{idx + 1}</span>
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
        ) : (
          <div className="debrief-section">
            <p className="debrief-no-actions">No actions were logged during this session.</p>
          </div>
        )}

        <button onClick={onClose} className="btn-primary debrief-close-btn">
          Return to Home
        </button>
      </div>
    </div>
  );
};

const TraineeInterface = ({ sessionCode, displayName, scenarioKey }) => {
  const { connected, emit, on } = useSocket();
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [previousEvents, setPreviousEvents] = useState([]);
  const [action, setAction] = useState('');
  const [rationale, setRationale] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');
  const [joined, setJoined] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleConfirmed, setRoleConfirmed] = useState(false);
  const [urgency, setUrgency] = useState('normal');
  const [showDebrief, setShowDebrief] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const currentEventRef = useRef(null);

  const scenarioInfo = SCENARIOS.find(s => s.key === scenarioKey);
  const roleInfo = TRAINEE_ROLES.find(r => r.key === selectedRole);

  // Session elapsed clock
  useEffect(() => {
    if (!sessionStartTime) return;
    const id = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [sessionStartTime]);

  const formatElapsed = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (!connected) return;

    // Set up all event listeners first (before the join emit so we don't miss the joined event)
    const unsubJoined = on('session:joined', () => {
      setJoined(true);
    });

    const unsubTick = on('timeline:tick', (data) => {
      if (!sessionStartTime) setSessionStartTime(Date.now());

      if (currentEventRef.current) {
        setPreviousEvents(prev => [...prev, currentEventRef.current]);
      }
      currentEventRef.current = data;
      setCurrentEvent(data);

      setEvents(prev => [...prev, {
        actorRole: 'timeline',
        displayName: 'System',
        action: `${data.title}: ${data.description}`,
        timestampIso: new Date().toISOString()
      }]);
    });

    const unsubLog = on('event:log:broadcast', (data) => {
      setEvents(prev => [...prev, data]);
    });

    const unsubEnd = on('session:end', () => {
      setShowDebrief(true);
    });

    // Only join once roleConfirmed is true so role is included in the join payload
    if (roleConfirmed) {
      emit('session:join', { sessionCode, displayName, role: selectedRole });
    }

    return () => {
      if (unsubJoined) unsubJoined();
      if (unsubTick) unsubTick();
      if (unsubLog) unsubLog();
      if (unsubEnd) unsubEnd();
    };
  }, [connected, roleConfirmed, sessionCode, displayName, selectedRole, emit, on, sessionStartTime]);

  const handleLogAction = (e) => {
    e.preventDefault();
    if (!action.trim()) return;

    const fullAction = urgency === 'urgent'
      ? `[URGENT] ${action.trim()}`
      : action.trim();

    emit('event:log', { sessionCode, displayName, action: fullAction, rationale: rationale.trim() });
    setActionFeedback('Action logged!');
    setTimeout(() => setActionFeedback(''), 2000);
    setAction('');
    setRationale('');
    setUrgency('normal');
  };

  const handleQuickAction = (quickAction) => {
    setAction(quickAction);
  };

  const getScenarioIcon = () => {
    return scenarioInfo?.icon || '🚨';
  };

  const getEventSeverityClass = (evt) => {
    if (evt.actorRole !== 'admin') return '';
    if (evt.rationale === 'critical') return 'severity-critical';
    if (evt.rationale === 'warning') return 'severity-warning';
    return 'severity-info';
  };

  if (!roleConfirmed) {
    return (
      <div className="role-selection-page">
        <div className="role-selection-content">
          <h2>Choose Your Role</h2>
          <p className="role-selection-hint">
            Select the role you will play in this exercise: <strong>{scenarioInfo?.title || scenarioKey}</strong>
          </p>
          <div className="trainee-role-grid">
            {TRAINEE_ROLES.map(role => (
              <button
                key={role.key}
                type="button"
                className={`trainee-role-card ${selectedRole === role.key ? 'trainee-role-selected' : ''}`}
                onClick={() => setSelectedRole(role.key)}
                aria-pressed={selectedRole === role.key}
              >
                <span className="trainee-role-icon">{role.icon}</span>
                <span className="trainee-role-label">{role.label}</span>
              </button>
            ))}
          </div>
          <button
            className="btn-primary"
            disabled={!selectedRole}
            onClick={() => setRoleConfirmed(true)}
          >
            Confirm Role &amp; Join Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trainee-interface">
      {showDebrief && (
        <DebriefModal
          events={events}
          displayName={displayName}
          role={roleInfo}
          onClose={() => window.location.reload()}
        />
      )}

      <div className="trainee-header">
        <div className="trainee-header-left">
          <h1>🚨 S.I.R.E. — Incident Response Simulator</h1>
          <span className="role-badge">{roleInfo?.icon} {roleInfo?.label}</span>
        </div>
        <div className="trainee-header-right">
          {sessionStartTime && (
            <div className="session-timer">⏱ {formatElapsed(elapsedSec)}</div>
          )}
          <span className="trainee-name-badge">👤 {displayName}</span>
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '● Connected' : '○ Disconnected'}
          </span>
        </div>
      </div>

      {!joined && (
        <div className="joining-message">
          <p>Joining session {sessionCode}…</p>
        </div>
      )}

      {joined && (
        <>
          <div className="scenario-header" style={{ '--scenario-color': scenarioInfo?.color || '#1e3a8a' }}>
            <div className="scenario-title">
              <span className="scenario-icon">{getScenarioIcon()}</span>
              <h2>{scenarioInfo?.title || scenarioKey}</h2>
            </div>
            <span className="session-code-badge">Session: {sessionCode}</span>
          </div>

          {currentEvent ? (
            <div className="current-event-section">
              <div className={`current-event-card ${getEventSeverityClass(currentEvent)}`}>
                <div className="event-badge">CURRENT EVENT</div>
                <h3>{currentEvent.title}</h3>
                <p className="event-description">{currentEvent.description}</p>
                <span className="event-number">Event {currentEvent.index + 1}</span>
              </div>
            </div>
          ) : (
            <div className="waiting-message">
              <div className="waiting-pulse">⏳</div>
              <p>Waiting for instructor to start the scenario…</p>
              <p className="waiting-hint">Session code: <strong>{sessionCode}</strong></p>
            </div>
          )}

          {previousEvents.length > 0 && (
            <div className="previous-events">
              <details>
                <summary>View Previous Events ({previousEvents.length})</summary>
                <div className="previous-events-list">
                  {previousEvents.map((evt, idx) => (
                    <div key={idx} className="previous-event-item">
                      <strong>{evt.title}</strong>
                      <p>{evt.description}</p>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          <div className="action-logger">
            <h3>Log Your Action</h3>

            {selectedRole && ROLE_QUICK_ACTIONS[selectedRole] && (
              <div className="quick-actions">
                <p className="quick-actions-label">Quick actions for your role:</p>
                <div className="quick-actions-grid">
                  {ROLE_QUICK_ACTIONS[selectedRole].map((qa, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="btn-quick-action"
                      onClick={() => handleQuickAction(qa)}
                      disabled={!connected}
                    >
                      {qa}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleLogAction} className="action-form">
              <div className="form-group">
                <label htmlFor="action-input">What did you do?</label>
                <input
                  id="action-input"
                  type="text"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="Describe your action…"
                  disabled={!connected}
                />
              </div>

              <div className="form-group">
                <label htmlFor="rationale-input">Why? (optional)</label>
                <input
                  id="rationale-input"
                  type="text"
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Your reasoning…"
                  disabled={!connected}
                />
              </div>

              <div className="form-group urgency-group">
                <label>Urgency:</label>
                <div className="urgency-buttons">
                  <button
                    type="button"
                    className={`urgency-btn ${urgency === 'normal' ? 'urgency-selected' : ''}`}
                    onClick={() => setUrgency('normal')}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    className={`urgency-btn urgency-urgent ${urgency === 'urgent' ? 'urgency-selected' : ''}`}
                    onClick={() => setUrgency('urgent')}
                  >
                    🚨 Urgent
                  </button>
                </div>
              </div>

              <button type="submit" disabled={!connected || !action.trim()} className="btn-log">
                Log Action
              </button>

              {actionFeedback && (
                <div className="action-feedback">{actionFeedback}</div>
              )}
            </form>
          </div>

          <EventLog events={events} />
        </>
      )}
    </div>
  );
};

export default TraineeInterface;
