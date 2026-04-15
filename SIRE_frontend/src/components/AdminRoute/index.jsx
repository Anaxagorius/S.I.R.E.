/**
 * AdminRoute.jsx
 * Restricts access to screens that require an admin or facilitator role.
 * Authenticated participants are redirected to /role.
 * Unauthenticated users are redirected to /login.
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const PRIVILEGED_ROLES = new Set(["admin", "facilitator"]);

/**
 * Renders children only when the authenticated user holds an admin or facilitator role.
 * Shows a loading state while the auth context is being hydrated.
 */
export default function AdminRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (!user) return <Navigate to="/login" replace />;

    if (!PRIVILEGED_ROLES.has(user.role)) return <Navigate to="/role" replace />;

    return children;
}
