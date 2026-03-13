import React from 'react';

const SCENARIOS = [
  {
    key: 'scenario_active_threat',
    title: 'Active Threat',
    icon: '🔫',
    category: 'Security',
    difficulty: 'High',
    durationMin: 5,
    description: 'Progressive escalation from initial suspicious behavior to law enforcement resolution',
    color: '#dc2626'
  },
  {
    key: 'scenario_fire',
    title: 'Fire Emergency',
    icon: '🔥',
    category: 'Fire & Life Safety',
    difficulty: 'Medium',
    durationMin: 4,
    description: 'Fire detection through evacuation and emergency response',
    color: '#ea580c'
  },
  {
    key: 'scenario_flood',
    title: 'Flood',
    icon: '💧',
    category: 'Environmental',
    difficulty: 'Medium',
    durationMin: 5,
    description: 'Water intrusion escalation with electrical hazards and system protection',
    color: '#2563eb'
  },
  {
    key: 'scenario_cyber_attack',
    title: 'Cyber Attack',
    icon: '💻',
    category: 'Technology',
    difficulty: 'High',
    durationMin: 5,
    description: 'Phishing attack through ransomware to recovery',
    color: '#7c3aed'
  },
  {
    key: 'scenario_power_outage',
    title: 'Power Outage',
    icon: '⚡',
    category: 'Infrastructure',
    difficulty: 'Low',
    durationMin: 4,
    description: 'Facility-wide power loss with generator backup and restoration',
    color: '#d97706'
  },
  {
    key: 'scenario_severe_weather',
    title: 'Severe Weather',
    icon: '⛈️',
    category: 'Environmental',
    difficulty: 'Medium',
    durationMin: 5,
    description: 'Storm warning through impact and damage assessment',
    color: '#0891b2'
  },
  {
    key: 'scenario_medical_emergency',
    title: 'Medical Emergency',
    icon: '🏥',
    category: 'Medical',
    difficulty: 'High',
    durationMin: 4,
    description: 'Cardiac event response from collapse through EMS transport',
    color: '#059669'
  },
  {
    key: 'scenario_hazardous_material_spill',
    title: 'Hazardous Material Spill',
    icon: '☣️',
    category: 'Hazmat',
    difficulty: 'High',
    durationMin: 5,
    description: 'Chemical spill containment and decontamination',
    color: '#65a30d'
  }
];

const DIFFICULTY_COLORS = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#dc2626'
};

const ScenarioSelector = ({ value, onChange }) => {
  return (
    <div className="scenario-selector">
      <label className="scenario-selector-label">Select Scenario:</label>
      <div className="scenario-card-grid">
        {SCENARIOS.map(scenario => (
          <button
            key={scenario.key}
            type="button"
            className={`scenario-card ${value === scenario.key ? 'scenario-card-selected' : ''}`}
            style={{ '--scenario-color': scenario.color }}
            onClick={() => onChange(scenario.key)}
            aria-pressed={value === scenario.key}
          >
            <span className="scenario-card-icon">{scenario.icon}</span>
            <span className="scenario-card-title">{scenario.title}</span>
            <span className="scenario-card-category">{scenario.category}</span>
            <div className="scenario-card-meta">
              <span
                className="scenario-card-difficulty"
                style={{ background: DIFFICULTY_COLORS[scenario.difficulty] }}
              >
                {scenario.difficulty}
              </span>
              <span className="scenario-card-duration">~{scenario.durationMin} min</span>
            </div>
            <p className="scenario-card-desc">{scenario.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScenarioSelector;
export { SCENARIOS };
