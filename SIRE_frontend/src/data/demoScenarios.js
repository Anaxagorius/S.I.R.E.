/**
 * Author: Leon Wasiliew
 * Last Update: 2026-04-08
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
import scenarioMassCasualty from "./scenarios/scenario_mass_casualty.json";
import scenarioInfrastructureAttack from "./scenarios/scenario_infrastructure_attack.json";

// Social engineering / phishing
import scenarioPhishingEmail from "./scenarios/scenario_phishing_email.json";
import scenarioSpearPhishing from "./scenarios/scenario_spear_phishing.json";
import scenarioWhaling from "./scenarios/scenario_whaling.json";
import scenarioSmishing from "./scenarios/scenario_smishing.json";
import scenarioVishing from "./scenarios/scenario_vishing.json";
import scenarioMfaFatigue from "./scenarios/scenario_mfa_fatigue.json";
import scenarioOauthPhishing from "./scenarios/scenario_oauth_phishing.json";

// Fraud / financial
import scenarioBec from "./scenarios/scenario_bec.json";
import scenarioFakeVendorInvoice from "./scenarios/scenario_fake_vendor_invoice.json";
import scenarioDeepfakeScam from "./scenarios/scenario_deepfake_scam.json";

// Credential attacks
import scenarioBruteForceLogin from "./scenarios/scenario_brute_force_login.json";
import scenarioCredentialStuffing from "./scenarios/scenario_credential_stuffing.json";
import scenarioPasswordSpraying from "./scenarios/scenario_password_spraying.json";
import scenarioInsiderCredentialMisuse from "./scenarios/scenario_insider_credential_misuse.json";

// Access & token attacks
import scenarioSessionHijacking from "./scenarios/scenario_session_hijacking.json";
import scenarioStolenApiKeys from "./scenarios/scenario_stolen_api_keys.json";
import scenarioTokenTheft from "./scenarios/scenario_token_theft.json";

// Privilege escalation & Active Directory
import scenarioPrivilegeEscalationLocal from "./scenarios/scenario_privilege_escalation_local.json";
import scenarioPrivilegeEscalationDomain from "./scenarios/scenario_privilege_escalation_domain.json";
import scenarioCompromisedActiveDirectory from "./scenarios/scenario_compromised_active_directory.json";

// Malware
import scenarioTrojanInfection from "./scenarios/scenario_trojan_infection.json";
import scenarioRemoteAccessTrojan from "./scenarios/scenario_remote_access_trojan.json";
import scenarioBotnetInfection from "./scenarios/scenario_botnet_infection.json";
import scenarioWormOutbreak from "./scenarios/scenario_worm_outbreak.json";
import scenarioFilelessMalware from "./scenarios/scenario_fileless_malware.json";
import scenarioCryptominingMalware from "./scenarios/scenario_cryptomining_malware.json";
import scenarioWiperMalware from "./scenarios/scenario_wiper_malware.json";
import scenarioRansomwareEncrypt from "./scenarios/scenario_ransomware_encrypt.json";
import scenarioRansomwareExtort from "./scenarios/scenario_ransomware_extort.json";

/** All demo scenarios with display metadata and bundled scenario data. */
const DEMO_SCENARIOS = [
    // ── Physical / Environmental ─────────────────────────────────────────────
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
        id: "scenario_severe_weather",
        icon: "⛈️",
        name: "Severe Weather",
        description: "Severe weather warnings threaten facility operations.",
        data: scenarioWeather,
    },
    {
        id: "scenario_power_outage",
        icon: "🔌",
        name: "Power Outage",
        description: "A facility-wide power outage interrupts critical systems.",
        data: scenarioPower,
    },

    // ── Medical ──────────────────────────────────────────────────────────────
    {
        id: "scenario_medical_emergency",
        icon: "🚑",
        name: "Medical Emergency",
        description: "A medical emergency occurs during a busy shift.",
        data: scenarioMedical,
    },
    {
        id: "scenario_mass_casualty",
        icon: "🏥",
        name: "Mass Casualty Incident",
        description: "A multi-vehicle collision produces 20+ casualties requiring rapid triage and resource coordination.",
        data: scenarioMassCasualty,
    },

    // ── HAZMAT ───────────────────────────────────────────────────────────────
    {
        id: "scenario_hazardous_material_spill",
        icon: "☣️",
        name: "Hazardous Material Spill",
        description: "A corrosive chemical spill in a lab corridor escalates over time.",
        data: scenarioHazmat,
    },

    // ── Threat ───────────────────────────────────────────────────────────────
    {
        id: "scenario_active_threat",
        icon: "🚨",
        name: "Active Threat",
        description: "An active threat reported near main entrance escalates to facility-wide lockdown.",
        data: scenarioThreat,
    },

    // ── Cyber: Phishing & Social Engineering ─────────────────────────────────
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

    // ── Cyber: Fraud & Financial ─────────────────────────────────────────────
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

    // ── Cyber: Credential Attacks ─────────────────────────────────────────────
    {
        id: "scenario_brute_force_login",
        icon: "🔓",
        name: "Brute Force Login",
        description: "An attacker launches a high-volume brute-force attack against the organisation's admin portal, attempting thousands of password combinations.",
        data: scenarioBruteForceLogin,
    },
    {
        id: "scenario_credential_stuffing",
        icon: "🗂️",
        name: "Credential Stuffing",
        description: "Customer accounts are being accessed by an attacker using credentials leaked in a third-party data breach.",
        data: scenarioCredentialStuffing,
    },
    {
        id: "scenario_password_spraying",
        icon: "💧",
        name: "Password Spraying",
        description: "An attacker conducts a password spraying campaign against corporate Office 365 accounts, avoiding lockouts by trying one common password per account.",
        data: scenarioPasswordSpraying,
    },
    {
        id: "scenario_insider_credential_misuse",
        icon: "🕵️",
        name: "Insider Credential Misuse",
        description: "An employee who has submitted their resignation is detected accessing and exfiltrating sensitive HR and financial records.",
        data: scenarioInsiderCredentialMisuse,
    },

    // ── Cyber: Access & Token Attacks ────────────────────────────────────────
    {
        id: "scenario_session_hijacking",
        icon: "🕸️",
        name: "Session Hijacking",
        description: "An attacker on an unsecured public WiFi network captures an employee's session cookie transmitted over an unencrypted connection.",
        data: scenarioSessionHijacking,
    },
    {
        id: "scenario_stolen_api_keys",
        icon: "🗝️",
        name: "Stolen API Keys",
        description: "A developer accidentally commits an AWS access key to a public GitHub repository and it is exploited within minutes.",
        data: scenarioStolenApiKeys,
    },
    {
        id: "scenario_token_theft",
        icon: "🪙",
        name: "Token Theft",
        description: "A malicious OAuth application tricks an employee into granting it broad access to their Microsoft 365 account.",
        data: scenarioTokenTheft,
    },

    // ── Cyber: Privilege Escalation & Active Directory ────────────────────────
    {
        id: "scenario_privilege_escalation_local",
        icon: "⬆️",
        name: "Local Privilege Escalation",
        description: "An endpoint detection system flags a standard user account exploiting an unpatched kernel vulnerability to gain SYSTEM-level access.",
        data: scenarioPrivilegeEscalationLocal,
    },
    {
        id: "scenario_privilege_escalation_domain",
        icon: "👑",
        name: "Domain Privilege Escalation",
        description: "An attacker with a low-privilege domain account performs a Kerberoasting attack to extract service ticket hashes and escalate privileges.",
        data: scenarioPrivilegeEscalationDomain,
    },
    {
        id: "scenario_compromised_active_directory",
        icon: "🏢",
        name: "Compromised Active Directory",
        description: "A threat actor compromises an Active Directory administrator account via phishing and uses it to create rogue admin accounts.",
        data: scenarioCompromisedActiveDirectory,
    },

    // ── Cyber: Malware ───────────────────────────────────────────────────────
    {
        id: "scenario_trojan_infection",
        icon: "🦠",
        name: "Trojan Infection",
        description: "A Trojan horse disguised as a legitimate software installer establishes persistence, steals credentials, and opens a backdoor.",
        data: scenarioTrojanInfection,
    },
    {
        id: "scenario_remote_access_trojan",
        icon: "🐴",
        name: "Remote Access Trojan (RAT)",
        description: "A Remote Access Trojan is discovered after a prolonged dwell period, giving an attacker silent control over multiple corporate endpoints.",
        data: scenarioRemoteAccessTrojan,
    },
    {
        id: "scenario_botnet_infection",
        icon: "🤖",
        name: "Botnet Infection",
        description: "Corporate endpoints are enrolled in a botnet and used for DDoS attacks and spam campaigns, implicating the organisation.",
        data: scenarioBotnetInfection,
    },
    {
        id: "scenario_worm_outbreak",
        icon: "🪱",
        name: "Worm Outbreak",
        description: "A self-propagating network worm exploits an unpatched SMB vulnerability, spreading rapidly across the corporate network.",
        data: scenarioWormOutbreak,
    },
    {
        id: "scenario_fileless_malware",
        icon: "👻",
        name: "Fileless Malware",
        description: "A fileless malware attack uses living-off-the-land techniques — abusing PowerShell and WMI — leaving minimal disk artefacts.",
        data: scenarioFilelessMalware,
    },
    {
        id: "scenario_cryptomining_malware",
        icon: "⛏️",
        name: "Cryptomining Malware",
        description: "Cryptomining malware is discovered after users report severe performance degradation, consuming corporate compute resources.",
        data: scenarioCryptominingMalware,
    },
    {
        id: "scenario_wiper_malware",
        icon: "🗑️",
        name: "Wiper Malware",
        description: "A nation-state-linked wiper malware targets critical operational systems, permanently destroying data with no recovery option.",
        data: scenarioWiperMalware,
    },
    {
        id: "scenario_ransomware_encrypt",
        icon: "🔒",
        name: "Ransomware — Encryption",
        description: "Ransomware propagates across the corporate network, encrypting files on workstations and shared drives.",
        data: scenarioRansomwareEncrypt,
    },
    {
        id: "scenario_ransomware_extort",
        icon: "💰",
        name: "Ransomware — Double Extortion",
        description: "A double-extortion ransomware group exfiltrates sensitive data before encrypting systems and threatens public exposure.",
        data: scenarioRansomwareExtort,
    },

    // ── Cyber: Infrastructure ────────────────────────────────────────────────
    {
        id: "scenario_cyber_attack",
        icon: "💻",
        name: "Cyber Attack",
        description: "A coordinated phishing and ransomware attack targets staff systems.",
        data: scenarioCyber,
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
