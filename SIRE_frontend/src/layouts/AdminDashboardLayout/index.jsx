/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-04-15
 * Description: Layout component for the Administrator dashboard.
 * Provides a structural layout for managing session states including
 * waiting, active monitoring, and post-session review.
 * Includes sidebar navigation to all admin sections.
 */

import Grid from "@mui/material/Grid";
import { NavLink } from "react-router-dom";
import Footer from "../../components/Footer";
import About from "../../assets/images/About.png";
import "./AdminDashboardLayout.css";

/** Sidebar navigation items for the admin panel. */
const ADMIN_NAV = [
    { label: "Admin Hub",          to: "/admin" },
    { label: "Create Session",     to: "/create-session" },
    { label: "Banking Software",   to: "/banking" },
    { label: "Scenario Builder",   to: "/scenario-builder" },
    { label: "Analytics",          to: "/analytics" },
    { label: "Integrations",       to: "/integrations" },
    { label: "Action Tracker",     to: "/action-tracker" },
];

/** Function that returns the AdminDashboardLayout component that provides the layout wrapper for the administrator dashboard. */
export default function AdminDashboardLayout({ children }) {
    return (
        <Grid container spacing={0} className="admin-dashboard-container">

            {/** Left section (session info & controls panel). */}
            <Grid size={{ xs: 12, sm: 3 }}>
                <div className="admin-dashboard-left">
                    <div className="left-content">
                        <img src={About} alt="S.I.R.E. Logo" />
                        <h3>Administrator Panel</h3>
                    </div>

                    {/** Sidebar navigation to other admin sections. */}
                    <nav className="admin-sidebar-nav">
                        {ADMIN_NAV.map(({ label, to }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    "admin-sidebar-link" + (isActive ? " active" : "")
                                }
                            >
                                {label}
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </Grid>

            {/** Right section (dynamic content panel). */}
            <Grid size={{ xs: 12, sm: 9 }}>
                <div className="admin-dashboard-right">
                    <div className="admin-dashboard-content">
                        {children}
                    </div>
                </div>
            </Grid>

            {/* Footer section. */}
            <Grid size={{ xs: 12 }}>
                <div className="footer-container">
                    <Footer />
                </div>
            </Grid>
        </Grid>
    );
}
