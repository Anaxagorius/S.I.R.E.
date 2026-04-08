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

// BCDR: Natural Disasters
import scenarioEarthquake from "./scenarios/scenario_earthquake.json";
import scenarioHurricane from "./scenarios/scenario_hurricane.json";
import scenarioTornado from "./scenarios/scenario_tornado.json";
import scenarioWildfire from "./scenarios/scenario_wildfire.json";
import scenarioSevereWinterStorm from "./scenarios/scenario_severe_winter_storm.json";
import scenarioHeatwave from "./scenarios/scenario_heatwave.json";
import scenarioLightningStrike from "./scenarios/scenario_lightning_strike.json";

// BCDR: Environmental & Facility Incidents
import scenarioDatacenterFire from "./scenarios/scenario_datacenter_fire.json";
import scenarioFireSuppressionMisfire from "./scenarios/scenario_fire_suppression_misfire.json";
import scenarioWaterDamage from "./scenarios/scenario_water_damage.json";
import scenarioHvacFailure from "./scenarios/scenario_hvac_failure.json";
import scenarioStructuralDamage from "./scenarios/scenario_structural_damage.json";
import scenarioPhysicalAccessCompromise from "./scenarios/scenario_physical_access_compromise.json";
import scenarioBuildingEvacuation from "./scenarios/scenario_building_evacuation.json";

// BCDR: Power & Utility Failures
import scenarioGeneratorFailure from "./scenarios/scenario_generator_failure.json";
import scenarioFuelShortage from "./scenarios/scenario_fuel_shortage.json";
import scenarioUpsFailure from "./scenarios/scenario_ups_failure.json";
import scenarioGridInstability from "./scenarios/scenario_grid_instability.json";

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

// Network attacks
import scenarioDdos from "./scenarios/scenario_ddos.json";
import scenarioDnsPoisoning from "./scenarios/scenario_dns_poisoning.json";
import scenarioMitmAttack from "./scenarios/scenario_mitm_attack.json";
import scenarioArpSpoofing from "./scenarios/scenario_arp_spoofing.json";
import scenarioNetworkEavesdropping from "./scenarios/scenario_network_eavesdropping.json";
import scenarioRouteHijacking from "./scenarios/scenario_route_hijacking.json";
import scenarioLateralMovement from "./scenarios/scenario_lateral_movement.json";
import scenarioNetworkSegmentationFailure from "./scenarios/scenario_network_segmentation_failure.json";

// Web & application attacks
import scenarioSqlInjection from "./scenarios/scenario_sql_injection.json";
import scenarioXss from "./scenarios/scenario_xss.json";
import scenarioCsrf from "./scenarios/scenario_csrf.json";
import scenarioCommandInjection from "./scenarios/scenario_command_injection.json";
import scenarioBrokenAuthentication from "./scenarios/scenario_broken_authentication.json";
import scenarioInsecureDeserialization from "./scenarios/scenario_insecure_deserialization.json";
import scenarioZeroDayExploit from "./scenarios/scenario_zero_day_exploit.json";
import scenarioApiAbuse from "./scenarios/scenario_api_abuse.json";
import scenarioSupplyChainCompromise from "./scenarios/scenario_supply_chain_compromise.json";
import scenarioDependencyPoisoning from "./scenarios/scenario_dependency_poisoning.json";

// Cloud & SaaS incidents
import scenarioCloudAccountTakeover from "./scenarios/scenario_cloud_account_takeover.json";
import scenarioMisconfiguredStorage from "./scenarios/scenario_misconfigured_storage.json";
import scenarioMisconfiguredIam from "./scenarios/scenario_misconfigured_iam.json";
import scenarioCompromisedCicd from "./scenarios/scenario_compromised_cicd.json";
import scenarioMaliciousCloudAdmin from "./scenarios/scenario_malicious_cloud_admin.json";
import scenarioShadowIt from "./scenarios/scenario_shadow_it.json";
import scenarioSaasDataLeakage from "./scenarios/scenario_saas_data_leakage.json";
import scenarioCloudServiceOutage from "./scenarios/scenario_cloud_service_outage.json";

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

    // ── BCDR: Natural Disasters ───────────────────────────────────────────────
    {
        id: "scenario_earthquake",
        icon: "🌍",
        name: "Earthquake",
        description: "A significant earthquake strikes during business hours, threatening staff safety and facility integrity.",
        data: scenarioEarthquake,
    },
    {
        id: "scenario_hurricane",
        icon: "🌀",
        name: "Hurricane",
        description: "A Category 2 hurricane is forecast to make landfall near the facility within 48 hours.",
        data: scenarioHurricane,
    },
    {
        id: "scenario_tornado",
        icon: "🌪️",
        name: "Tornado",
        description: "A tornado warning is issued with a confirmed funnel cloud approaching the facility.",
        data: scenarioTornado,
    },
    {
        id: "scenario_wildfire",
        icon: "🔥",
        name: "Wildfire",
        description: "A rapidly spreading wildfire threatens the facility as evacuation orders are issued for surrounding areas.",
        data: scenarioWildfire,
    },
    {
        id: "scenario_severe_winter_storm",
        icon: "❄️",
        name: "Severe Winter Storm",
        description: "A severe winter storm dumps heavy snow and ice, isolating the facility and threatening operations.",
        data: scenarioSevereWinterStorm,
    },
    {
        id: "scenario_heatwave",
        icon: "🌡️",
        name: "Heatwave",
        description: "An extreme heatwave creates dangerous working conditions and threatens critical IT infrastructure.",
        data: scenarioHeatwave,
    },
    {
        id: "scenario_lightning_strike",
        icon: "⚡",
        name: "Lightning Strike",
        description: "A direct lightning strike causes a power surge that damages critical infrastructure and triggers a fire alarm.",
        data: scenarioLightningStrike,
    },

    // ── BCDR: Environmental & Facility Incidents ──────────────────────────────
    {
        id: "scenario_datacenter_fire",
        icon: "🔥",
        name: "Datacenter Fire",
        description: "Smoke detectors activate in the datacenter after a server-rack electrical fault ignites.",
        data: scenarioDatacenterFire,
    },
    {
        id: "scenario_fire_suppression_misfire",
        icon: "💨",
        name: "Fire Suppression Misfire",
        description: "The datacenter's gaseous fire suppression system discharges accidentally with no fire present.",
        data: scenarioFireSuppressionMisfire,
    },
    {
        id: "scenario_water_damage",
        icon: "💧",
        name: "Water Damage",
        description: "A burst pipe in the ceiling causes water damage to office and server room areas.",
        data: scenarioWaterDamage,
    },
    {
        id: "scenario_hvac_failure",
        icon: "🌬️",
        name: "HVAC Failure",
        description: "The facility's central HVAC system fails during peak summer, threatening both staff welfare and IT equipment.",
        data: scenarioHvacFailure,
    },
    {
        id: "scenario_structural_damage",
        icon: "🏗️",
        name: "Structural Damage",
        description: "An unexpected structural crack is discovered in a load-bearing wall following a minor tremor.",
        data: scenarioStructuralDamage,
    },
    {
        id: "scenario_physical_access_compromise",
        icon: "🚪",
        name: "Physical Access Compromise",
        description: "An unknown individual is discovered in a restricted server room after bypassing access controls.",
        data: scenarioPhysicalAccessCompromise,
    },
    {
        id: "scenario_building_evacuation",
        icon: "🚨",
        name: "Building Evacuation",
        description: "A bomb threat triggers a full building evacuation requiring systematic accountability of all personnel.",
        data: scenarioBuildingEvacuation,
    },

    // ── BCDR: Power & Utility Failures ───────────────────────────────────────
    {
        id: "scenario_generator_failure",
        icon: "⚙️",
        name: "Generator Failure",
        description: "The backup generator fails to start during a mains power outage, leaving critical systems without power.",
        data: scenarioGeneratorFailure,
    },
    {
        id: "scenario_fuel_shortage",
        icon: "⛽",
        name: "Fuel Shortage",
        description: "The backup generator is running during an extended outage when a fuel delivery failure leaves tanks critically low.",
        data: scenarioFuelShortage,
    },
    {
        id: "scenario_ups_failure",
        icon: "🔋",
        name: "UPS Failure",
        description: "Multiple UPS units fail simultaneously during a planned maintenance window, leaving critical systems unprotected.",
        data: scenarioUpsFailure,
    },
    {
        id: "scenario_grid_instability",
        icon: "🔌",
        name: "Grid Instability",
        description: "Repeated grid brownouts and voltage sags threaten critical systems during a regional power supply crisis.",
        data: scenarioGridInstability,
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

    // ── Network Attacks ──────────────────────────────────────────────────────
    {
        id: "scenario_ddos",
        icon: "🌐",
        name: "Distributed Denial of Service (DDoS)",
        description: "A volumetric DDoS attack floods the corporate web application with 40 Gbps of traffic, taking it offline.",
        data: scenarioDdos,
    },
    {
        id: "scenario_dns_poisoning",
        icon: "☠️",
        name: "DNS Poisoning",
        description: "An attacker poisons the DNS cache of the corporate resolver, redirecting staff browser traffic to a credential-harvesting clone of the corporate portal.",
        data: scenarioDnsPoisoning,
    },
    {
        id: "scenario_mitm_attack",
        icon: "🔀",
        name: "Man-in-the-Middle (MITM)",
        description: "An attacker intercepts unencrypted network traffic between a remote employee's laptop and a corporate file server, silently reading and altering data in transit.",
        data: scenarioMitmAttack,
    },
    {
        id: "scenario_arp_spoofing",
        icon: "📡",
        name: "ARP Spoofing",
        description: "An attacker on the internal network sends forged ARP replies to associate their MAC address with the default gateway, intercepting all local traffic.",
        data: scenarioArpSpoofing,
    },
    {
        id: "scenario_network_eavesdropping",
        icon: "👂",
        name: "Network Eavesdropping",
        description: "A passive network sniffer is discovered on a core switch, silently capturing all unencrypted traffic including plaintext credentials.",
        data: scenarioNetworkEavesdropping,
    },
    {
        id: "scenario_route_hijacking",
        icon: "🗺️",
        name: "BGP Route Hijacking",
        description: "A rogue BGP advertisement hijacks the organisation's IP prefix, diverting internet-bound traffic through an attacker-controlled autonomous system.",
        data: scenarioRouteHijacking,
    },
    {
        id: "scenario_lateral_movement",
        icon: "↔️",
        name: "Lateral Movement",
        description: "After compromising one workstation via phishing, an attacker uses pass-the-hash and SMB exploitation to spread laterally across the corporate network.",
        data: scenarioLateralMovement,
    },
    {
        id: "scenario_network_segmentation_failure",
        icon: "🚧",
        name: "Network Segmentation Failure",
        description: "A misconfigured switch VLAN allows a compromised guest Wi-Fi device to reach the internal production network, bypassing all perimeter controls.",
        data: scenarioNetworkSegmentationFailure,
    },

    // ── Web & Application Attacks ────────────────────────────────────────────
    {
        id: "scenario_sql_injection",
        icon: "🗄️",
        name: "SQL Injection",
        description: "An attacker exploits an unsanitised login form to inject SQL commands, dumping the entire user database including hashed passwords.",
        data: scenarioSqlInjection,
    },
    {
        id: "scenario_xss",
        icon: "📜",
        name: "Cross-Site Scripting (XSS)",
        description: "A stored XSS payload injected into a public comment field executes in admin browsers, stealing session cookies and hijacking administrator accounts.",
        data: scenarioXss,
    },
    {
        id: "scenario_csrf",
        icon: "🪤",
        name: "Cross-Site Request Forgery (CSRF)",
        description: "A forged HTTP request tricks an authenticated admin into unknowingly changing account settings on the corporate portal while visiting a malicious page.",
        data: scenarioCsrf,
    },
    {
        id: "scenario_command_injection",
        icon: "💉",
        name: "Command Injection",
        description: "An attacker exploits an unsanitised diagnostic endpoint to inject OS commands, gaining remote code execution on the web server.",
        data: scenarioCommandInjection,
    },
    {
        id: "scenario_broken_authentication",
        icon: "🔓",
        name: "Broken Authentication",
        description: "Weak session management and predictable session tokens allow an attacker to enumerate valid session IDs and take over active user accounts.",
        data: scenarioBrokenAuthentication,
    },
    {
        id: "scenario_insecure_deserialization",
        icon: "📦",
        name: "Insecure Deserialization",
        description: "An attacker crafts a malicious serialised Java object submitted to an API endpoint, triggering remote code execution on the application server.",
        data: scenarioInsecureDeserialization,
    },
    {
        id: "scenario_zero_day_exploit",
        icon: "🕳️",
        name: "Zero-Day Exploitation",
        description: "An unknown vulnerability in a widely-used web framework is actively exploited before a patch is available, granting attackers unauthenticated access to the application.",
        data: scenarioZeroDayExploit,
    },
    {
        id: "scenario_api_abuse",
        icon: "🔌",
        name: "API Abuse",
        description: "An attacker discovers an undocumented API endpoint with no authentication, using it to enumerate user accounts and extract sensitive profile data at scale.",
        data: scenarioApiAbuse,
    },
    {
        id: "scenario_supply_chain_compromise",
        icon: "🏭",
        name: "Supply-Chain Compromise",
        description: "A trusted third-party software vendor is compromised, and a malicious update is pushed to thousands of organisations including yours, installing a backdoor.",
        data: scenarioSupplyChainCompromise,
    },
    {
        id: "scenario_dependency_poisoning",
        icon: "☠️",
        name: "Dependency Poisoning",
        description: "A threat actor publishes a typosquatted npm package mimicking a popular internal library; developers inadvertently install it, introducing a credential-stealing payload.",
        data: scenarioDependencyPoisoning,
    },

    // ── Cloud & SaaS Incidents ───────────────────────────────────────────────
    {
        id: "scenario_cloud_account_takeover",
        icon: "☁️",
        name: "Cloud Account Takeover",
        description: "A phishing attack compromises a developer's AWS management console credentials, giving the attacker full control of cloud infrastructure including production databases.",
        data: scenarioCloudAccountTakeover,
    },
    {
        id: "scenario_misconfigured_storage",
        icon: "🪣",
        name: "Misconfigured Storage Bucket",
        description: "An S3 bucket containing sensitive customer PII is discovered to be publicly accessible, with evidence it has been indexed by external search engines.",
        data: scenarioMisconfiguredStorage,
    },
    {
        id: "scenario_misconfigured_iam",
        icon: "🔑",
        name: "Misconfigured IAM Roles",
        description: "An overly permissive IAM role attached to a Lambda function is exploited by an attacker to pivot across cloud services and exfiltrate data from production databases.",
        data: scenarioMisconfiguredIam,
    },
    {
        id: "scenario_compromised_cicd",
        icon: "⚙️",
        name: "Compromised CI/CD Pipeline",
        description: "An attacker gains write access to a GitHub Actions workflow, injecting malicious steps that exfiltrate repository secrets and deploy backdoored builds to production.",
        data: scenarioCompromisedCicd,
    },
    {
        id: "scenario_malicious_cloud_admin",
        icon: "🕵️",
        name: "Malicious Cloud Admin",
        description: "A rogue cloud administrator with elevated privileges creates persistent backdoor IAM users, exfiltrates data to external storage, and disables CloudTrail logging to cover their tracks.",
        data: scenarioMaliciousCloudAdmin,
    },
    {
        id: "scenario_shadow_it",
        icon: "👤",
        name: "Shadow IT Exposure",
        description: "Security discovers that multiple teams have been using unsanctioned SaaS applications to store sensitive corporate data, with no encryption, DLP controls, or visibility.",
        data: scenarioShadowIt,
    },
    {
        id: "scenario_saas_data_leakage",
        icon: "💧",
        name: "SaaS Data Leakage",
        description: "Sensitive corporate files shared via a SaaS collaboration platform are found to be publicly accessible after an overly permissive sharing setting was applied by an employee.",
        data: scenarioSaasDataLeakage,
    },
    {
        id: "scenario_cloud_service_outage",
        icon: "🌩️",
        name: "Cloud Service Outage",
        description: "A major cloud provider region goes offline unexpectedly, taking down all production services that depend on a single-region deployment with no failover.",
        data: scenarioCloudServiceOutage,
    },
];

export default DEMO_SCENARIOS;
