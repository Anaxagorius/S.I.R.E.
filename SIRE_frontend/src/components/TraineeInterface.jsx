import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import EventLog from './EventLog';
import { SCENARIOS } from './ScenarioSelector';

const TraineeInterface = ({ sessionCode, displayName, scenarioKey }) => {
  const { socket, connected, emit, on } = useSocket();
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [previousEvents, setPreviousEvents] = useState([]);
  const [action, setAction] = useState('');
  const [rationale, setRationale] = useState('');
  const [actionFeedback, setActionFeedback] = useState('');
  const [joined, setJoined] = useState(false);
  
  const scenarioInfo = SCENARIOS.find(s => s.key === scenarioKey);
  
  useEffect(() => {
    if (!socket || !connected) return;
    
    // Join the session
    emit('session:join', { sessionCode, displayName });
    
    const unsubJoined = on('session:joined', (data) => {
      console.log('Joined session:', data);
      setJoined(true);
    });
    
    const unsubTick = on('timeline:tick', (data) => {
      console.log('Timeline tick:', data);
      
      // Move current to previous if it exists
      if (currentEvent) {
        setPreviousEvents(prev => [...prev, currentEvent]);
      }
      
      // Set new current event
      setCurrentEvent(data);
      
      // Add to events feed
      setEvents(prev => [...prev, {
        actorRole: 'timeline',
        displayName: 'System',
        action: `${data.title}: ${data.description}`,
        timestampIso: new Date().toISOString()
      }]);
    });
    
    const unsubLog = on('event:log:broadcast', (data) => {
      console.log('Event log:', data);
      setEvents(prev => [...prev, data]);
    });
    
    const unsubEnd = on('session:end', (data) => {
      console.log('Session ended:', data);
      alert(`Session ended: ${data.reason}`);
    });
    
    return () => {
      if (unsubJoined) unsubJoined();
      if (unsubTick) unsubTick();
      if (unsubLog) unsubLog();
      if (unsubEnd) unsubEnd();
    };
  }, [socket, connected, sessionCode, displayName, emit, on, currentEvent]);
  
  const handleLogAction = (e) => {
    e.preventDefault();
    if (!action.trim()) return;
    
    emit('event:log', {
      sessionCode,
      displayName,
      action: action.trim(),
      rationale: rationale.trim()
    });
    
    setActionFeedback('Action logged!');
    setTimeout(() => setActionFeedback(''), 2000);
    setAction('');
    setRationale('');
  };
  
  const getScenarioIcon = () => {
    if (!scenarioKey) return '🚨';
    if (scenarioKey.includes('fire')) return '🔥';
    if (scenarioKey.includes('flood')) return '💧';
    if (scenarioKey.includes('cyber')) return '💻';
    if (scenarioKey.includes('medical')) return '🏥';
    if (scenarioKey.includes('weather')) return '⛈️';
    if (scenarioKey.includes('power')) return '⚡';
    if (scenarioKey.includes('threat')) return '⚠️';
    if (scenarioKey.includes('hazardous')) return '☣️';
    return '🚨';
  };
  
  return (
    <div className="trainee-interface">
      <div className="trainee-header">
        <h1>🚨 S.I.R.E. - Incident Response Simulator</h1>
        <div className="trainee-info">
          <span className="trainee-name">Trainee: {displayName}</span>
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '● Connected' : '○ Disconnected'}
          </span>
        </div>
      </div>
      
      {!joined && (
        <div className="joining-message">
          <p>Joining session {sessionCode}...</p>
        </div>
      )}
      
      {joined && (
        <>
          <div className="scenario-header">
            <div className="scenario-title">
              <span className="scenario-icon">{getScenarioIcon()}</span>
              <h2>{scenarioInfo?.title || scenarioKey}</h2>
            </div>
            <span className="session-code-badge">Session: {sessionCode}</span>
          </div>
          
          {currentEvent ? (
            <div className="current-event-section">
              <div className="current-event-card">
                <div className="event-badge">CURRENT EVENT</div>
                <h3>{currentEvent.title}</h3>
                <p className="event-description">{currentEvent.description}</p>
                <span className="event-number">
                  Event {currentEvent.index + 1}
                </span>
              </div>
            </div>
          ) : (
            <div className="waiting-message">
              <p>Waiting for instructor to start the scenario...</p>
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
            <form onSubmit={handleLogAction}>
              <div className="form-group">
                <label htmlFor="action-input">What did you do?</label>
                <input
                  id="action-input"
                  type="text"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="Describe your action..."
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
                  placeholder="Your reasoning..."
                  disabled={!connected}
                />
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
