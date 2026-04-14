/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-23
 * Description: Provides high-level API functions for authentication and user-related operations.
 */

import apiClient from "./apiClient";

/** Logs in a user and returns authentication data. */
export const login = async (email, password) => {
    return apiClient.post("/login", { email, password });
};

/** Registers a new user account. */
export const signup = async (email, password, name) => {
    return apiClient.post("/signup", { email, password, name });
};

/** Refreshes the access token using a refresh token. */
export const refreshToken = async (refreshTokenValue) => {
    return apiClient.post("/refresh-token", { refreshToken: refreshTokenValue });
};

/** Retrieves the currently authenticated user profile. */
export const getProfile = async () => {
    return apiClient.get("/me");
};

/** Logs out the current user by removing the stored authentication token. */
export const logout = async () => {
    localStorage.removeItem("authToken");
    return { success: true };
};

/** Checks if the backend API is reachable and healthy. */
export const checkHealth = async () => {
    return apiClient.get("/health");
}

/** Retrieves the list of available scenarios. */
export const getScenarios = async () => {
    return apiClient.get("/scenarios");
};

/** Retrieves the full scenario definition (including decision nodes) by scenario key. */
export const getScenario = async (scenarioKey) => {
    return apiClient.get(`/scenarios/${scenarioKey}`);
};

/** Creates a new custom scenario and persists it to the backend. Returns the saved scenario with its generated id. */
export const createCustomScenario = async (scenarioData) => {
    return apiClient.post("/scenarios", scenarioData);
};

/** Updates an existing custom scenario by its id. */
export const updateCustomScenario = async (id, scenarioData) => {
    return apiClient.put(`/scenarios/${id}`, scenarioData);
};

/** Deletes a custom scenario by its id. */
export const deleteCustomScenario = async (id) => {
    return apiClient.delete(`/scenarios/${id}`);
};

/** Retrieves a session by its session code. */
export const getSession = async (sessionCode) => {
    return apiClient.get(`/session/${sessionCode}`);
};

/** Creates a new session with the given scenario key. */
export const createSession = async (scenarioKey) => {
    return apiClient.post("/sessions", { scenario: scenarioKey });
};

/** Joins an existing session using its session key. */
export const joinSession = async (sessionKey) => {
    return apiClient.post("/sessions/join", { sessionKey });
};
