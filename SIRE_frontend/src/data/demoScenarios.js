/**
 * Author: Leon Wasiliew
 * Last Update: 2026-03-26
 * Description: Bundled scenario data for frontend-only demo mode.
 * Each entry includes display metadata plus the full scenario definition
 * (root node and decision tree) so no backend connection is required.
 */

import scenarioFire from "./scenarios/scenario_fire.json";
import scenarioFlood from "./scenarios/scenario_flood.json";
import scenarioMedical from "./scenarios/scenario_medical_emergency.json";
import scenarioWeather from "./scenarios/scenario_severe_weather.json";
import scenarioCyber from "./scenarios/scenario_cyber_attack.json";
import scenarioHazmat from "./scenarios/scenario_hazardous_material_spill.json";
import scenarioThreat from "./scenarios/scenario_active_threat.json";
import scenarioPower from "./scenarios/scenario_power_outage.json";

/** All demo scenarios with display metadata and bundled scenario data. */
const DEMO_SCENARIOS = [
    {
        id: "scenario_fire",
        icon: "🔥",
        name: "Fire",
        description: "A fire starts in a storage area and spreads toward occupied floors.",
        data: scenarioFire,
    },
    {
        id: "scenario_flood",
        icon: "🌊",
        name: "Flood",
        description: "Burst water main begins flooding lower levels.",
        data: scenarioFlood,
    },
    {
        id: "scenario_medical_emergency",
        icon: "🚑",
        name: "Medical Emergency",
        description: "A medical emergency occurs during a busy shift.",
        data: scenarioMedical,
    },
    {
        id: "scenario_severe_weather",
        icon: "⛈️",
        name: "Severe Weather",
        description: "Severe weather warnings threaten facility operations.",
        data: scenarioWeather,
    },
    {
        id: "scenario_cyber_attack",
        icon: "💻",
        name: "Cyber Attack",
        description: "A coordinated phishing and ransomware attack targets staff systems.",
        data: scenarioCyber,
    },
    {
        id: "scenario_hazardous_material_spill",
        icon: "☣️",
        name: "Hazardous Material Spill",
        description: "A corrosive chemical spill in a lab corridor escalates over time.",
        data: scenarioHazmat,
    },
    {
        id: "scenario_active_threat",
        icon: "🚨",
        name: "Active Threat",
        description: "An active threat reported near main entrance escalates to facility-wide lockdown.",
        data: scenarioThreat,
    },
    {
        id: "scenario_power_outage",
        icon: "🔌",
        name: "Power Outage",
        description: "A facility-wide power outage interrupts critical systems.",
        data: scenarioPower,
    },
];

export default DEMO_SCENARIOS;
