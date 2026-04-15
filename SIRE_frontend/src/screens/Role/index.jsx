/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-04-14
 * Description: Role screen of the application.
 * Reads the authenticated user's system role and presents role-appropriate navigation.
 * Admin and facilitator users are directed to the admin dashboard.
 * Participant users are directed to join a session.
 */

import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import RoleLayout from "../../layouts/RoleLayout";
import Button from "../../components/Button";
import BackButton from "../../components/BackButton";

const PRIVILEGED_ROLES = new Set(["admin", "facilitator"]);

/** Function that returns the Role component for handling role-based navigation. */
export default function Role() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && PRIVILEGED_ROLES.has(user.role)) {
            navigate("/admin-dashboard", { replace: true });
        } else if (user) {
            navigate("/join-session", { replace: true });
        }
    }, [user, navigate]);

    return (
        <RoleLayout>
            <BackButton to="/" />
            {user && PRIVILEGED_ROLES.has(user.role) ? (
                <>
                    <p style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                        Logged in as <strong>{user.name}</strong> ({user.role})
                    </p>
                    <Button text="Admin Dashboard" to="/admin-dashboard" />
                    <Button text="Scenario Builder" to="/scenario-builder" />
                    <Button text="Analytics" to="/analytics" />
                </>
            ) : (
                <>
                    {user && (
                        <p style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                            Logged in as <strong>{user.name}</strong>
                        </p>
                    )}
                    <Button text="Join Session" to="/join-session" />
                </>
            )}
            <Button text="Logout" onClick={logout} />
        </RoleLayout>
    );
}
