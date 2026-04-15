/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-31
 * Description: Home screen of the application.
 * Displays the main landing page using the HomeLayout, including navigation buttons
 * and a carousel showcasing simulated incident scenarios.
 */

import HomeLayout from "../../layouts/HomeLayout";
import Button from "../../components/Button";
import HomeCarousel from "../../components/Carousel";

/** Function that returns the Home component for rendering the home page. */
export default function Home() {
    return (
        <HomeLayout>
            {/** Navigation button — join as a trainee. */}
            <Button text="Trainee" to="/join-session" />

            {/** Navigation button — admin login and session management. */}
            <Button text="Admin" to="/create-session" />

            {/** Navigation button — scenario authoring and content engine. */}
            <Button text="Scenario Builder" to="/scenario-builder" />

            {/** Navigation button — sign in or create an account. */}
            <Button text="Login / Sign Up" to="/login" />

            {/** Navigation button — demo mode button — runs entirely in the browser without a backend. */}
            <Button text="Demo" to="/demo" />

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
