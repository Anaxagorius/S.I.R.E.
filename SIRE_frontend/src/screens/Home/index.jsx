/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-21
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
            <Button text="Login" to="/login" />

            {/** Navigation button. */}
            <Button text="Admin" to="/admin-dashboard" />

            {/** Main carousel content. */}
            <HomeCarousel />
        </HomeLayout>
    )
}
