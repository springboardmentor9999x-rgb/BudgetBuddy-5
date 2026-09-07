import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

function Sidebar() {
    const navigate = useNavigate();

    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {
        localStorage.removeItem("token");

        toast.success("Logged out successfully");

        setTimeout(() => {
            window.location.href = "/login";
        }, 500);
    };

    // ==========================================
    // CREATE NEW ACCOUNT
    // ==========================================

    const handleCreateAccount = () => {
        navigate("/register");
    };

    // ==========================================
    // PREMIUM PAGE
    // ==========================================

    const handlePremiumPage = () => {
        navigate("/premium");
    };

    return (
        <div
            style={{
                width: "250px",
                minHeight: "100vh",
                background: "#1E3A8A",
                color: "white",
                padding: "25px",
                boxSizing: "border-box",
            }}
        >
            {/* ==========================================
                LOGO
            ========================================== */}

            <h2
                style={{
                    marginBottom: "40px",
                }}
            >
                💰 BudgetBuddy
            </h2>

            <ul
                style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    fontSize: "18px",
                }}
            >

                {/* ==========================================
                    DASHBOARD
                ========================================== */}

                <li style={{ marginBottom: "15px" }}>
                    <Link
                        to="/dashboard"
                        style={{
                            color: "white",
                            textDecoration: "none",
                        }}
                    >
                        🏠 Dashboard
                    </Link>
                </li>

                {/* ==========================================
                    INCOME
                ========================================== */}

                <li style={{ marginBottom: "15px" }}>
                    <Link
                        to="/income"
                        style={{
                            color: "white",
                            textDecoration: "none",
                        }}
                    >
                        💵 Income
                    </Link>
                </li>

                {/* ==========================================
                    EXPENSES
                ========================================== */}

                <li style={{ marginBottom: "15px" }}>
                    <Link
                        to="/expenses"
                        style={{
                            color: "white",
                            textDecoration: "none",
                        }}
                    >
                        💸 Expenses
                    </Link>
                </li>

                {/* ==========================================
                    BANK ACCOUNTS
                ========================================== */}

                <li style={{ marginBottom: "15px" }}>
                    <Link
                        to="/banks"
                        style={{
                            color: "white",
                            textDecoration: "none",
                        }}
                    >
                        🏦 Bank Accounts
                    </Link>
                </li>

                {/* ==========================================
                    BUDGET
                ========================================== */}

                <li style={{ marginBottom: "15px" }}>
                    <Link
                        to="/budgets"
                        style={{
                            color: "white",
                            textDecoration: "none",
                        }}
                    >
                        📊 Budget
                    </Link>
                </li>

                {/* ==========================================
                    SAVINGS GOALS
                ========================================== */}

                <li style={{ marginBottom: "15px" }}>
                    <Link
                        to="/savings-goals"
                        style={{
                            color: "white",
                            textDecoration: "none",
                        }}
                    >
                        🎯 Savings Goals
                    </Link>
                </li>

                {/* ==========================================
                    REPORTS
                ========================================== */}

                <li style={{ marginBottom: "15px" }}>
                    <Link
                        to="/reports"
                        style={{
                            color: "white",
                            textDecoration: "none",
                        }}
                    >
                        📈 Reports
                    </Link>
                </li>

                {/* ==========================================
                    NOTIFICATIONS
                ========================================== */}

                <li style={{ marginBottom: "15px" }}>
                    <Link
                        to="/notifications"
                        style={{
                            color: "white",
                            textDecoration: "none",
                        }}
                    >
                        🔔 Notifications
                    </Link>
                </li>

                {/* ==========================================
                    USER MANAGEMENT
                    ADMIN ONLY
                ========================================== */}

                {user?.role === "admin" && (
                    <li
                        style={{
                            marginTop: "30px",
                            paddingTop: "20px",
                            borderTop:
                                "1px solid rgba(255,255,255,0.3)",
                            marginBottom: "15px",
                        }}
                    >
                        <Link
                            to="/user-management"
                            style={{
                                color: "white",
                                textDecoration: "none",
                                fontWeight: "bold",
                            }}
                        >
                            👥 User Management
                        </Link>
                    </li>
                )}

                {/* ==========================================
                    SYSTEM ANALYTICS
                    ADMIN ONLY
                ========================================== */}

                {user?.role === "admin" && (
                    <li
                        style={{
                            marginBottom: "15px",
                        }}
                    >
                        <Link
                            to="/system-analytics"
                            style={{
                                color: "#facc15",
                                textDecoration: "none",
                                fontWeight: "bold",
                            }}
                        >
                            📊 System Analytics
                        </Link>
                    </li>
                )}

                {/* ADMIN DASHBOARD - ADMIN ONLY */}
                {user?.role === "admin" && (
                    <li
                        style={{
                            marginBottom: "15px",
                        }}
                    >
                        <Link
                            to="/admin"
                            style={{
                                color: "#facc15",
                                textDecoration: "none",
                                fontWeight: "bold",
                            }}
                        >
                            🛡️ Admin Dashboard
                        </Link>
                    </li>
                )}

                {/* ==========================================
                    PREMIUM SUBSCRIPTION

                    ONLY NORMAL USERS WHO ARE NOT PREMIUM
                    ARE SHOWN THIS BUTTON.

                    IMPORTANT:
                    This DOES NOT upgrade the account.
                    It ONLY opens /premium.
                ========================================== */}

                {user?.role === "user" &&
                    user?.plan !== "premium" && (
                        <li
                            style={{
                                marginTop: "25px",
                                marginBottom: "20px",
                                paddingTop: "20px",
                                borderTop:
                                    "1px solid rgba(255,255,255,0.3)",
                            }}
                        >
                            <button
                                onClick={handlePremiumPage}
                                style={{
                                    width: "100%",
                                    padding: "12px 10px",
                                    border: "none",
                                    borderRadius: "8px",
                                    background: "#facc15",
                                    color: "#1e3a8a",
                                    fontWeight: "bold",
                                    fontSize: "15px",
                                    cursor: "pointer",
                                }}
                            >
                                👑 Upgrade to Premium
                            </button>
                        </li>
                    )}

                {/* ==========================================
                    ACCOUNT SECTION
                ========================================== */}

                <li
                    style={{
                        marginTop: "30px",
                        paddingTop: "20px",
                        borderTop:
                            "1px solid rgba(255,255,255,0.3)",
                    }}
                >
                    <Link
                        to="/profile"
                        style={{
                            color: "white",
                            textDecoration: "none",
                        }}
                    >
                        👤 My Profile
                    </Link>
                </li>

                {/* ==========================================
                    CREATE NEW ACCOUNT
                ========================================== */}

                <li
                    style={{
                        marginTop: "15px",
                        cursor: "pointer",
                    }}
                    onClick={handleCreateAccount}
                >
                    ➕ Create New Account
                </li>

                {/* ==========================================
                    LOGOUT
                ========================================== */}

                <li
                    style={{
                        marginTop: "15px",
                        cursor: "pointer",
                    }}
                    onClick={handleLogout}
                >
                    🚪 Logout
                </li>
            </ul>

            {/* ==========================================
                LOGGED-IN USER
            ========================================== */}

            <div
                style={{
                    marginTop: "40px",
                    paddingTop: "15px",
                    borderTop:
                        "1px solid rgba(255,255,255,0.3)",
                    fontSize: "14px",
                }}
            >
                <div>
                    👤 {user?.username}
                </div>

                <div
                    style={{
                        marginTop: "5px",
                        color: "#cbd5e1",
                        textTransform: "capitalize",
                    }}
                >
                    Role: {user?.role}
                </div>

                <div
                    style={{
                        marginTop: "5px",
                        color:
                            user?.plan === "premium"
                                ? "#facc15"
                                : "#cbd5e1",
                        textTransform: "capitalize",
                    }}
                >
                    Plan: {user?.plan}
                </div>
            </div>
        </div>
    );
}

export default Sidebar;