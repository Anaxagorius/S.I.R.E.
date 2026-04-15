/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-04-14
 * Description: Defines all application routes using React Router.
 * Maps URL paths to their corresponding screen components.
 * Admin-only routes are wrapped with AdminRoute (requires admin or facilitator role).
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
import ScenarioBuilder from "../screens/ScenarioBuilder"
import Analytics from "../screens/Analytics"
import Onboarding from "../screens/Onboarding"
import ActionTracker from "../screens/ActionTracker"
import Integrations from "../screens/Integrations"
import HseepReport from "../screens/HseepReport"
import AdminRoute from "../components/AdminRoute"
import ProtectedRoute from "../components/ProtectedRoute"

/** Function that returns the AppRouter component for handling client-side routing. */
export default function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/role" element={<ProtectedRoute><Role /></ProtectedRoute>} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/join-session" element={<JoinSession />} />
            <Route path="/trainee-interface" element={<TraineeInterface />} />
            <Route path="/demo" element={<Demo />} />
            {/** Routes requiring admin or facilitator role. */}
            <Route path="/create-session" element={<AdminRoute><CreateSession /></AdminRoute>} />
            <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/scenario-builder" element={<AdminRoute><ScenarioBuilder /></AdminRoute>} />
            <Route path="/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
            <Route path="/action-tracker" element={<ActionTracker />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/hseep-report" element={<AdminRoute><HseepReport /></AdminRoute>} />
        </Routes>
    );
}
