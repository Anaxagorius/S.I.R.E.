/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-31
 * Description: Reusable back-navigation button component.
 * Navigates to a specific route when `to` is provided, otherwise goes back one step in the browser history.
 */

import { useNavigate } from "react-router-dom";
import "./BackButton.css";

/** Function that returns the BackButton component for navigating back a screen. */
export default function BackButton({ to }) {
    const navigate = useNavigate();

    return (
        <button
            className="back-btn"
            onClick={() => (to ? navigate(to) : navigate(-1))}
        >
            ← Back
        </button>
    );
}
