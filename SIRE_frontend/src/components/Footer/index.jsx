/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-21
 * Description: Reusable footer component displayed across the application.
 */

import "./Footer.css";

/** Function that returns the Footer component at the bottom of the application. */
export default function Footer() {
    return (
        <footer className="app-footer">
            <p>&copy; {new Date().getFullYear()} Team Nibble - All rights reserved</p>
        </footer>
    );
}
