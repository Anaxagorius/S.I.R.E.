/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-21
 * Description: Login screen of the application.
 * Allows users to authenticate using their email and password, handles form state,
 * displays errors, and communicates with the backend API.
 */

import { useState } from "react";
import { login } from "../../services/api/api";
import FormLayout from "../../layouts/FormLayout";
import Button from "../../components/Button";

/** Function that returns the Login component for handling user authentication by submitting credentials to the API. */
export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    /** Asynchronous function to handle login form submission. */
    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await login(email, password);
            // TODO: navigate to protected route or trigger app auth state
        } catch (error) {
            setError(error.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <FormLayout>
            <form className="login-form" onSubmit={handleLogin}>

                {/** Email input. */}
                <div className="form-group">
                    <label htmlFor="email">Email*</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={ (e) => setEmail(e.target.value) }
                        required
                        placeholder="Enter your email..."
                    />
                </div>

                {/** Password input. */}
                <div className="form-group">
                    <label htmlFor="password">Password*</label>
                    <input 
                        type="password"
                        id="password"
                        value={password}
                        onChange={ (e) => setPassword(e.target.value) }
                        required
                        placeholder="Enter your password..."/>
                </div>

                {/** Signup redirect. */}
                <div>
                    <p className="no-account-text">
                        Don&apos;t have an account? <a href="/signup">Sign up here</a>.
                    </p>
                </div>

                {/** Error message. */}
                {error && <div className="error">{error}</div>}

                {/** Submit button for the login form. */}
                <Button text={loading ? "Logging in..." : "Login"} type="submit"/>
            </form>
        </FormLayout>
    )
}
