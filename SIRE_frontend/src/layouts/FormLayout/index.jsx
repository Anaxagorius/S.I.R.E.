/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-21
 * Description: Layout component used for authentication screens such as Login and Signup.
 * Provides a split-screen design with a branding panel on the left, a form content area on the right,
 * and a footer at the bottom.
 */

import Grid from "@mui/material/Grid";
import Footer from "../../components/Footer";
import "./FormLayout.css";

/** Function that returns the FormLayout component that wraps authentication forms in a consistent layout. */
export default function FormLayout({ children }) {
    return (
        <Grid container spacing={0} className="form-container">

            {/* Left section (branding & title). */}
            <Grid size={{ xs: 12, sm: 4 }}>
                <div className="form-left">
                    <div className="left-content">
                        <h1>S.I.R.E.</h1>
                        <p className="subtitle">Simulated Incident Response Environment</p>
                    </div>
                </div>
            </Grid>

            {/* Right section (form content). */}
            <Grid size={{ xs: 12, sm: 8 }}>
                <div className="form-right">
                    <div className="form-content">
                        <br/><br/><br/><br/><br/>
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
