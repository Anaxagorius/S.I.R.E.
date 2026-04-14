/**
 * Author: Leon Wasiliew
 * Last Update: 2026-04-14
 * Description: Layout component for the Scenario Builder screen.
 * Provides a two-panel layout: left branding/info panel and a full-height scrollable content area.
 */

import Grid from "@mui/material/Grid";
import About from "../../assets/images/About.png";
import "./ScenarioBuilderLayout.css";

/** Function that returns the ScenarioBuilderLayout component that wraps the scenario authoring interface. */
export default function ScenarioBuilderLayout({ children, scenarioTitle }) {
    return (
        <Grid container spacing={0} className="sb-container">

            {/** Left section (branding & context). */}
            <Grid size={{ xs: 12, sm: 3 }}>
                <div className="sb-left">
                    <div className="sb-left-content">
                        <img src={About} alt="S.I.R.E. Logo" />
                        <p className="sb-subtitle">Simulated Incident Response Environment</p>
                        <div className="sb-info">
                            <h3>Scenario Builder</h3>
                            <p>Create, customise, and preview training scenarios. Add timeline injects, branch decision trees, define objectives, and generate an exportable facilitator pack.</p>
                        </div>
                        {scenarioTitle && (
                            <div className="sb-scenario-label">
                                <span className="sb-scenario-label-prefix">Editing</span>
                                <span className="sb-scenario-label-name">{scenarioTitle}</span>
                            </div>
                        )}
                    </div>
                </div>
            </Grid>

            {/** Right section (builder content). */}
            <Grid size={{ xs: 12, sm: 9 }}>
                <div className="sb-right">
                    <div className="sb-content">
                        {children}
                    </div>
                </div>
            </Grid>

        </Grid>
    );
}
