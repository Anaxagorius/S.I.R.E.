/**
 * AdminRoute.jsx
 * Restricts access to screens that require an admin or facilitator role.
 * Auth checks are temporarily bypassed — admin routes are publicly accessible.
 */

/**
 * Renders children unconditionally.
 * Auth enforcement is skipped for now so admins can access the dashboard directly.
 */
export default function AdminRoute({ children }) {
    return children;
}
