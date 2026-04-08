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
// Insider threat — malicious
import scenarioIpTheft from "./scenarios/scenario_ip_theft.json";
import scenarioInsiderSabotage from "./scenarios/scenario_insider_sabotage.json";
import scenarioInsiderPrivilegeAbuse from "./scenarios/scenario_insider_privilege_abuse.json";
import scenarioInsiderFraud from "./scenarios/scenario_insider_fraud.json";
import scenarioSystemTampering from "./scenarios/scenario_system_tampering.json";
import scenarioInsiderBackdoor from "./scenarios/scenario_insider_backdoor.json";

// Insider threat — accidental / negligent
import scenarioDataSentWrongRecipient from "./scenarios/scenario_data_sent_wrong_recipient.json";
import scenarioPoorPasswordPractices from "./scenarios/scenario_poor_password_practices.json";
import scenarioDisabledSecurityControls from "./scenarios/scenario_disabled_security_controls.json";
import scenarioLostDevice from "./scenarios/scenario_lost_device.json";
import scenarioUnencryptedDataExposure from "./scenarios/scenario_unencrypted_data_exposure.json";

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

// Industrial & OT/SCADA incidents
import scenarioPlcMalfunction from "./scenarios/scenario_plc_malfunction.json";
import scenarioIcsMalware from "./scenarios/scenario_ics_malware.json";
import scenarioSensorSpoofing from "./scenarios/scenario_sensor_spoofing.json";
import scenarioSafetySystemFailure from "./scenarios/scenario_safety_system_failure.json";
import scenarioPhysicalProcessManipulation from "./scenarios/scenario_physical_process_manipulation.json";
import scenarioOtItCrossoverBreach from "./scenarios/scenario_ot_it_crossover_breach.json";
import scenarioProductionLineHalt from "./scenarios/scenario_production_line_halt.json";
import scenarioEnvironmentalContamination from "./scenarios/scenario_environmental_contamination.json";

// Crisis Communications & Management scenarios
import scenarioExecutiveNotificationFailure from "./scenarios/scenario_executive_notification_failure.json";
import scenarioConflictingComms from "./scenarios/scenario_conflicting_comms.json";
import scenarioMediaLeak from "./scenarios/scenario_media_leak.json";
import scenarioSocialMediaMisinformation from "./scenarios/scenario_social_media_misinformation.json";
import scenarioCustomerNotificationDelay from "./scenarios/scenario_customer_notification_delay.json";
import scenarioLawEnforcementCoordination from "./scenarios/scenario_law_enforcement_coordination.json";
import scenarioRegulatoryDisclosureTiming from "./scenarios/scenario_regulatory_disclosure_timing.json";
import scenarioPrMissteps from "./scenarios/scenario_pr_missteps.json";

// Incident Response Process Failures (Meta-Incidents)
import scenarioDetectionFailure from "./scenarios/scenario_detection_failure.json";
import scenarioAlertFatigue from "./scenarios/scenario_alert_fatigue.json";
import scenarioMissedIoc from "./scenarios/scenario_missed_ioc.json";
import scenarioDelayedEscalation from "./scenarios/scenario_delayed_escalation.json";
import scenarioPoorHandoff from "./scenarios/scenario_poor_handoff.json";
import scenarioIncompleteForensics from "./scenarios/scenario_incomplete_forensics.json";
import scenarioIneffectiveContainment from "./scenarios/scenario_ineffective_containment.json";
import scenarioFailedLessonsLearned from "./scenarios/scenario_failed_lessons_learned.json";

// Firefighter — Residential
import scenarioFireKitchenGrease from "./scenarios/scenario_fire_kitchen_grease.json";
import scenarioFireChimney from "./scenarios/scenario_fire_chimney.json";
import scenarioFireSingleFamilyUnoccupied from "./scenarios/scenario_fire_single_family_unoccupied.json";
import scenarioFireSingleFamilyOccupied from "./scenarios/scenario_fire_single_family_occupied.json";
import scenarioFireApartmentUnit from "./scenarios/scenario_fire_apartment_unit.json";
import scenarioFireApartmentComplex from "./scenarios/scenario_fire_apartment_complex.json";
import scenarioFireAttic from "./scenarios/scenario_fire_attic.json";
import scenarioFireBasement from "./scenarios/scenario_fire_basement.json";
import scenarioFireElectricalWall from "./scenarios/scenario_fire_electrical_wall.json";
import scenarioFireMobileHome from "./scenarios/scenario_fire_mobile_home.json";
import scenarioFireHoarderHouse from "./scenarios/scenario_fire_hoarder_house.json";
import scenarioFireDisabledOccupants from "./scenarios/scenario_fire_disabled_occupants.json";
import scenarioFireOccupantsRefusingEvacuation from "./scenarios/scenario_fire_occupants_refusing_evacuation.json";
import scenarioFireChildrenTrapped from "./scenarios/scenario_fire_children_trapped.json";

// Firefighter — Notional / Training-Focused Scenarios
import scenarioFireMultiAlarm from "./scenarios/scenario_fire_multi_alarm.json";
import scenarioFireFirefighterShortage from "./scenarios/scenario_fire_firefighter_shortage.json";
import scenarioFireSevereWeather from "./scenarios/scenario_fire_severe_weather.json";
import scenarioFire911Center from "./scenarios/scenario_fire_911_center.json";
import scenarioFireShiftChange from "./scenarios/scenario_fire_shift_change.json";
import scenarioFireHoliday from "./scenarios/scenario_fire_holiday.json";
import scenarioFireBlackout from "./scenarios/scenario_fire_blackout.json";
import scenarioFireDispatchCyberOutage from "./scenarios/scenario_fire_dispatch_cyber_outage.json";
import scenarioFireFalseReports from "./scenarios/scenario_fire_false_reports.json";
import scenarioFireEthicalTriage from "./scenarios/scenario_fire_ethical_triage.json";
import scenarioFireHomeOxygenTanks from "./scenarios/scenario_fire_home_oxygen_tanks.json";
import scenarioFireLithiumIonBattery from "./scenarios/scenario_fire_lithium_ion_battery.json";
import scenarioFireHighRiseResidential from "./scenarios/scenario_fire_high_rise_residential.json";

// Firefighter — Commercial & Industrial
import scenarioFireOfficeBuilding from "./scenarios/scenario_fire_office_building.json";
import scenarioFireRetailStore from "./scenarios/scenario_fire_retail_store.json";
import scenarioFireRestaurant from "./scenarios/scenario_fire_restaurant.json";
import scenarioFireShoppingMall from "./scenarios/scenario_fire_shopping_mall.json";
import scenarioFireSchool from "./scenarios/scenario_fire_school.json";
import scenarioFireWarehouse from "./scenarios/scenario_fire_warehouse.json";

// Wildland Fire
import scenarioBrushFire from "./scenarios/scenario_brush_fire.json";
import scenarioGrassFire from "./scenarios/scenario_grass_fire.json";
import scenarioForestFire from "./scenarios/scenario_forest_fire.json";
import scenarioWuiFire from "./scenarios/scenario_wui_fire.json";
import scenarioFireThreateningResidential from "./scenarios/scenario_fire_threatening_residential.json";
import scenarioFirePowerLines from "./scenarios/scenario_fire_power_lines.json";
import scenarioNighttimeWildfire from "./scenarios/scenario_nighttime_wildfire.json";
import scenarioWindDrivenWildfire from "./scenarios/scenario_wind_driven_wildfire.json";
import scenarioFireSteepTerrain from "./scenarios/scenario_fire_steep_terrain.json";
import scenarioFireDroughtConditions from "./scenarios/scenario_fire_drought_conditions.json";
import scenarioFireExtremeHeatwave from "./scenarios/scenario_fire_extreme_heatwave.json";
import scenarioFireLimitedWater from "./scenarios/scenario_fire_limited_water.json";
import scenarioFireMultipleIgnitions from "./scenarios/scenario_fire_multiple_ignitions.json";
import scenarioFireJumpingContainment from "./scenarios/scenario_fire_jumping_containment.json";
import scenarioFireBlockingEvacuation from "./scenarios/scenario_fire_blocking_evacuation.json";
import scenarioFireCriticalInfrastructure from "./scenarios/scenario_fire_critical_infrastructure.json";
import scenarioFireWildlifeRescue from "./scenarios/scenario_fire_wildlife_rescue.json";

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

    // ── Insider Threat: Malicious Actions ────────────────────────────────────
    {
        id: "scenario_ip_theft",
        icon: "🧠",
        name: "Intellectual Property Theft",
        description: "An R&D engineer downloads complete product designs and source code to personal cloud storage before leaving to join a competitor.",
        data: scenarioIpTheft,
    },
    {
        id: "scenario_insider_sabotage",
        icon: "💣",
        name: "Insider Sabotage",
        description: "A disgruntled IT administrator deliberately deletes critical production database backups and corrupts configuration files after learning they are being made redundant.",
        data: scenarioInsiderSabotage,
    },
    {
        id: "scenario_insider_privilege_abuse",
        icon: "💸",
        name: "Insider Privilege Abuse",
        description: "A finance systems admin abuses their privileged access to a payroll system to grant themselves unauthorised pay rises and approve fraudulent expense claims.",
        data: scenarioInsiderPrivilegeAbuse,
    },
    {
        id: "scenario_insider_fraud",
        icon: "🧾",
        name: "Insider Fraud",
        description: "A billing clerk manipulates invoice records in the ERP system to redirect vendor payments to a personal bank account over several months.",
        data: scenarioInsiderFraud,
    },
    {
        id: "scenario_system_tampering",
        icon: "🔧",
        name: "System Tampering",
        description: "A departing network engineer covertly modifies firewall rules and routing configurations to weaken perimeter defences and create hidden remote-access pathways.",
        data: scenarioSystemTampering,
    },
    {
        id: "scenario_insider_backdoor",
        icon: "🚪",
        name: "Insider Backdoor Insertion",
        description: "A contractor inserts a hidden authentication bypass into production source code just before their engagement ends, enabling future remote access.",
        data: scenarioInsiderBackdoor,
    },

    // ── Insider Threat: Accidental / Negligent Errors ─────────────────────────
    {
        id: "scenario_data_sent_wrong_recipient",
        icon: "📨",
        name: "Data Sent to Wrong Recipient",
        description: "An HR manager accidentally emails a spreadsheet containing salary and personal data for 300 employees to an external distribution list.",
        data: scenarioDataSentWrongRecipient,
    },
    {
        id: "scenario_poor_password_practices",
        icon: "🔑",
        name: "Poor Password Practices",
        description: "Audit discovers multiple privileged accounts sharing the same weak password across systems with no MFA — one account has already been compromised.",
        data: scenarioPoorPasswordPractices,
    },
    {
        id: "scenario_disabled_security_controls",
        icon: "🛡️",
        name: "Disabled Security Controls",
        description: "A server administrator disables endpoint protection temporarily for performance testing and forgets to re-enable it — a malware infection occurs weeks later with no detection logs.",
        data: scenarioDisabledSecurityControls,
    },
    {
        id: "scenario_lost_device",
        icon: "💻",
        name: "Lost Device",
        description: "An employee reports their unencrypted work laptop missing after a business trip — it contains client files and cached VPN credentials with no remote wipe capability.",
        data: scenarioLostDevice,
    },
    {
        id: "scenario_unencrypted_data_exposure",
        icon: "🔓",
        name: "Unencrypted Data Exposure",
        description: "A developer stores a production database backup containing 50,000 customer records on an unencrypted USB drive left in an unlocked office.",
        data: scenarioUnencryptedDataExposure,
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

    // ── Industrial & OT/SCADA Incidents ─────────────────────────────────────
    {
        id: "scenario_plc_malfunction",
        icon: "🏭",
        name: "PLC Malfunction",
        description: "A PLC at a water treatment facility begins issuing erratic pump commands. Operators must determine whether the cause is a hardware fault, misconfiguration, or malicious tampering.",
        data: scenarioPlcMalfunction,
    },
    {
        id: "scenario_ics_malware",
        icon: "🦠",
        name: "ICS Malware Infection",
        description: "Malware designed to exfiltrate process data and manipulate setpoints is discovered in the historian server of an industrial control system at a gas distribution facility.",
        data: scenarioIcsMalware,
    },
    {
        id: "scenario_sensor_spoofing",
        icon: "🌡️",
        name: "Sensor Spoofing",
        description: "Temperature sensors in a chemical processing plant are reporting false readings. Investigation reveals the sensor data feed has been manipulated while actual temperatures approach critical levels.",
        data: scenarioSensorSpoofing,
    },
    {
        id: "scenario_safety_system_failure",
        icon: "🚨",
        name: "Safety System Failure",
        description: "The Safety Instrumented System at an oil refinery fails to respond during a high-pressure alarm. Operators must manually manage a dangerous high-pressure situation with the SIS offline.",
        data: scenarioSafetySystemFailure,
    },
    {
        id: "scenario_physical_process_manipulation",
        icon: "🔧",
        name: "Physical Process Manipulation",
        description: "Valve positions in a chemical plant no longer match commanded states. Physical inspection confirms valves are being moved without operator commands via unauthorised remote DCS access.",
        data: scenarioPhysicalProcessManipulation,
    },
    {
        id: "scenario_ot_it_crossover_breach",
        icon: "🔗",
        name: "OT/IT Network Crossover Breach",
        description: "A ransomware infection on the corporate IT network propagates through an improperly segmented boundary into the OT network, reaching engineering workstations connected to industrial control systems.",
        data: scenarioOtItCrossoverBreach,
    },
    {
        id: "scenario_production_line_halt",
        icon: "⛔",
        name: "Production Line Halt",
        description: "An entire production line in a manufacturing facility stops unexpectedly after a control system update is pushed. PLCs are unresponsive and the HMI shows communication errors.",
        data: scenarioProductionLineHalt,
    },
    {
        id: "scenario_environmental_contamination",
        icon: "☣️",
        name: "Environmental Contamination",
        description: "Sensors at a water treatment facility detect chemical levels outside safe parameters following a suspected manipulation of chemical dosing systems, risking contamination of the distribution network.",
        data: scenarioEnvironmentalContamination,
    },

    // ── Crisis Communications & Management ───────────────────────────────────
    {
        id: "scenario_executive_notification_failure",
        icon: "📢",
        name: "Executive Notification Failure",
        description: "During a major ransomware attack, executives learn of the incident from external news coverage before being notified internally, having already made uninformed public statements.",
        data: scenarioExecutiveNotificationFailure,
    },
    {
        id: "scenario_conflicting_comms",
        icon: "🔀",
        name: "Conflicting Internal Communications",
        description: "During a data breach, IT, legal, PR, and customer support teams send contradictory information to stakeholders. A single coordinated communication strategy must be established urgently.",
        data: scenarioConflictingComms,
    },
    {
        id: "scenario_media_leak",
        icon: "📰",
        name: "Media Leak Simulation",
        description: "Confidential details of an ongoing security incident are leaked to a technology news outlet before the organisation has completed its investigation or notified affected customers.",
        data: scenarioMediaLeak,
    },
    {
        id: "scenario_social_media_misinformation",
        icon: "📱",
        name: "Social Media Misinformation",
        description: "False and exaggerated claims about the scope of a confirmed data breach spread rapidly on social media. The organisation must communicate accurately at speed while managing reputation damage.",
        data: scenarioSocialMediaMisinformation,
    },
    {
        id: "scenario_customer_notification_delay",
        icon: "⏱️",
        name: "Customer Notification Delays",
        description: "Legal counsel advises delaying customer breach notification pending forensic completion, but GDPR's 72-hour deadline and operational pressures are building. Teams must align on a notification strategy.",
        data: scenarioCustomerNotificationDelay,
    },
    {
        id: "scenario_law_enforcement_coordination",
        icon: "👮",
        name: "Law Enforcement Coordination",
        description: "Following a ransomware attack with data exfiltration, law enforcement requests evidence and system access. The organisation must balance cooperation with business continuity and legal privilege concerns.",
        data: scenarioLawEnforcementCoordination,
    },
    {
        id: "scenario_regulatory_disclosure_timing",
        icon: "📋",
        name: "Regulatory Disclosure Timing",
        description: "A major incident triggers reporting obligations under GDPR, NIS2, and SEC disclosure rules across multiple jurisdictions. Legal and compliance teams must coordinate disclosure timing and content.",
        data: scenarioRegulatoryDisclosureTiming,
    },
    {
        id: "scenario_pr_missteps",
        icon: "😬",
        name: "Public Relations Missteps",
        description: "The organisation's initial breach press statement downplays the incident, contains inaccurate scope information, and omits a meaningful apology. The PR team must correct course and rebuild trust.",
        data: scenarioPrMissteps,
    },

    // ── Incident Response Process Failures (Meta‑Incidents) ──────────────────
    {
        id: "scenario_detection_failure",
        icon: "🔍",
        name: "Detection Failure",
        description: "Post-incident analysis reveals an attacker maintained persistent access for 47 days. SIEM alerts were generated but never triaged, and the threat was only discovered via external notification.",
        data: scenarioDetectionFailure,
    },
    {
        id: "scenario_alert_fatigue",
        icon: "🔔",
        name: "Alert Fatigue",
        description: "Analysts receiving over 2,000 SIEM alerts per day with a 97% false positive rate have developed dismissal habits, causing a genuine intrusion alert to be discarded alongside false positives.",
        data: scenarioAlertFatigue,
    },
    {
        id: "scenario_missed_ioc",
        icon: "🕵️",
        name: "Missed Indicators of Compromise",
        description: "Threat intelligence reveals the attacker's IOCs were present in logs three weeks before ransomware detonation. Multiple public-feed IOCs went unactioned throughout the dwell period.",
        data: scenarioMissedIoc,
    },
    {
        id: "scenario_delayed_escalation",
        icon: "⏰",
        name: "Delayed Escalation",
        description: "A tier-1 analyst detected lateral movement but delayed escalation for five hours due to uncertainty about escalation thresholds. Ransomware reached 40 servers before the IR team responded.",
        data: scenarioDelayedEscalation,
    },
    {
        id: "scenario_poor_handoff",
        icon: "🤝",
        name: "Poor Handoff Between Teams",
        description: "An undocumented shift handoff during a ransomware incident causes the night-shift IR team to unknowingly reverse a containment measure, allowing the attacker to re-enter the environment.",
        data: scenarioPoorHandoff,
    },
    {
        id: "scenario_incomplete_forensics",
        icon: "🔬",
        name: "Incomplete Forensic Evidence",
        description: "A major breach investigation is hampered by disabled logging, prematurely reimaged systems, and no memory captures. The team must reconstruct evidence and implement forensic readiness improvements.",
        data: scenarioIncompleteForensics,
    },
    {
        id: "scenario_ineffective_containment",
        icon: "🚧",
        name: "Ineffective Containment",
        description: "The IR team isolates one infected host but fails to identify 15 other compromised systems. The malware reactivates overnight from an uncontained host, spreading further across the network.",
        data: scenarioIneffectiveContainment,
    },
    {
        id: "scenario_failed_lessons_learned",
        icon: "📝",
        name: "Failed Lessons Learned Process",
        description: "A near-identical phishing-led breach occurs six months after the first. Post-incident action items from the original incident were identified but never tracked to completion.",
        data: scenarioFailedLessonsLearned,
    },

    // ── Firefighter: Residential Fires ────────────────────────────────────────
    {
        id: "scenario_fire_kitchen_grease",
        icon: "🍳",
        name: "Kitchen Grease Fire",
        description: "Kitchen grease fire in a residential home — crews must select the correct suppression agent and verify there is no extension into the range hood ductwork.",
        data: scenarioFireKitchenGrease,
    },
    {
        id: "scenario_fire_chimney",
        icon: "🏠",
        name: "Chimney Fire",
        description: "A chimney or flue fire with potential spread to the structure — crews must contain the fire, inspect for extension, and advise the homeowner on safety.",
        data: scenarioFireChimney,
    },
    {
        id: "scenario_fire_single_family_unoccupied",
        icon: "🏠",
        name: "Single-Family Home Fire (Unoccupied)",
        description: "A single-family home confirmed unoccupied is fully involved — crews conduct an offensive attack, monitor for collapse, and perform thorough overhaul.",
        data: scenarioFireSingleFamilyUnoccupied,
    },
    {
        id: "scenario_fire_single_family_occupied",
        icon: "🏠",
        name: "Single-Family Home Fire (Occupied)",
        description: "Occupants reported inside a burning single-family home — crews must prioritize life safety, conduct a primary search, and coordinate fire attack.",
        data: scenarioFireSingleFamilyOccupied,
    },
    {
        id: "scenario_fire_apartment_unit",
        icon: "🏢",
        name: "Apartment Unit Fire",
        description: "A single apartment unit fire in a multi-story building — crews must confine the fire, protect the corridor, and account for all occupants.",
        data: scenarioFireApartmentUnit,
    },
    {
        id: "scenario_fire_apartment_complex",
        icon: "🏢",
        name: "Apartment Complex Fire (Multi-Unit)",
        description: "Multiple units involved in a large apartment complex fire — incident command, resource management, and defensive transition are all tested.",
        data: scenarioFireApartmentComplex,
    },
    {
        id: "scenario_fire_attic",
        icon: "🏠",
        name: "Attic Fire",
        description: "Fire spreading through concealed spaces in a truss-roof attic — crews must open ceilings strategically, monitor for collapse, and transition to defensive when necessary.",
        data: scenarioFireAttic,
    },
    {
        id: "scenario_fire_basement",
        icon: "🏚️",
        name: "Basement Fire",
        description: "Heavy smoke pushing up a stairwell from a basement fire — crews navigate a high-risk attack position and manage ventilation in a below-grade fire.",
        data: scenarioFireBasement,
    },
    {
        id: "scenario_fire_electrical_wall",
        icon: "⚡",
        name: "Electrical Wall Fire",
        description: "Fire burning inside wall cavities from an electrical fault — crews must locate hidden fire travel, open walls safely, and coordinate with utilities.",
        data: scenarioFireElectricalWall,
    },
    {
        id: "scenario_fire_mobile_home",
        icon: "🏕️",
        name: "Mobile Home Fire",
        description: "A rapidly progressing mobile home fire with lightweight construction hazards — crews must assess survivability quickly and decide on offensive versus defensive tactics.",
        data: scenarioFireMobileHome,
    },
    {
        id: "scenario_fire_hoarder_house",
        icon: "🏚️",
        name: "Hoarder House Fire",
        description: "A fire in a hoarder residence with extreme fuel load, blocked egress, and structural instability — crews balance life safety with an elevated collapse risk.",
        data: scenarioFireHoarderHouse,
    },
    {
        id: "scenario_fire_disabled_occupants",
        icon: "♿",
        name: "Fire with Disabled Occupants",
        description: "A home fire where disabled or immobile occupants cannot self-evacuate — crews must plan and execute non-ambulatory rescue alongside fire attack.",
        data: scenarioFireDisabledOccupants,
    },
    {
        id: "scenario_fire_occupants_refusing_evacuation",
        icon: "🚪",
        name: "Occupants Refusing Evacuation",
        description: "Occupants refuse to leave a burning structure — crews must use appropriate authority, manage the refusal, and document their actions.",
        data: scenarioFireOccupantsRefusingEvacuation,
    },
    {
        id: "scenario_fire_children_trapped",
        icon: "🧒",
        name: "Children Trapped in House Fire",
        description: "Children reported trapped on the upper floor of a burning home — crews must execute an immediate ground-ladder rescue while protecting the interior staircase.",
        data: scenarioFireChildrenTrapped,
    },
    {
        id: "scenario_fire_home_oxygen_tanks",
        icon: "🫁",
        name: "Home Fire with Medical Oxygen Tanks",
        description: "A residential fire with confirmed medical oxygen tanks inside creates a BLEVE risk and oxygen-enriched fire environment — defensive operations are essential.",
        data: scenarioFireHomeOxygenTanks,
    },
    {
        id: "scenario_fire_lithium_ion_battery",
        icon: "🔋",
        name: "Lithium-Ion Battery Fire",
        description: "A lithium-ion battery in thermal runaway creates an uncontrollable fire risk — crews must apply continuous water cooling and manage re-ignition hazards.",
        data: scenarioFireLithiumIonBattery,
    },
    {
        id: "scenario_fire_high_rise_residential",
        icon: "🏙️",
        name: "High-Rise Residential Fire",
        description: "A fire above aerial ladder reach in a high-rise residential building — crews rely on standpipe systems, stairwell staging, and floor-by-floor co-ordination.",
        data: scenarioFireHighRiseResidential,
    },

    // ── Firefighter: Commercial & Industrial Fires ────────────────────────────
    {
        id: "scenario_fire_office_building",
        icon: "🏢",
        name: "Office Building Fire",
        description: "A fire in a multi-story office building during business hours — crews manage large-scale evacuation, standpipe operations, and occupant accountability.",
        data: scenarioFireOfficeBuilding,
    },
    {
        id: "scenario_fire_retail_store",
        icon: "🛒",
        name: "Retail Store Fire",
        description: "A fire in a retail store during peak business hours with customers inside — crews must execute rapid evacuation and navigate high fuel-load stock areas.",
        data: scenarioFireRetailStore,
    },
    {
        id: "scenario_fire_restaurant",
        icon: "🍽️",
        name: "Restaurant Kitchen Fire",
        description: "A commercial kitchen fire involving grease fryers escalates beyond the hood suppression system — crews apply correct Class K tactics in a confined, high-hazard space.",
        data: scenarioFireRestaurant,
    },
    {
        id: "scenario_fire_shopping_mall",
        icon: "🏬",
        name: "Shopping Mall Fire",
        description: "A fire breaks out in a retail anchor store inside a large shopping mall during peak hours — crews manage mass evacuation, complex floor plans, and multiple access points.",
        data: scenarioFireShoppingMall,
    },
    {
        id: "scenario_fire_school",
        icon: "🏫",
        name: "School Fire",
        description: "A fire in a school science lab during the school day with hundreds of students on site — crews must coordinate with staff for rapid evacuation while suppressing the fire.",
        data: scenarioFireSchool,
    },
    {
        id: "scenario_fire_warehouse",
        icon: "🏭",
        name: "Warehouse Fire",
        description: "A warehouse fire with unknown contents, high racking, and a large footprint — crews assess collapse and HAZMAT risks and manage a defensive master-stream operation.",
        data: scenarioFireWarehouse,
    },

    // ── Wildland Fire ─────────────────────────────────────────────────────────
    {
        id: "scenario_brush_fire",
        icon: "🌿",
        name: "Brush Fire",
        description: "A brush fire ignites near a populated trailhead and spreads rapidly toward nearby structures — crews deploy direct and indirect attack while co-ordinating evacuation.",
        data: scenarioBrushFire,
    },
    {
        id: "scenario_grass_fire",
        icon: "🌾",
        name: "Grass Fire",
        description: "A grass fire ignites along a highway median and spreads rapidly across open fields toward farmland — crews use mobile attack and anchor points to establish control lines.",
        data: scenarioGrassFire,
    },
    {
        id: "scenario_forest_fire",
        icon: "🌲",
        name: "Forest Fire",
        description: "A lightning-caused forest fire grows into a large complex threatening a wilderness area and a nearby town — crews manage suppression priorities and community protection.",
        data: scenarioForestFire,
    },
    {
        id: "scenario_wui_fire",
        icon: "🏘️",
        name: "Wildland–Urban Interface (WUI) Fire",
        description: "A WUI fire erupts at the edge of a suburb, threatening homes and displacing residents — crews balance structure protection with wildland suppression tactics.",
        data: scenarioWuiFire,
    },
    {
        id: "scenario_fire_threatening_residential",
        icon: "🏘️",
        name: "Wildfire Threatening Residential Area",
        description: "A rapidly advancing wildfire moves into a densely populated residential neighborhood with limited egress — crews must triage structures and coordinate mass evacuation.",
        data: scenarioFireThreateningResidential,
    },
    {
        id: "scenario_fire_power_lines",
        icon: "⚡",
        name: "Downed Power Line Wildfire",
        description: "A downed power line ignites a wildfire during high winds — crews must establish a safe zone around energized lines and coordinate with the utility company before suppression.",
        data: scenarioFirePowerLines,
    },
    {
        id: "scenario_nighttime_wildfire",
        icon: "🌙",
        name: "Nighttime Wildfire Operations",
        description: "A large wildfire must be managed through nighttime operations with reduced visibility and altered fire behavior — crews apply night-specific tactics and safety protocols.",
        data: scenarioNighttimeWildfire,
    },
    {
        id: "scenario_wind_driven_wildfire",
        icon: "💨",
        name: "Wind-Driven Wildfire",
        description: "Extreme wind conditions drive a wildfire at dangerous speed, overwhelming standard suppression tactics — crews must execute emergency relocation and deploy fire shelters.",
        data: scenarioWindDrivenWildfire,
    },
    {
        id: "scenario_fire_steep_terrain",
        icon: "⛰️",
        name: "Wildfire in Steep Terrain",
        description: "A wildfire in steep, rugged terrain creates extreme fire behavior and limits access — crews apply terrain-based safety rules and coordinate aerial support.",
        data: scenarioFireSteepTerrain,
    },
    {
        id: "scenario_fire_drought_conditions",
        icon: "🏜️",
        name: "Wildfire in Drought Conditions",
        description: "A wildfire ignites during a severe multi-year drought with extreme fire behavior and depleted water resources — crews adapt suppression strategy to scarce water supply.",
        data: scenarioFireDroughtConditions,
    },
    {
        id: "scenario_fire_extreme_heatwave",
        icon: "🌡️",
        name: "Wildfire During Extreme Heatwave",
        description: "A wildfire erupts during a record-breaking heatwave, compounding health risks for firefighters and evacuees — crews monitor for heat illness and adjust operational tempo.",
        data: scenarioFireExtremeHeatwave,
    },
    {
        id: "scenario_fire_limited_water",
        icon: "💧",
        name: "Wildfire with Limited Water Supply",
        description: "A wildfire breaks out in a remote area with no reliable water infrastructure — crews develop creative water sourcing strategies and prioritize high-value assets.",
        data: scenarioFireLimitedWater,
    },
    {
        id: "scenario_fire_multiple_ignitions",
        icon: "🔥",
        name: "Multiple Wildfire Ignitions",
        description: "Multiple simultaneous wildfire ignitions raise suspicion of deliberate arson — crews split resources across incidents while preserving evidence for investigation.",
        data: scenarioFireMultipleIgnitions,
    },
    {
        id: "scenario_fire_jumping_containment",
        icon: "🔥",
        name: "Wildfire Breaking Containment",
        description: "An established wildfire breaks through containment lines — crews execute emergency repositioning, protect exposed personnel, and re-establish a new perimeter.",
        data: scenarioFireJumpingContainment,
    },
    {
        id: "scenario_fire_blocking_evacuation",
        icon: "🚧",
        name: "Wildfire Blocking Evacuation Routes",
        description: "A wildfire cuts off primary evacuation routes, trapping residents — crews coordinate alternative extraction methods and work with law enforcement for safe passage.",
        data: scenarioFireBlockingEvacuation,
    },
    {
        id: "scenario_fire_critical_infrastructure",
        icon: "🏗️",
        name: "Wildfire Threatening Critical Infrastructure",
        description: "A wildfire advances toward a water treatment facility and a natural gas hub — crews triage infrastructure protection while managing the advancing fire perimeter.",
        data: scenarioFireCriticalInfrastructure,
    },
    {
        id: "scenario_fire_wildlife_rescue",
        icon: "🦌",
        name: "Wildfire with Wildlife Rescue",
        description: "A wildfire threatens a wildlife refuge, forcing coordinated rescue operations for injured animals alongside fire suppression and habitat protection.",
        data: scenarioFireWildlifeRescue,
    },

    // ── Firefighter: Notional / Training-Focused Scenarios ────────────────────
    {
        id: "scenario_fire_multi_alarm",
        icon: "🔔",
        name: "Simultaneous Multi-Alarm Fires",
        description: "Two simultaneous structure fires stretch resources to their limits — IC must triage priorities, split command, and integrate mutual aid across both scenes.",
        data: scenarioFireMultiAlarm,
    },
    {
        id: "scenario_fire_firefighter_shortage",
        icon: "👨‍🚒",
        name: "Fire During Firefighter Shortage",
        description: "A working structure fire with reported entrapment occurs during a severe staffing shortage — crews must operate within strict minimum-staffing safety limits.",
        data: scenarioFireFirefighterShortage,
    },
    {
        id: "scenario_fire_severe_weather",
        icon: "⛈️",
        name: "Fire During Severe Weather",
        description: "A structure fire during active severe weather with high winds, lightning, and a wind shift — crews must apply wind-driven fire tactics and lightning safety protocols.",
        data: scenarioFireSevereWeather,
    },
    {
        id: "scenario_fire_911_center",
        icon: "📞",
        name: "Fire Affecting 911 Centre and Urgent Care Clinic",
        description: "A fire in the regional 911 Communications Centre threatens dispatch continuity — IC must balance suppression against maintaining emergency call-taking operations.",
        data: scenarioFire911Center,
    },
    {
        id: "scenario_fire_shift_change",
        icon: "🔄",
        name: "Incident During Shift Change",
        description: "A structure fire erupts during the day-to-night shift handoff — crews must manage command transfer, accountability across both shifts, and crew rotation during overhaul.",
        data: scenarioFireShiftChange,
    },
    {
        id: "scenario_fire_holiday",
        icon: "🎆",
        name: "Fire Incident During Holidays",
        description: "A residential fire on New Year's Eve with skeleton staffing, congested streets, intoxicated bystanders, and midnight fireworks degrading communication.",
        data: scenarioFireHoliday,
    },
    {
        id: "scenario_fire_blackout",
        icon: "🔦",
        name: "Fire During Power Blackout",
        description: "A fire in a mid-rise residential building during a total power blackout — no lighting, no elevators, and panicked residents in darkened stairwells.",
        data: scenarioFireBlackout,
    },
    {
        id: "scenario_fire_dispatch_cyber_outage",
        icon: "💻",
        name: "Fire with Cyber Outage of Dispatch Systems",
        description: "A structure fire coincides with a ransomware attack on the regional CAD system — manual dispatch, radio interference, and compromised channels complicate operations.",
        data: scenarioFireDispatchCyberOutage,
    },
    {
        id: "scenario_fire_false_reports",
        icon: "📻",
        name: "Fire Command Overwhelmed by False Reports",
        description: "A multi-alarm fire generates a flood of unverified bystander reports and a false MAYDAY transmission — IC must manage information overload while maintaining command clarity.",
        data: scenarioFireFalseReports,
    },
    {
        id: "scenario_fire_ethical_triage",
        icon: "⚖️",
        name: "Ethical Decision-Making Under Triage Pressure",
        description: "A mass casualty event at a structure fire forces life-or-death triage decisions under extreme pressure, including the hardest designation — expectant victims unlikely to survive.",
        data: scenarioFireEthicalTriage,
    },
];

export default DEMO_SCENARIOS;
