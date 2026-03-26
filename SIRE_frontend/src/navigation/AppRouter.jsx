/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-21
 * Description: Defines all application routes using React Router.
 * Maps URL paths to their corresponding screen components.
 */

import { Routes, Route } from "react-router-dom";
import Home from "../screens/Home"
import Signup from "../screens/Signup"
import Login from "../screens/Login"
import Role from "../screens/Role"
import CreateSession from "../screens/CreateSession"
import JoinSession from "../screens/JoinSession"
import AdminDashboard from "../screens/AdminDashboard"
import TraineeInterface from "../screens/TraineeInterface"
import Demo from "../screens/Demo"

/** Function that returns the AppRouter component for handling client-side routing. */
export default function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/role" element={<Role />} />
            <Route path="/create-session" element={<CreateSession />} />
            <Route path="/join-session" element={<JoinSession />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/trainee-interface" element={<TraineeInterface />} />
            <Route path="/demo" element={<Demo />} />
        </Routes>
    );
}
