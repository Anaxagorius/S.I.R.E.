import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import EventLog from './EventLog';
import TimelineDisplay from './TimelineDisplay';
import { SCENARIOS } from './ScenarioSelector';
import { deleteSession } from '../services/api';

const AdminDashboard = ({ session }) => {
  const { socket, connected, emit, on } = useSocket();
  const [roster, setRoster] = useState([]);
  const [events, setEvents] = useState([]);
  const [currentTimelineIndex, setCurrentTimelineIndex] = useState(-1);
  const [timeline, setTimeline] = useState([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [injectMessage, setInjectMessage] = useState('');
  const [injectSeverity, setInjectSeverity] = useState('warning');
  const [injectFeedback, setInjectFeedback] = useState('');
  
  const scenarioInfo = SCENARIOS.find(s => s.key === session.scenarioKey);
  
  useEffect(() => {
    if (!socket || !connected) return;
    
    // Listen for roster updates when someone joins
    const unsubJoined = on('session:joined', (data) => {
      if (data.roster) {
        setRoster(data.roster);
      }
      if (data.currentTimelineIndex !== undefined) {
        setCurrentTimelineIndex(data.currentTimelineIndex);
      }
    });
    
    // Listen for timeline ticks
    const unsubTick = on('timeline:tick', (data) => {
      console.log('Timeline tick:', data);
      setCurrentTimelineIndex(data.index);
      
      // Add to events
      setEvents(prev => [...prev, {
        actorRole: 'timeline',
        displayName: 'System',
        action: `${data.title}: ${data.description}`,
        timestampIso: new Date().toISOString()
      }]);
      
      // Update timeline
      setTimeline(prev => {
        const exists = prev.find(e => e.index === data.index);
        if (exists) return prev;
        return [...prev, data].sort((a, b) => a.index - b.index);
      });
    });
    
    // Listen for event logs
    const unsubLog = on('event:log:broadcast', (data) => {
      console.log('Event log:', data);
      setEvents(prev => [...prev, data]);
    });
    
    // Listen for session end
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
  }, [socket, connected, on]);
  
  const handleStartScenario = () => {
    if (!socket || !connected) {
      alert('Not connected to server');
      return;
    }
    
    emit('session:start', { sessionCode: session.sessionCode });
    setSessionStarted(true);
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
    
    emit('admin:inject', {
      sessionCode: session.sessionCode,
      message: injectMessage,
      severity: injectSeverity
    });
    
    setInjectFeedback('Event injected!');
    setTimeout(() => setInjectFeedback(''), 2000);
    setInjectMessage('');
  };
  
  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this session?')) return;
    
    try {
      await deleteSession(session.sessionCode);
      alert('Session ended successfully');
      window.location.reload();
    } catch (err) {
      alert('Failed to end session');
      console.error(err);
    }
  };
  
  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>🚨 S.I.R.E. - Incident Response Simulator</h1>
          <span className="role-badge">Admin</span>
        </div>
        <div className="connection-status">
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
            
            <div className="scenario-info">
              <h4>{scenarioInfo?.title || session.scenarioKey}</h4>
              <p className="scenario-desc">{scenarioInfo?.description}</p>
              <span className={`status-badge ${sessionStarted ? 'active' : 'pending'}`}>
                {sessionStarted ? 'Active' : 'Waiting to Start'}
              </span>
            </div>
            
            <button 
              onClick={handleStartScenario} 
              disabled={sessionStarted || !connected}
              className="btn-start"
            >
              {sessionStarted ? '✓ Scenario Started' : 'Start Scenario'}
            </button>
            
            <div className="participants-section">
              <h4>Participants ({roster.length})</h4>
              <ul className="roster-list">
                {roster.length === 0 ? (
                  <li className="no-participants">No trainees yet</li>
                ) : (
                  roster.map((trainee, idx) => (
                    <li key={idx}>
                      <span className="participant-icon">👤</span>
                      {trainee.displayName}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          
          <div className="inject-panel">
            <h3>Admin Injection</h3>
            <form onSubmit={handleInjectEvent}>
              <div className="form-group">
                <label htmlFor="inject-message">Event Message:</label>
                <textarea
                  id="inject-message"
                  value={injectMessage}
                  onChange={(e) => setInjectMessage(e.target.value)}
                  placeholder="Enter custom event or instruction..."
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
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <button type="submit" disabled={!connected} className="btn-inject">
                Inject Event
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
