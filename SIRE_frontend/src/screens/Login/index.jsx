/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-31
 * Description: Login screen of the application.
 * Allows users to authenticate using their email and password, handles form state,
 * displays errors, and communicates with the backend API.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../services/api/api";
import FormLayout from "../../layouts/FormLayout";
import Button from "../../components/Button";
import BackButton from "../../components/BackButton";

/** Function that returns the Login component for handling user authentication by submitting credentials to the API. */
export default function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    /** Asynchronous function that handles the login form submission. */
    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const data = await login(email, password);
            localStorage.setItem("authToken", data.authToken);
            navigate("/role");
        } catch (error) {
            setError(error.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <FormLayout>

            {/** Back navigation. */}
            <BackButton to="/" />

            {/** Login form. */}
            <form className="login-form" onSubmit={handleLogin}>

                {/** Email input. */}
                <div className="form-group">
                    <label htmlFor="email">Email*</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email..."
                        required
                    />
                </div>

                {/** Password input. */}
                <div className="form-group">
                    <label htmlFor="password">Password*</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password..."
                        required
                    />
                </div>

                {/** Signup redirect. */}
                <div>
                    <p className="no-account-text">
                        Don&apos;t have an account? <Link to="/signup">Sign up here.</Link>
                    </p>
                </div>

                {/** Error message. */}
                {error && <div className="error">{error}</div>}

                <Button text={loading ? "Logging in..." : "Login"} type="submit" disabled={loading} />
            </form>

        </FormLayout>
    );
}
