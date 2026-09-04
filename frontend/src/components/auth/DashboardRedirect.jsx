import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function DashboardRedirect() {

    const token = localStorage.getItem("token");

    // No token
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {

        const decoded = jwtDecode(token);

        console.log("Dashboard redirect:", decoded);

        const role = decoded.role;
        const plan = decoded.plan;

        // ------------------------------------------------
        // EVERY VALID ACCOUNT GOES TO NORMAL DASHBOARD
        // ------------------------------------------------

        if (
            role === "admin" ||
            role === "user"
        ) {
            return <Navigate to="/dashboard" replace />;
        }

        // ------------------------------------------------
        // Invalid account
        // ------------------------------------------------

        localStorage.removeItem("token");

        return <Navigate to="/login" replace />;

    } catch (error) {

        console.error(
            "Invalid token:",
            error
        );

        localStorage.removeItem("token");

        return <Navigate to="/login" replace />;
    }
}

export default DashboardRedirect;