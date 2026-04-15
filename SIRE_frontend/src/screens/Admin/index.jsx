/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-04-15
 * Description: Admin hub screen.
 * Central navigation point for all administrator and facilitator functions.
 */

import HomeLayout from "../../layouts/HomeLayout";
import Button from "../../components/Button";
import BackButton from "../../components/BackButton";
import HomeCarousel from "../../components/Carousel";

/** Function that returns the Admin component for rendering the admin hub page. */
export default function Admin() {
    return (
        <HomeLayout>
            {/** Back navigation to home. */}
            <BackButton to="/" />

            {/** Navigation button — create a new training session. */}
            <Button text="Create Session" to="/create-session" />

            {/** Navigation button — manage an active session. */}
            <Button text="Admin Dashboard" to="/admin-dashboard" />

            {/** Navigation button — scenario authoring and content engine. */}
            <Button text="Scenario Builder" to="/scenario-builder" />

            {/** Navigation button — program-level analytics and metrics dashboard. */}
            <Button text="Analytics" to="/analytics" />

            {/** Navigation button — ITSM and threat intel integrations. */}
            <Button text="Integrations" to="/integrations" />

            {/** Navigation button — persistent action-task tracker for improvement findings. */}
            <Button text="Action Tracker" to="/action-tracker" />

            {/** Main carousel content — rendered in the right panel by HomeLayout. */}
            <HomeCarousel />
        </HomeLayout>
    );
}
