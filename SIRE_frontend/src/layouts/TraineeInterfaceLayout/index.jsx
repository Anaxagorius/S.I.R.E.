/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-04-01
 * Description: Layout component for the Trainee Interface.
 * Displays elapsed timer, running score, and recent correct decision history in the left panel.
 */

import Grid from "@mui/material/Grid";
import Footer from "../../components/Footer";
import About from "../../assets/images/About.png";
import "./TraineeInterfaceLayout.css";

/** Function that returns the TraineeInterfaceLayout component. */
export default function TraineeInterfaceLayout({ children, time, score, decisions, simTime }) {

    /** Show only the last 5 correct decisions in the history panel. */
    const recentCorrect = (decisions || []).filter((d) => d.isCorrect).slice(-5);

    return (
        <Grid container spacing={0} className="trainee-container">

            {/** Left section (timer, score, & information panel). */}
            <Grid size={{ xs: 12, sm: 3 }}>
                <div className="trainee-left">
                    <div className="left-content">
                        <img src={About} alt="S.I.R.E. Logo" />
                        <h3>Trainee Interface</h3>
                        <div className="timer-box">
                            <p>Real Time</p>
                            <h2>{time || "00:00"}</h2>
                        </div>

                        {/** Simulated incident timeline time (when available). */}
                        {simTime != null && (
                            <div className="timer-box" style={{ marginTop: "0.5rem", opacity: 0.75 }}>
                                <p style={{ fontSize: "0.75rem" }}>Incident T+</p>
                                <h2 style={{ fontSize: "1.4rem" }}>{simTime}</h2>
                            </div>
                        )}

                        {/** Live score display. */}
                        <div className="score-box">
                            <p>Score</p>
                            <div className="score-value">{score ?? 0}</div>
                        </div>

                        {/** Recent correct decision history (last 5). */}
                        {recentCorrect.length > 0 && (
                            <div className="history-box">
                                <p style={{ fontSize: "0.8rem", opacity: 0.7, marginBottom: "0.25rem" }}>
                                    Recent Decisions
                                </p>
                                {recentCorrect.map((d, i) => (
                                    <div key={i} className="history-item">
                                        ✅ {d.nodeTitle}
                                    </div>
                                ))}
                            </div>
                        )}
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
