/**
 * add_metadata.mjs
 * Adds category, difficulty, and tags fields to all scenario JSON files
 * in both the backend and frontend scenario directories.
 * Run with: node add_metadata.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, basename } from "path";

const DIRS = [
    "/home/runner/work/S.I.R.E./S.I.R.E./SIRE_backend/backend/src/scenarios",
    "/home/runner/work/S.I.R.E./S.I.R.E./SIRE_frontend/src/data/scenarios",
];

/** Determine category from filename. */
function getCategory(name) {
    if (/fire|flood|severe_weather|power_outage/.test(name)) return "Physical";
    if (/medical_emergency|mass_casualty/.test(name)) return "Medical";
    if (/hazardous_material/.test(name)) return "HAZMAT";
    if (/active_threat/.test(name)) return "Threat";
    return "Cyber";
}

/** Determine difficulty from filename. */
function getDifficulty(name) {
    const beginner = [
        "fire", "flood", "medical_emergency", "power_outage",
        "phishing_email", "smishing",
    ];
    const advanced = [
        "whaling", "spear_phishing", "oauth_phishing", "deepfake_scam",
        "ransomware", "privilege_escalation", "compromised_active_directory",
        "wiper_malware", "fileless_malware", "botnet", "cryptomining",
        "remote_access_trojan", "session_hijacking", "stolen_api_keys",
        "token_theft", "worm_outbreak", "password_spraying",
        "credential_stuffing", "brute_force_login", "insider_credential_misuse",
        "mass_casualty", "infrastructure_attack",
    ];
    if (beginner.some((k) => name.includes(k))) return "Beginner";
    if (advanced.some((k) => name.includes(k))) return "Advanced";
    return "Intermediate";
}

/** Generate sensible tags from filename. */
function getTags(name) {
    const map = {
        fire:                         ["fire", "evacuation", "emergency services", "physical"],
        flood:                        ["flood", "water damage", "evacuation", "physical"],
        medical_emergency:            ["medical", "first aid", "EMS", "CPR"],
        severe_weather:               ["weather", "shelter-in-place", "natural disaster", "physical"],
        active_threat:                ["lockdown", "active shooter", "security", "physical threat"],
        power_outage:                 ["power", "backup systems", "continuity", "physical"],
        hazardous_material:           ["HAZMAT", "chemical spill", "PPE", "decontamination"],
        mass_casualty:                ["MCI", "triage", "START", "EMS"],
        phishing_email:               ["phishing", "email", "social engineering", "awareness"],
        spear_phishing:               ["spear phishing", "targeted attack", "social engineering", "email"],
        whaling:                      ["whaling", "BEC", "executive impersonation", "fraud"],
        smishing:                     ["smishing", "SMS", "social engineering", "mobile"],
        vishing:                      ["vishing", "phone", "social engineering", "impersonation"],
        mfa_fatigue:                  ["MFA", "push notification", "authentication", "social engineering"],
        oauth_phishing:               ["OAuth", "consent phishing", "M365", "cloud"],
        bec:                          ["BEC", "email compromise", "fraud", "wire transfer"],
        fake_vendor_invoice:          ["invoice fraud", "BEC", "social engineering", "finance"],
        deepfake_scam:                ["deepfake", "AI", "fraud", "impersonation"],
        cyber_attack:                 ["ransomware", "phishing", "incident response", "cyber"],
        ransomware_encrypt:           ["ransomware", "encryption", "backup", "incident response"],
        ransomware_extort:            ["ransomware", "extortion", "negotiation", "incident response"],
        privilege_escalation_domain:  ["privilege escalation", "Active Directory", "domain admin", "lateral movement"],
        privilege_escalation_local:   ["privilege escalation", "local admin", "Windows", "endpoint"],
        compromised_active_directory: ["Active Directory", "domain compromise", "credential theft", "lateral movement"],
        wiper_malware:                ["wiper", "destructive malware", "data loss", "incident response"],
        fileless_malware:             ["fileless", "LOLBins", "PowerShell", "evasion"],
        botnet_infection:             ["botnet", "C2", "malware", "DDoS"],
        cryptomining_malware:         ["cryptomining", "malware", "resource abuse", "endpoint"],
        remote_access_trojan:         ["RAT", "backdoor", "C2", "malware"],
        session_hijacking:            ["session hijacking", "cookies", "web security", "credential theft"],
        stolen_api_keys:              ["API keys", "secrets management", "cloud", "credential theft"],
        token_theft:                  ["token theft", "OAuth", "cloud", "credential theft"],
        worm_outbreak:                ["worm", "network spread", "patching", "incident response"],
        password_spraying:            ["password spraying", "authentication", "brute force", "credential attack"],
        credential_stuffing:          ["credential stuffing", "data breach", "authentication", "account takeover"],
        brute_force_login:            ["brute force", "authentication", "account lockout", "credential attack"],
        insider_credential_misuse:    ["insider threat", "credential misuse", "DLP", "access control"],
        trojan_infection:             ["trojan", "malware", "endpoint", "incident response"],
        infrastructure_attack:        ["SCADA", "OT/ICS", "critical infrastructure", "nation-state"],
    };

    for (const [key, tags] of Object.entries(map)) {
        if (name.includes(key)) return tags;
    }
    return ["cyber", "incident response", "security"];
}

let totalUpdated = 0;

for (const dir of DIRS) {
    let files;
    try {
        files = readdirSync(dir).filter((f) => f.endsWith(".json"));
    } catch (err) {
        console.error(`Cannot read directory ${dir}:`, err.message);
        continue;
    }

    for (const file of files) {
        const filePath = join(dir, file);
        const name = basename(file, ".json");

        let data;
        try {
            data = JSON.parse(readFileSync(filePath, "utf8"));
        } catch (err) {
            console.error(`Failed to parse ${filePath}:`, err.message);
            continue;
        }

        let changed = false;

        if (!data.category) {
            data.category = getCategory(name);
            changed = true;
        }
        if (!data.difficulty) {
            data.difficulty = getDifficulty(name);
            changed = true;
        }
        if (!data.tags) {
            data.tags = getTags(name);
            changed = true;
        }

        if (changed) {
            writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
            console.log(`Updated: ${file} → category=${data.category}, difficulty=${data.difficulty}`);
            totalUpdated++;
        } else {
            console.log(`Skipped (already has metadata): ${file}`);
        }
    }
}

console.log(`\nDone. ${totalUpdated} files updated.`);
