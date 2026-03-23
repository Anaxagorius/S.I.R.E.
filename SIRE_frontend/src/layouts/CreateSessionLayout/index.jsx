/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-22
 * Description: Layout component for the Administrator session creation screen.
 * Provides structure for selecting scenarios, configuring session settings,
 * and generating a session key.
 */

import Grid from "@mui/material/Grid";
import Footer from "../../components/Footer";
import About from "../../assets/images/About.png";
import "./CreateSessionLayout.css";

/** Function that returns the CreateSessionLayout component that provides a consistent layout for the session creation interface. */
export default function CreateSessionLayout({ children }) {
    return (
        <Grid container spacing={0} className="create-session-container">

            {/** Left section (branding & context) */}
            <Grid size={{ xs: 12, sm: 4 }}>
                <div className="create-session-left">
                    <div className="left-content">
                        <img src={About} alt="S.I.R.E. Logo" />
                        <p className="subtitle">Simulated Incident Response Environment</p>
                        <div className="info-section">
                            <h3>Create a Session</h3>
                            <p>Select a scenario and generate a session key to allow trainees to join and participate in the simulation.</p>
                        </div>
                    </div>
                </div>
            </Grid>

            {/** Right section (main content) */}
            <Grid size={{ xs: 12, sm: 8 }}>
                <div className="create-session-right">
                    <div className="create-session-content">
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
