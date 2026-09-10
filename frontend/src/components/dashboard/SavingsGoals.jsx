import { useEffect, useState } from "react";
import api from "../../services/api";

function SavingsGoals() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadSavingsGoals = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                "/dashboard/savings-goals"
            );

            setGoals(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );
        } catch (error) {
            console.error(
                "Savings goals error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSavingsGoals();
    }, []);

    if (loading) {
        return (
            <div
                style={{
                    background: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    boxShadow:
                        "0 2px 10px rgba(0,0,0,0.08)",
                }}
            >
                <h2>Savings Goals</h2>
                <p>Loading savings goals...</p>
            </div>
        );
    }

    return (
        <div
            style={{
                background: "white",
                padding: "25px",
                borderRadius: "12px",
                boxShadow:
                    "0 2px 10px rgba(0,0,0,0.08)",
                marginBottom: "30px",
            }}
        >
            <h2
                style={{
                    marginTop: 0,
                    marginBottom: "20px",
                }}
            >
                Savings Goals
            </h2>

            {goals.length === 0 ? (
                <p style={{ color: "#777" }}>
                    No savings goals created yet.
                </p>
            ) : (
                goals.map((goal) => {
                    const percentage = Math.min(
                        Number(goal.percentage || 0),
                        100
                    );

                    return (
                        <div
                            key={goal.id}
                            style={{
                                marginBottom: "22px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent:
                                        "space-between",
                                    alignItems:
                                        "center",
                                    marginBottom: "7px",
                                }}
                            >
                                <strong>
                                    {goal.goal_name}
                                </strong>

                                <span
                                    style={{
                                        color:
                                            goal.completed
                                                ? "#16a34a"
                                                : "#2563eb",
                                        fontWeight:
                                            "bold",
                                    }}
                                >
                                    {Number(
                                        goal.percentage ||
                                            0
                                    ).toFixed(1)}
                                    %
                                </span>
                            </div>

                            <div
                                style={{
                                    width: "100%",
                                    height: "10px",
                                    background:
                                        "#e5e7eb",
                                    borderRadius:
                                        "10px",
                                    overflow:
                                        "hidden",
                                    marginBottom:
                                        "8px",
                                }}
                            >
                                <div
                                    style={{
                                        width: `${percentage}%`,
                                        height: "100%",
                                        background:
                                            goal.completed
                                                ? "#16a34a"
                                                : "#2563eb",
                                        borderRadius:
                                            "10px",
                                    }}
                                />
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent:
                                        "space-between",
                                    fontSize:
                                        "14px",
                                    color: "#666",
                                }}
                            >
                                <span>
                                    ₹{" "}
                                    {Number(
                                        goal.current_amount ||
                                            0
                                    ).toLocaleString(
                                        "en-IN"
                                    )}{" "}
                                    saved
                                </span>

                                <span>
                                    Target: ₹{" "}
                                    {Number(
                                        goal.target_amount ||
                                            0
                                    ).toLocaleString(
                                        "en-IN"
                                    )}
                                </span>
                            </div>

                            {goal.completed ? (
                                <p
                                    style={{
                                        color:
                                            "#16a34a",
                                        fontWeight:
                                            "bold",
                                        marginTop:
                                            "7px",
                                        marginBottom:
                                            0,
                                    }}
                                >
                                    ✓ Goal completed
                                </p>
                            ) : (
                                <p
                                    style={{
                                        color:
                                            "#777",
                                        marginTop:
                                            "7px",
                                        marginBottom:
                                            0,
                                    }}
                                >
                                    ₹{" "}
                                    {Number(
                                        goal.remaining ||
                                            0
                                    ).toLocaleString(
                                        "en-IN"
                                    )}{" "}
                                    remaining
                                </p>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}

export default SavingsGoals;