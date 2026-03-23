/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-21
 * Description: Layout component used for the Role screen.
 */

import React from "react";
import Grid from "@mui/material/Grid";
import Footer from "../../components/Footer";
import "./RoleLayout.css";

/** Function that returns the RoleLayout component for selecting user roles. */
export default function RoleLayout({ children }) {
    const [adminBtn, traineeBtn] = React.Children.toArray(children);

    return (
        <div>
            {/** Header section. */}
            <div>
                <h1>S.I.R.E.</h1>
                <h2>Select Your Role</h2>
            </div>

            {/** Role selection layout. */}
            <Grid container spacing={0} className="role-container">

                {/** Left section (Administrator role). */}
                <Grid size={{ xs: 12, sm: 6 }}>
                    <div className="role-left">
                        <div className="left-content">
                            {adminBtn}
                        </div>
                    </div>
                </Grid>

                {/** Right section (Trainee role). */}
                <Grid size={{ xs: 12, sm: 6 }}>
                    <div className="role-right">
                        <div className="left-content">
                            {traineeBtn}
                        </div>
                    </div>
                </Grid>
            </Grid>

            {/** Footer component. */}
            <Footer />
        </div>
    );
}
