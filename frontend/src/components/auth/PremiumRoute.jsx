import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function PremiumRoute({ children }) {

    const token = localStorage.getItem("token");

    if (!token) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    try {

        const decoded = jwtDecode(token);

        /*
         * Admin is allowed to access premium
         * functionality.
         */

        if (decoded.role === "admin") {
            return children;
        }


        /*
         * Normal users must have premium plan.
         */

        if (
            decoded.role === "user" &&
            decoded.plan === "premium"
        ) {
            return children;
        }


        /*
         * Normal-plan user.
         */

        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );

    } catch (error) {

        console.error(
            "Invalid token:",
            error
        );

        localStorage.removeItem("token");

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }
}

export default PremiumRoute;