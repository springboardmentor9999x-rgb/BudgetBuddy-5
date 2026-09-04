import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function PremiumRoute({ children }) {

    const token = localStorage.getItem("token");

    // No token → login
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        const decoded = jwtDecode(token);

        // Premium features are available only to
        // users whose plan is premium.
        if (
            decoded.role !== "user" ||
            decoded.plan !== "premium"
        ) {
            return <Navigate to="/dashboard" replace />;
        }

        return children;

    } catch (error) {

        console.error("Invalid token:", error);

        localStorage.removeItem("token");

        return <Navigate to="/login" replace />;
    }
}

export default PremiumRoute;