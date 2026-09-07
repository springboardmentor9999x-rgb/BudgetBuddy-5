import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AdminRoute({ children }) {
    const { user, loading } = useAuth();

    // Wait until authentication is loaded
    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                }}
            >
                Loading...
            </div>
        );
    }

    // Not logged in
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Normal/Premium user trying to access admin page
    if (user.role !== "admin") {
        return <Navigate to="/dashboard" replace />;
    }

    // Admin is allowed
    return children;
}

export default AdminRoute;