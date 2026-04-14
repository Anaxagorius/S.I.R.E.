/**
 * ProtectedRoute.jsx
 * Redirects unauthenticated users to the login screen.
 * Usage: wrap any Route element that requires a logged-in user.
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Renders children when the user is authenticated.
 * Shows a loading state while the auth context is being hydrated.
 * Redirects to /login when no authenticated user is present.
 */
export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (!user) return <Navigate to="/login" replace />;

    return children;
}
