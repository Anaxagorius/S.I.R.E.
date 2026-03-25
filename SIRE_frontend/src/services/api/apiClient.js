/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-21
 * Description: Handles HTTP requests, including base URL configuration, authentication headers,
 * error handling, and response parsing for authentication.
 */

// Base URL for API requests (configured via Vite environment variables)
// Accepts either the full API base (https://host/api) or just the host (https://host)
const _apiBase = import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || "http://localhost:8080";
const API_BASE = _apiBase.endsWith("/api") ? _apiBase : `${_apiBase}/api`;

// Optional API key for backend authentication (configured via Vite environment variables)
const API_KEY = import.meta.env.VITE_API_KEY || null;

/** Function that retrieves the stored authentication token from localStorage. */
function getAuthToken() {
    return localStorage.getItem("authToken");
}

/** Asynchronous function to make API requests. */
async function request(endpoint, options = {}) {
    const token = getAuthToken();

    // Merges default headers with any provided in options, and adds Authorization and API key headers
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(API_KEY ? { "x-api-key": API_KEY } : {}),
    };

    // Makes the API request
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    const text = await response.text();  // Reads response as text to handle both JSON and non-JSON responses

    // Parses response data safely
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    }
    catch {
        data = text;  // Assigns fallback if response is not valid JSON
    }
    
    if (!response.ok) {
        const errorMessage = (typeof data === "object" && data?.message) || `${response.status} ${response.statusText}` || "Unknown API error";
        const error = new Error(errorMessage);  // Creates an Error object with the message from the response
        error.status = response.status;         // Attaches the HTTP status code to the error object
        error.data = data;                      // Attaches the response data to the Error object for additional context
        throw error;                            // Throws the error to be caught by the caller
    }

    return data;  // Returns the parsed response data to the caller
}

/** API client for making HTTP requests. */
export default {
    
    /** Method for making GET requests. */
    get(endpoint) {
        return request(endpoint, { method: "GET" });
    },
    /** Method for making POST requests. */
    post(endpoint, body) {
        return request(endpoint, { method: "POST", body: JSON.stringify(body) });
    },
    /** Method for making PUT requests. */
    put(endpoint, body) {
        return request(endpoint, { method: "PUT", body: JSON.stringify(body) });
    },
    /** Method for making DELETE requests. */
    delete(endpoint) {
        return request(endpoint, { method: "DELETE" });
    },
};
