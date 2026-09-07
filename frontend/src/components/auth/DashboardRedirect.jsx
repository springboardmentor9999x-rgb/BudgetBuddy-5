import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function DashboardRedirect() {

    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {

        const decoded = jwtDecode(token);

        console.log("DashboardRedirect JWT:", decoded);

        /*
         * IMPORTANT:
         *
         * Every logged-in account first goes
         * to the normal Dashboard.
         *
         * Admin / premium permissions are handled
         * inside the application.
         */

        if (
            decoded.role === "admin" ||
            decoded.role === "user"
        ) {
            return <Navigate to="/dashboard" replace />;
        }

        localStorage.removeItem("token");

        return <Navigate to="/login" replace />;

    } catch (error) {

        console.error(
            "Invalid JWT:",
            error
        );

        localStorage.removeItem("token");

        return <Navigate to="/login" replace />;
    }
}

export default DashboardRedirect;