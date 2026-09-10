import { useEffect, useState } from "react";
import api from "../../services/api";

function BudgetProgress({ month, year }) {
    const [budgetData, setBudgetData] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadBudgetProgress = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                "/dashboard/budget-progress",
                {
                    params: {
                        month,
                        year,
                    },
                }
            );

            setBudgetData(response.data);
        } catch (error) {
            console.error(
                "Budget progress error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBudgetProgress();
    }, [month, year]);

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
                <h2>Budget Progress</h2>
                <p>Loading budget...</p>
            </div>
        );
    }

    if (!budgetData) {
        return null;
    }

    const percentage = Math.min(
        Number(budgetData.percentage_used || 0),
        100
    );

    const progressColor =
        percentage >= 100
            ? "#dc2626"
            : percentage >= 80
            ? "#f59e0b"
            : "#16a34a";

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
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                }}
            >
                <h2 style={{ margin: 0 }}>
                    Budget Progress
                </h2>

                <span
                    style={{
                        color: progressColor,
                        fontWeight: "bold",
                    }}
                >
                    {Number(
                        budgetData.percentage_used || 0
                    ).toFixed(1)}
                    %
                </span>
            </div>

            {/* OVERALL PROGRESS */}
            <div
                style={{
                    marginBottom: "25px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        color: "#666",
                    }}
                >
                    <span>
                        Spent: ₹{" "}
                        {Number(
                            budgetData.total_spent || 0
                        ).toLocaleString("en-IN")}
                    </span>

                    <span>
                        Budget: ₹{" "}
                        {Number(
                            budgetData.total_budget || 0
                        ).toLocaleString("en-IN")}
                    </span>
                </div>

                <div
                    style={{
                        width: "100%",
                        height: "12px",
                        background: "#e5e7eb",
                        borderRadius: "10px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: `${percentage}%`,
                            height: "100%",
                            background: progressColor,
                            borderRadius: "10px",
                        }}
                    />
                </div>

                <p
                    style={{
                        marginTop: "10px",
                        color:
                            Number(
                                budgetData.remaining || 0
                            ) < 0
                                ? "#dc2626"
                                : "#16a34a",
                        fontWeight: "bold",
                    }}
                >
                    {Number(
                        budgetData.remaining || 0
                    ) >= 0
                        ? `₹ ${Number(
                              budgetData.remaining
                          ).toLocaleString(
                              "en-IN"
                          )} remaining`
                        : `₹ ${Math.abs(
                              Number(
                                  budgetData.remaining
                              )
                          ).toLocaleString(
                              "en-IN"
                          )} over budget`}
                </p>
            </div>

            {/* CATEGORY BUDGETS */}
            {budgetData.categories?.length === 0 ? (
                <p style={{ color: "#777" }}>
                    No budgets created for this month.
                </p>
            ) : (
                budgetData.categories.map(
                    (item, index) => {
                        const categoryPercentage =
                            Math.min(
                                Number(
                                    item.percentage_used ||
                                        0
                                ),
                                100
                            );

                        const categoryColor =
                            Number(
                                item.percentage_used ||
                                    0
                            ) >= 100
                                ? "#dc2626"
                                : Number(
                                      item.percentage_used ||
                                          0
                                  ) >= 80
                                ? "#f59e0b"
                                : "#16a34a";

                        return (
                            <div
                                key={
                                    `${item.category}-${index}`
                                }
                                style={{
                                    marginBottom:
                                        "18px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent:
                                            "space-between",
                                        marginBottom:
                                            "6px",
                                    }}
                                >
                                    <strong>
                                        {item.category}
                                    </strong>

                                    <span
                                        style={{
                                            color: "#666",
                                            fontSize:
                                                "14px",
                                        }}
                                    >
                                        ₹{" "}
                                        {Number(
                                            item.spent ||
                                                0
                                        ).toLocaleString(
                                            "en-IN"
                                        )}{" "}
                                        / ₹{" "}
                                        {Number(
                                            item.budget ||
                                                0
                                        ).toLocaleString(
                                            "en-IN"
                                        )}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        width: "100%",
                                        height: "8px",
                                        background:
                                            "#e5e7eb",
                                        borderRadius:
                                            "10px",
                                        overflow:
                                            "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${categoryPercentage}%`,
                                            height: "100%",
                                            background:
                                                categoryColor,
                                            borderRadius:
                                                "10px",
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    }
                )
            )}
        </div>
    );
}

export default BudgetProgress;