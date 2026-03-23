/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-21
 * Description: Reusable button component displayed across the application.
 */

import { useNavigate } from "react-router-dom";
import "./Button.css";

/** Function that returns the Button component that can trigger navigation or execute a custom action. */
export default function Button({ text, to, onClick, type = "button", ...rest }) {
    const navigate = useNavigate();

    /** Function that handles the button click event. */
    const handleClick = () => {
        if (to) navigate(to);
        if (onClick) onClick();
    };

    return (
        <button
        type={type}
        className="app-button"
        onClick={handleClick}
        {...rest}
        >
            {text}
        </button>
    );
}
