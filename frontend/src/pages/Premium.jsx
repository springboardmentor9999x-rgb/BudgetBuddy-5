import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function Premium() {

    const navigate = useNavigate();

    const { user, loading, loadUser } = useAuth();

    const [upgrading, setUpgrading] = useState(false);

    // ------------------------------------------
    // LOADING
    // ------------------------------------------

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                }}
            >
                Loading...
            </div>
        );
    }

    // ------------------------------------------
    // NOT LOGGED IN
    // ------------------------------------------

    if (!user) {
        navigate("/login");
        return null;
    }

    // ------------------------------------------
    // ALREADY PREMIUM
    // ------------------------------------------

    if (user.plan === "premium") {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "#f5f7fb",
                    padding: "40px",
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        maxWidth: "700px",
                        margin: "80px auto",
                        background: "white",
                        padding: "50px",
                        borderRadius: "20px",
                        textAlign: "center",
                        boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
                    }}
                >
                    <div style={{ fontSize: "60px" }}>
                        👑
                    </div>

                    <h1
                        style={{
                            color: "#1E3A8A",
                            marginBottom: "15px",
                        }}
                    >
                        You are already a Premium User
                    </h1>

                    <p
                        style={{
                            color: "#64748b",
                            fontSize: "18px",
                        }}
                    >
                        You already have access to all premium
                        BudgetBuddy features.
                    </p>

                    <button
                        onClick={() => navigate("/dashboard")}
                        style={{
                            marginTop: "25px",
                            padding: "14px 30px",
                            background: "#2563eb",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "16px",
                            fontWeight: "bold",
                            cursor: "pointer",
                        }}
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // ------------------------------------------
    // UPGRADE
    // ------------------------------------------

    const handleUpgrade = async () => {

        if (upgrading) {
            return;
        }

        try {

            setUpgrading(true);

            const response = await api.post(
                "/auth/upgrade-premium"
            );

            console.log(
                "Premium upgrade:",
                response.data
            );

            // Reload user information
            await loadUser();

            toast.success(
                "Congratulations! You are now a Premium user."
            );

            setTimeout(() => {
                navigate("/dashboard");
            }, 1000);

        } catch (error) {

            console.error(
                "Premium upgrade error:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to upgrade to Premium."
            );

        } finally {

            setUpgrading(false);

        }
    };

    // ------------------------------------------
    // PREMIUM PAGE
    // ------------------------------------------

    return (

        <div
            style={{
                minHeight: "100vh",
                background: "#f5f7fb",
                padding: "30px",
                boxSizing: "border-box",
            }}
        >

            {/* BACK BUTTON */}

            <button
                onClick={() => navigate("/reports")}
                style={{
                    background: "#64748b",
                    color: "white",
                    border: "none",
                    padding: "10px 18px",
                    borderRadius: "7px",
                    cursor: "pointer",
                    fontSize: "14px",
                }}
            >
                ← Back to Reports
            </button>


            {/* MAIN CARD */}

            <div
                style={{
                    maxWidth: "900px",
                    margin: "35px auto",
                    background: "white",
                    borderRadius: "20px",
                    padding: "45px",
                    boxShadow:
                        "0 8px 30px rgba(0,0,0,0.10)",
                    textAlign: "center",
                }}
            >

                <div
                    style={{
                        fontSize: "65px",
                        marginBottom: "10px",
                    }}
                >
                    👑
                </div>

                <h1
                    style={{
                        color: "#1E3A8A",
                        fontSize: "38px",
                        marginBottom: "10px",
                    }}
                >
                    Upgrade to Premium
                </h1>

                <p
                    style={{
                        color: "#64748b",
                        fontSize: "18px",
                        marginBottom: "35px",
                    }}
                >
                    Get more powerful features and unlock
                    the full BudgetBuddy experience.
                </p>


                {/* FEATURES */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "18px",
                        marginBottom: "35px",
                    }}
                >

                    <div
                        style={{
                            padding: "22px",
                            background: "#eff6ff",
                            borderRadius: "12px",
                        }}
                    >
                        <div style={{ fontSize: "30px" }}>
                            📄
                        </div>

                        <h3>Download Reports</h3>

                        <p
                            style={{
                                color: "#64748b",
                            }}
                        >
                            Download financial reports
                            as PDF and Excel files.
                        </p>
                    </div>


                    <div
                        style={{
                            padding: "22px",
                            background: "#f0fdf4",
                            borderRadius: "12px",
                        }}
                    >
                        <div style={{ fontSize: "30px" }}>
                            📊
                        </div>

                        <h3>Advanced Reports</h3>

                        <p
                            style={{
                                color: "#64748b",
                            }}
                        >
                            Access detailed financial
                            analysis and reports.
                        </p>
                    </div>


                    <div
                        style={{
                            padding: "22px",
                            background: "#faf5ff",
                            borderRadius: "12px",
                        }}
                    >
                        <div style={{ fontSize: "30px" }}>
                            🎯
                        </div>

                        <h3>More Features</h3>

                        <p
                            style={{
                                color: "#64748b",
                            }}
                        >
                            Unlock premium features
                            across BudgetBuddy.
                        </p>
                    </div>

                </div>


                {/* UPGRADE BUTTON */}

                <button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    style={{
                        width: "100%",
                        maxWidth: "500px",
                        padding: "16px",
                        background: upgrading
                            ? "#94a3b8"
                            : "#2563eb",
                        color: "white",
                        border: "none",
                        borderRadius: "10px",
                        fontSize: "19px",
                        fontWeight: "bold",
                        cursor: upgrading
                            ? "not-allowed"
                            : "pointer",
                    }}
                >
                    {upgrading
                        ? "Upgrading..."
                        : "👑 Upgrade to Premium"}
                </button>


                <p
                    style={{
                        marginTop: "18px",
                        color: "#94a3b8",
                        fontSize: "13px",
                    }}
                >
                    Logged in as: {user.username}
                </p>

            </div>

        </div>
    );
}

export default Premium;