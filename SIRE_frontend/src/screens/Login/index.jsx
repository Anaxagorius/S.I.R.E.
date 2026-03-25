/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-21
 * Description: Login screen of the application.
 * Allows users to authenticate using their email and password, handles form state,
 * displays errors, and communicates with the backend API.
 */

// NOTE: Authentication temporarily commented out for demo purposes.
// import { useState } from "react";
// import { Link } from "react-router-dom";
// import { login } from "../../services/api/api";
import { useNavigate } from "react-router-dom";
import FormLayout from "../../layouts/FormLayout";
import Button from "../../components/Button";

/** Function that returns the Login component for handling user authentication by submitting credentials to the API. */
export default function Login() {

    // NOTE: Authentication state commented out for demo purposes.
    // const [email, setEmail] = useState("");
    // const [password, setPassword] = useState("");
    // const [error, setError] = useState("");
    // const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // NOTE: Login handler commented out for demo purposes.
    // async function handleLogin(e) {
    //     e.preventDefault();
    //     setLoading(true);
    //     setError(null);
    //     try {
    //         await login(email, password);
    //         // TODO: navigate to protected route or trigger app auth state
    //     } catch (error) {
    //         setError(error.message || "Login failed");
    //     } finally {
    //         setLoading(false);
    //     }
    // }

    return (
        <FormLayout>

            {/** NOTE: Login form commented out for demo — authentication bypassed. */}
            {false && (
                <form className="login-form">

                    {/** Email input. */}
                    <div className="form-group">
                        <label htmlFor="email">Email*</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter your email..."
                        />
                    </div>

                    {/** Password input. */}
                    <div className="form-group">
                        <label htmlFor="password">Password*</label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Enter your password..."
                        />
                    </div>

                    {/** Signup redirect. */}
                    <div>
                        <p className="no-account-text">
                            Don&apos;t have an account? Sign up here.
                        </p>
                    </div>

                    <Button text="Login" type="submit"/>
                </form>
            )}

            {/** Bypass button — navigates directly to trainee interface for demo. */}
            <Button text="Enter as Trainee" onClick={() => navigate("/trainee-interface")} />

        </FormLayout>
    )
}
