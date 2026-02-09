import { useState } from 'react';
import './App.css';
import SessionSetup from './components/SessionSetup';
import AdminDashboard from './components/AdminDashboard';
import TraineeInterface from './components/TraineeInterface';

function App() {
  const [role, setRole] = useState(null); // 'admin' or 'trainee'
  const [session, setSession] = useState(null);
  const [traineeInfo, setTraineeInfo] = useState(null);

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
  };

  const handleSessionCreated = (createdSession) => {
    setSession(createdSession);
  };

  const handleSessionJoined = (info) => {
    setTraineeInfo(info);
  };

  const handleBack = () => {
    setRole(null);
    setSession(null);
    setTraineeInfo(null);
  };

  // Landing page - Role selection
  if (!role) {
    return (
      <div className="app">
        <div className="landing-page">
          <div className="landing-content">
            <h1 className="landing-title">
              🚨 S.I.R.E.
            </h1>
            <p className="landing-subtitle">
              Simulator for Incident Response Exercises
            </p>
            <p className="landing-description">
              Real-time training platform for emergency response scenarios
            </p>
            
            <div className="role-selection">
              <h2>Select Your Role</h2>
              <div className="role-buttons">
                <button 
                  className="role-button role-admin"
                  onClick={() => handleRoleSelect('admin')}
                >
                  <span className="role-icon">👨‍🏫</span>
                  <span className="role-name">Instructor</span>
                  <span className="role-desc">Create and manage training sessions</span>
                </button>
                
                <button 
                  className="role-button role-trainee"
                  onClick={() => handleRoleSelect('trainee')}
                >
                  <span className="role-icon">👨‍💼</span>
                  <span className="role-name">Trainee</span>
                  <span className="role-desc">Join and participate in exercises</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin flow
  if (role === 'admin') {
    if (!session) {
      return (
        <div className="app">
          <div className="setup-page">
            <button onClick={handleBack} className="btn-back">← Back to Home</button>
            <SessionSetup 
              role="admin" 
              onSessionCreated={handleSessionCreated}
            />
          </div>
        </div>
      );
    }
    
    return (
      <div className="app">
        <AdminDashboard session={session} />
      </div>
    );
  }

  // Trainee flow
  if (role === 'trainee') {
    if (!traineeInfo) {
      return (
        <div className="app">
          <div className="setup-page">
            <button onClick={handleBack} className="btn-back">← Back to Home</button>
            <SessionSetup 
              role="trainee" 
              onSessionJoined={handleSessionJoined}
            />
          </div>
        </div>
      );
    }
    
    return (
      <div className="app">
        <TraineeInterface 
          sessionCode={traineeInfo.sessionCode}
          displayName={traineeInfo.displayName}
          scenarioKey={session?.scenarioKey}
        />
      </div>
    );
  }

  return null;
}

export default App;
