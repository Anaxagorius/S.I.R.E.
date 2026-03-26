/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-21
 * Description: Layout component used for the Home screen, featuring a split-screen design.
 * The left panel displays branding, navigation, and application information,
 * while the right panel displays the carousel with images.
 */

import React from "react";
import Grid from "@mui/material/Grid";
import Footer from "../../components/Footer";
import About from "../../assets/images/About.png";
import "./HomeLayout.css";

/** Function that returns the HomeLayout component that structures the Home screen content. */
export default function HomeLayout({ children }) {
    const [loginBtn, adminBtn, demoBtn, carousel] = React.Children.toArray(children);

    return (
        <Grid container spacing={0} className="home-container">

            {/** Left section (branding and information panel). */}
            <Grid size={{ xs: 12, sm: 3 }}>
                <div className="home-left">
                    <div className="left-content">
                        <img src={About} alt="About Slide" />
                        {loginBtn}
                        {adminBtn}
                        {demoBtn}
                        <div className="about-section">
                            <h2>About S.I.R.E.</h2>
                            <hr />
                            <p>
                                The Simulated Incident Response Environment (S.I.R.E.) is a full stack JavaScript application designed to help Administrators guide Trainees through realistic emergency scenarios in an interactive environment.
                                As of now, these incidents include Fire Incident, Active Threat, Medical Emergency, and Structural Failure.
                                One Administrator will be able to create a session with up to 10 Trainees.
                            </p>
                        </div>
                    </div>
                    <Footer />
                </div>
            </Grid>

            {/* Right section (main content & carousel). */}
            <Grid size={{ xs: 12, sm: 9 }}>
                <div className="home-right">
                    {carousel}
                </div>
            </Grid>
        </Grid>
    );
}
