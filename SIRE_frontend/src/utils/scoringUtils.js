/**
 * scoringUtils.js
 * Shared scoring and readiness utilities used across the analytics and admin dashboard screens.
 */

/**
 * Returns the CSS colour string for an accuracy ratio (0–1).
 * @param {number|null} v - accuracy value between 0 and 1, or null
 * @returns {string}
 */
export function accuracyColor(v) {
    if (v == null) return "rgba(255,255,255,0.35)";
    if (v >= 0.8) return "rgb(80,220,80)";
    if (v >= 0.5) return "rgb(255,180,40)";
    return "rgb(255,100,100)";
}

/**
 * Returns a human-readable readiness label for an accuracy ratio (0–1).
 * @param {number|null} v
 * @returns {string}
 */
export function readinessLabel(v) {
    if (v == null) return "—";
    if (v >= 0.8) return "Strong";
    if (v >= 0.5) return "Developing";
    return "Needs Work";
}

/**
 * Converts a scenario key (e.g. 'scenario_cyber_attack') to a display name (e.g. 'Cyber Attack').
 * @param {string|null} key
 * @returns {string}
 */
export function formatScenarioName(key) {
    if (!key) return "";
    return key
        .replace(/^scenario_/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}
