/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-23
 * Description: Layout component for the Trainee Interface.
 */

import Grid from "@mui/material/Grid";
import Footer from "../../components/Footer";
import About from "../../assets/images/About.png";
import "./TraineeInterfaceLayout.css";

/** Function that returns the TraineeInterfaceLayout component. */
export default function TraineeInterfaceLayout({ children, time }) {
    return (
        <Grid container spacing={0} className="trainee-container">

            {/** Left section (timer & information panel). */}
            <Grid size={{ xs: 12, sm: 3 }}>
                <div className="trainee-left">
                    <div className="left-content">
                        <img src={About} alt="S.I.R.E. Logo" />
                        <h3>Trainee Interface</h3>
                        <div className="timer-box">
                            <p>Time</p>
                            <h2>{time || "00:00"}</h2>
                        </div>
                    </div>
                </div>
            </Grid>

            {/** Right section (scenario content panel). */}
            <Grid size={{ xs: 12, sm: 9 }}>
                <div className="trainee-right">
                    <div className="trainee-content">
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
