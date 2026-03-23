/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-22
 * Description: Layout component for the Join Session screen.
 * Uses a split-screen Grid layout with a branding panel on the left
 * and a session join interface on the right.
 */

import Grid from "@mui/material/Grid";
import Footer from "../../components/Footer";
import About from "../../assets/images/About.png";
import "./JoinSessionLayout.css";

/** Function that returns the JoinSessionLayout component for joining a session. */
export default function JoinSessionLayout({ children }) {
    return (
        <Grid container spacing={0} className="join-session-container">

            {/** Left section (branding & context). */}
            <Grid size={{ xs: 12, sm: 4 }}>
                <div className="join-session-left">
                    <div className="left-content">
                        <img src={About} alt="S.I.R.E. Logo" />
                        <p className="subtitle">Simulated Incident Response Environment</p>
                        <div className="info-section">
                            <h3>Join a Session</h3>
                            <p>Enter the session key provided by an administrator to join and participate in the simulation.</p>
                        </div>
                    </div>
                </div>
            </Grid>

            {/** Right section (main content). */}
            <Grid size={{ xs: 12, sm: 8 }}>
                <div className="join-session-right">
                    <div className="join-session-content">
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
