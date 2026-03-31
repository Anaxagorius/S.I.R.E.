/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-21
 * Description: Signup screen of the application.
 * Allows the user to create a new account by entering the required credentials.
 * Performs client-side validation and communicates with the backend API.
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../../services/api/api";
import FormLayout from "../../layouts/FormLayout";
import Button from "../../components/Button";
import BackButton from "../../components/BackButton";

/** Function that returns the Signup component for handling user registration, and API communication. */
export default function Signup() {

    /** Constants for form state management. */
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [ok, setOk] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    /** Asynchronous function to handle signup form submission. */
    async function handleSignup(e) {
        e.preventDefault();
        setError("");
        setOk("");

        if (!username || !email || !password || !confirmPassword) {
            setError("ERROR: All fields are required!");
            return;
        }
        if (password.length < 8) {
            setError("ERROR: Password must be at least 8 characters long!");
            return;
        }
        if (password !== confirmPassword) {
            setError("ERROR: Passwords do not match!");
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError("ERROR: Invalid email format!");
            return;
        }

        setLoading(true);
        try {
            await signup(email, password, username);
            setOk("Account created. Please log in.");
            navigate("/login");
        } catch (error) {
            setError(error.message || "Signup failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <FormLayout>
            <BackButton to="/login" />
            <form className="signup-form" onSubmit={handleSignup}>

                {/** Username input. */}
                <div className="form-group">
                    <label htmlFor="username">Username*</label>
                    <input 
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        placeholder="Enter your username..."/>
                </div>

                {/** Email input. */}
                <div className="form-group">
                    <label htmlFor="email">Email*</label>
                    <input 
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your email..."/>
                </div>

                {/** Password input. */}
                <div className="form-group">
                    <label htmlFor="password">Password*</label>
                    <input 
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password..."/>
                </div>

                {/* Confirm password input. */}
                <div className="form-group">
                    <label htmlFor="confirm-password">Confirm Password*</label>
                    <input 
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Confirm your password..."/>
                </div>

                {/* Login redirect. */}
                <div className="form-group">
                    <p>Already have an account? <Link to="/login">Login here</Link></p>
                </div>

                {/* Error message. */}
                {error && <div className="error">{error}</div>}

                {/* Success message. */}
                {ok && <div className="success">{ok}</div>}

                {/* Submit button for the signup form.*/}
                <Button text={loading ? "Creating account..." : "Signup"} type="submit"/>
            </form>
        </FormLayout>
    )
}
