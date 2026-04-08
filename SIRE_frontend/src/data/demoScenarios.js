/**
 * Author: Leon Wasiliew
 * Last Update: 2026-04-01
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
import scenarioPhishingEmail from "./scenarios/scenario_phishing_email.json";
import scenarioSpearPhishing from "./scenarios/scenario_spear_phishing.json";
import scenarioWhaling from "./scenarios/scenario_whaling.json";
import scenarioSmishing from "./scenarios/scenario_smishing.json";
import scenarioVishing from "./scenarios/scenario_vishing.json";
import scenarioMfaFatigue from "./scenarios/scenario_mfa_fatigue.json";
import scenarioOauthPhishing from "./scenarios/scenario_oauth_phishing.json";
import scenarioBec from "./scenarios/scenario_bec.json";
import scenarioFakeVendorInvoice from "./scenarios/scenario_fake_vendor_invoice.json";
import scenarioDeepfakeScam from "./scenarios/scenario_deepfake_scam.json";
import scenarioMassCasualty from "./scenarios/scenario_mass_casualty.json";
import scenarioInfrastructureAttack from "./scenarios/scenario_infrastructure_attack.json";

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
    {
        id: "scenario_phishing_email",
        icon: "📧",
        name: "Email Phishing",
        description: "A mass phishing email campaign targets your organisation, attempting to harvest credentials.",
        data: scenarioPhishingEmail,
    },
    {
        id: "scenario_spear_phishing",
        icon: "🎯",
        name: "Spear Phishing",
        description: "A personalised spear-phishing attack targets a specific employee using harvested social media data.",
        data: scenarioSpearPhishing,
    },
    {
        id: "scenario_whaling",
        icon: "🐳",
        name: "Whaling",
        description: "A highly targeted whaling attack impersonates a board member to pressure the CFO into authorising a fraudulent wire transfer.",
        data: scenarioWhaling,
    },
    {
        id: "scenario_smishing",
        icon: "📱",
        name: "Smishing",
        description: "Staff receive fraudulent SMS messages impersonating IT, directing them to a credential-harvesting site.",
        data: scenarioSmishing,
    },
    {
        id: "scenario_vishing",
        icon: "📞",
        name: "Vishing",
        description: "An attacker impersonates IT support over the phone to trick an employee into revealing credentials.",
        data: scenarioVishing,
    },
    {
        id: "scenario_mfa_fatigue",
        icon: "🔐",
        name: "MFA Fatigue",
        description: "An attacker floods a user's phone with MFA push notifications hoping they will approve one out of frustration.",
        data: scenarioMfaFatigue,
    },
    {
        id: "scenario_oauth_phishing",
        icon: "🔑",
        name: "OAuth Consent Phishing",
        description: "An attacker tricks employees into granting a malicious third-party app access to corporate Microsoft 365 data.",
        data: scenarioOauthPhishing,
    },
    {
        id: "scenario_bec",
        icon: "💼",
        name: "Business Email Compromise",
        description: "An attacker compromises a senior manager's email and redirects a large customer payment to a fraudulent account.",
        data: scenarioBec,
    },
    {
        id: "scenario_fake_vendor_invoice",
        icon: "🧾",
        name: "Fake Vendor Invoice",
        description: "Fraudsters impersonate a trusted supplier and submit convincing fake invoices to redirect payments.",
        data: scenarioFakeVendorInvoice,
    },
    {
        id: "scenario_deepfake_scam",
        icon: "🤖",
        name: "Deepfake Scam",
        description: "AI-generated deepfake audio and video impersonates an executive to authorise a large fraudulent transfer.",
        data: scenarioDeepfakeScam,
    },
    {
        id: "scenario_mass_casualty",
        icon: "🏥",
        name: "Mass Casualty Incident",
        description: "A multi-vehicle collision produces 20+ casualties requiring rapid triage and resource coordination.",
        data: scenarioMassCasualty,
    },
    {
        id: "scenario_infrastructure_attack",
        icon: "⚡",
        name: "Infrastructure Cyber Attack",
        description: "A nation-state actor targets a water treatment facility's SCADA system to contaminate supply.",
        data: scenarioInfrastructureAttack,
    },
];

export default DEMO_SCENARIOS;
