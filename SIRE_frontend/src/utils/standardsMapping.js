/**
 * standardsMapping.js
 * Maps scenario categories / finding types to standards-aligned evidence references.
 *
 * Supported frameworks:
 *   - NIST CSF 2.0  (Govern / Identify / Protect / Detect / Respond / Recover)
 *   - ISO 27001:2022 (Annex A controls)
 *   - DORA (Digital Operational Resilience Act — ICT risk management articles)
 */

/** Per-scenario-key standards mapping.  Falls back to category mapping if key is absent. */
const SCENARIO_STANDARDS = {
    scenario_cyber_attack: {
        nist:  "DE.CM-1; RS.RP-1; RS.CO-2; RC.RP-1",
        iso:   "A.5.24; A.5.25; A.5.26; A.5.28; A.8.16",
        dora:  "Art.17 (ICT-related incident management); Art.18 (ICT incident classification)",
    },
    scenario_infrastructure_attack: {
        nist:  "DE.CM-1; RS.RP-1; RS.CO-3; RC.IM-1",
        iso:   "A.5.24; A.5.30; A.8.16",
        dora:  "Art.17; Art.19 (major incident reporting)",
    },
    scenario_fire: {
        nist:  "PR.IP-9; RC.RP-1; RC.CO-1",
        iso:   "A.7.5; A.5.30",
        dora:  "Art.11 (ICT business continuity management)",
    },
    scenario_flood: {
        nist:  "PR.IP-9; RC.RP-1; RC.CO-1",
        iso:   "A.5.29; A.5.30",
        dora:  "Art.11",
    },
    scenario_severe_weather: {
        nist:  "PR.IP-9; RC.RP-1",
        iso:   "A.5.29; A.5.30",
        dora:  "Art.11",
    },
    scenario_medical_emergency: {
        nist:  "PR.IP-9; RS.CO-1",
        iso:   "A.6.8; A.7.5",
        dora:  "Art.11",
    },
    scenario_power_outage: {
        nist:  "PR.IP-9; RC.RP-1; RC.CO-1",
        iso:   "A.7.11; A.5.30",
        dora:  "Art.11",
    },
    scenario_hazardous_material_spill: {
        nist:  "PR.IP-9; RS.CO-1; RC.RP-1",
        iso:   "A.5.29; A.7.5",
        dora:  "Art.11",
    },
    scenario_active_threat: {
        nist:  "DE.CM-6; RS.RP-1; RS.CO-1; RC.RP-1",
        iso:   "A.6.8; A.7.5; A.5.24",
        dora:  "Art.17",
    },
    scenario_mass_casualty: {
        nist:  "PR.IP-9; RS.CO-1; RC.RP-1",
        iso:   "A.5.29; A.5.30",
        dora:  "Art.11",
    },
};

/** Fallback standards for unknown / custom scenarios. */
const DEFAULT_STANDARDS = {
    nist: "PR.IP-9; RS.RP-1; RC.RP-1",
    iso:  "A.5.29; A.5.30",
    dora: "Art.11",
};

/**
 * Returns a formatted standards-reference string for a given scenario key.
 * @param {string} scenarioKey
 * @returns {string}
 */
export function getStandardsRef(scenarioKey) {
    const mapping = SCENARIO_STANDARDS[scenarioKey] || DEFAULT_STANDARDS;
    return [
        mapping.nist && `NIST CSF: ${mapping.nist}`,
        mapping.iso  && `ISO 27001: ${mapping.iso}`,
        mapping.dora && `DORA: ${mapping.dora}`,
    ].filter(Boolean).join(" | ");
}

/**
 * Returns a structured standards mapping object for display purposes.
 * @param {string} scenarioKey
 * @returns {{ nist: string, iso: string, dora: string }}
 */
export function getStandardsMapping(scenarioKey) {
    return SCENARIO_STANDARDS[scenarioKey] || DEFAULT_STANDARDS;
}
