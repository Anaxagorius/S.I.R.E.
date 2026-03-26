/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-25
 * Description: Home screen of the application.
 * Displays the main landing page using the HomeLayout, including a login button
 * and a carousel showcasing simulated incident scenarios.
 */

import HomeLayout from "../../layouts/HomeLayout";
import Button from "../../components/Button";
import HomeCarousel from "../../components/Carousel";

/** Function that returns the Home component for rendering the home page. */
export default function Home() {
    return (
        <HomeLayout>
            {/** Navigation button. */}
            <Button text="Trainee" to="/join-session" />

            {/** Navigation button. */}
            <Button text="Admin" to="/create-session" />

            {/** Demo mode button — runs entirely in the browser without a backend. */}
            <Button text="Demo" to="/demo" />

            {/** Main carousel content. */}
            <HomeCarousel />
        </HomeLayout>
    )
}
