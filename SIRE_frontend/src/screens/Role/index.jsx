/** 
 * Author: Leon Wasiliew 
 * Last Update: 2026-03-21
 * Description: Role screen of the application.
 * Allows users to choose between Administrator and Trainee roles.
 * Based on the selected role, the user is directed to the appropriate workflow.
 */

import RoleLayout from "../../layouts/RoleLayout";
import Button from "../../components/Button";

/** Function that returns the Role component for handling role selection. */
export default function Role() {
    return (
        <RoleLayout>
            <Button text="Admin" to="/admin-dashboard" />
            <Button text="Trainee" to="/join-session" />
        </RoleLayout>
    );
}
