/**
 * AuthContext.jsx
 * Global authentication context for the S.I.R.E. application.
 * Provides the current user (id, email, name, role) and helpers
 * for login and logout throughout the component tree.
 */

import { createContext, useContext, useEffect, useState } from "react";
import { getProfile } from "../services/api/api";

const AuthContext = createContext(null);

/**
 * AuthProvider wraps the application and exposes auth state via context.
 * On mount it attempts to rehydrate from a stored authToken.
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /** Restore user state from the stored auth token on initial load. */
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            setLoading(false);
            return;
        }
        getProfile()
            .then((data) => setUser(data))
            .catch(() => {
                localStorage.removeItem("authToken");
            })
            .finally(() => setLoading(false));
    }, []);

    /**
     * Call after a successful /login response to populate the auth state.
     * @param {string} token - the authToken returned by the API
     * @param {{ id: string, email: string, name: string, role: string }} userData
     */
    const login = (token, userData) => {
        localStorage.setItem("authToken", token);
        setUser(userData);
    };

    /** Clear the stored token and reset the auth state. */
    const logout = () => {
        localStorage.removeItem("authToken");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

/** Returns the current auth context value. Must be used inside AuthProvider. */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}
