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
            {/** Navigation button — sign in or create an account. */}
            <Button text="Login / Set Up" to="/login" />

            {/** Navigation button — admin hub for session management and tools. */}
            <Button text="Admin" to="/admin" />

            {/** Navigation button — join as a trainee. */}
            <Button text="Trainee" to="/join-session" />

            {/** Navigation button — demo mode button — runs entirely in the browser without a backend. */}
            <Button text="Demo" to="/demo" />

            {/** Main carousel content — rendered in the right panel by HomeLayout. */}
            <HomeCarousel />
        </HomeLayout>
    );
}
