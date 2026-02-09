import React from 'react';

const SCENARIOS = [
  {
    key: 'scenario_active_threat',
    title: 'Active Threat',
    description: 'Progressive escalation from initial suspicious behavior to law enforcement resolution'
  },
  {
    key: 'scenario_fire',
    title: 'Fire Emergency',
    description: 'Fire detection through evacuation and emergency response'
  },
  {
    key: 'scenario_flood',
    title: 'Flood',
    description: 'Water intrusion escalation with electrical hazards and system protection'
  },
  {
    key: 'scenario_cyber_attack',
    title: 'Cyber Attack',
    description: 'Phishing attack through ransomware to recovery'
  },
  {
    key: 'scenario_power_outage',
    title: 'Power Outage',
    description: 'Facility-wide power loss with generator backup and restoration'
  },
  {
    key: 'scenario_severe_weather',
    title: 'Severe Weather',
    description: 'Storm warning through impact and damage assessment'
  },
  {
    key: 'scenario_medical_emergency',
    title: 'Medical Emergency',
    description: 'Cardiac event response from collapse through EMS transport'
  },
  {
    key: 'scenario_hazardous_material_spill',
    title: 'Hazardous Material Spill',
    description: 'Chemical spill containment and decontamination'
  }
];

const ScenarioSelector = ({ value, onChange }) => {
  return (
    <div className="scenario-selector">
      <label htmlFor="scenario-select">Select Scenario:</label>
      <select 
        id="scenario-select"
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="scenario-dropdown"
      >
        <option value="">-- Choose a scenario --</option>
        {SCENARIOS.map(scenario => (
          <option key={scenario.key} value={scenario.key}>
            {scenario.title}
          </option>
        ))}
      </select>
      {value && (
        <p className="scenario-description">
          {SCENARIOS.find(s => s.key === value)?.description}
        </p>
      )}
    </div>
  );
};

export default ScenarioSelector;
export { SCENARIOS };
