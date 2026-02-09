import React, { useState } from 'react';
import ScenarioSelector from './ScenarioSelector';
import { createSession } from '../services/api';

const SessionSetup = ({ role, onSessionCreated, onSessionJoined }) => {
  const [instructorName, setInstructorName] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdSessionCode, setCreatedSessionCode] = useState('');
  
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!selectedScenario || !instructorName) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const session = await createSession(selectedScenario, instructorName);
      setCreatedSessionCode(session.sessionCode);
      if (onSessionCreated) {
        onSessionCreated(session);
      }
    } catch (err) {
      setError('Failed to create session. Make sure the backend is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleJoinSession = (e) => {
    e.preventDefault();
    if (!sessionCode || !displayName) {
      setError('Please fill in all fields');
      return;
    }
    
    setError('');
    if (onSessionJoined) {
      onSessionJoined({ sessionCode: sessionCode.toUpperCase(), displayName });
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdSessionCode);
  };
  
  if (role === 'admin') {
    if (createdSessionCode) {
      return (
        <div className="session-setup">
          <div className="session-created">
            <h2>✓ Session Created Successfully!</h2>
            <div className="session-code-display">
              <label>Session Code:</label>
              <div className="session-code-box">
                <span className="session-code">{createdSessionCode}</span>
                <button onClick={copyToClipboard} className="btn-copy">
                  Copy
                </button>
              </div>
            </div>
            <p className="session-instructions">
              Share this code with trainees so they can join your session.
            </p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="session-setup">
        <h2>Create Training Session</h2>
        <form onSubmit={handleCreateSession} className="setup-form">
          <div className="form-group">
            <label htmlFor="instructor-name">Your Name (Instructor):</label>
            <input
              id="instructor-name"
              type="text"
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              placeholder="Enter your name"
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <ScenarioSelector 
              value={selectedScenario}
              onChange={setSelectedScenario}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create Session'}
          </button>
        </form>
      </div>
    );
  }
  
  // Trainee view
  return (
    <div className="session-setup">
      <h2>Join Training Session</h2>
      <form onSubmit={handleJoinSession} className="setup-form">
        <div className="form-group">
          <label htmlFor="session-code">Session Code:</label>
          <input
            id="session-code"
            type="text"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
            placeholder="Enter session code (e.g., ABC-1234)"
            maxLength={20}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="display-name">Your Name:</label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button type="submit" className="btn-primary">
          Join Session
        </button>
      </form>
    </div>
  );
};

export default SessionSetup;
