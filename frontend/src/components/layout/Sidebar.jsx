import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";

function Sidebar() {

    const navigate = useNavigate();

    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    const handleLogout = () => {

        localStorage.removeItem("token");

        toast.success("Logged out successfully");

        setTimeout(() => {
            window.location.href = "/login";
        }, 500);
    };

    const handleCreateAccount = () => {

        navigate("/register");
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

                {/* DASHBOARD */}

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


                {/* INCOME */}

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


                {/* EXPENSES */}

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


                {/* BANK ACCOUNTS */}

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


                {/* BUDGET */}

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


                {/* SAVINGS GOALS */}

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


                {/* FUTURE MODULES */}

                <li style={{ marginBottom: "15px" }}>
                    📈 Reports
                </li>

                <li style={{ marginBottom: "15px" }}>
                    🔔 Notifications
                </li>


                {/* ADMIN ONLY */}

                {user?.role === "admin" && (

                    <li
                        style={{
                            marginTop: "30px",
                            paddingTop: "20px",
                            borderTop:
                                "1px solid rgba(255,255,255,0.3)",
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
                            🛡️ Admin Panel
                        </Link>
                    </li>

                )}


                {/* ACCOUNT SECTION */}

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


                <li
                    style={{
                        marginTop: "15px",
                        cursor: "pointer",
                    }}
                    onClick={handleCreateAccount}
                >
                    ➕ Create New Account
                </li>


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


            {/* LOGGED-IN USER */}

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

            </div>

        </div>
    );
}

export default Sidebar;