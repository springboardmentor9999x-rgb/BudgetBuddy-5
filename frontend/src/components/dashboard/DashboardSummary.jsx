import { useEffect, useState } from "react";
import api from "../../services/api";

function DashboardSummary({ month, year }) {

    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);
    const [totalSavings, setTotalSavings] = useState(0);
    const [totalBalance, setTotalBalance] = useState(0);

    const loadSummary = async () => {

        try {

            let url = "/dashboard/summary";

            // Apply month/year filter only when provided
            if (month && year) {
                url += `?month=${month}&year=${year}`;
            }

            const response = await api.get(url);

            setTotalIncome(
                Number(response.data.total_income || 0)
            );

            setTotalExpense(
                Number(response.data.total_expense || 0)
            );

            setTotalSavings(
                Number(response.data.total_savings || 0)
            );

            setTotalBalance(
                Number(response.data.available_balance || 0)
            );

        } catch (error) {

            console.error(
                "Dashboard summary error:",
                error
            );

        }

    };


    useEffect(() => {

        loadSummary();

    }, [month, year]);


    return (

        <div
            style={{
                display: "grid",
                gridTemplateColumns:
                    "repeat(4, minmax(0, 1fr))",
                gap: "20px",
                marginTop: "25px",
                marginBottom: "30px",
            }}
        >

            {/* =========================================
                TOTAL INCOME
               ========================================= */}

            <div
                style={{
                    background: "#ffffff",
                    padding: "25px",
                    borderRadius: "12px",
                    boxShadow:
                        "0 2px 10px rgba(0,0,0,0.08)",
                    minHeight: "125px",
                    boxSizing: "border-box",
                }}
            >

                <p
                    style={{
                        color: "#666",
                        margin: 0,
                        fontSize: "16px",
                    }}
                >
                    Total Income
                </p>

                <h2
                    style={{
                        color: "#16a34a",
                        marginTop: "10px",
                        marginBottom: 0,
                        fontSize: "24px",
                    }}
                >
                    ₹ {totalIncome.toLocaleString("en-IN")}
                </h2>

            </div>


            {/* =========================================
                TOTAL EXPENSE
               ========================================= */}

            <div
                style={{
                    background: "#ffffff",
                    padding: "25px",
                    borderRadius: "12px",
                    boxShadow:
                        "0 2px 10px rgba(0,0,0,0.08)",
                    minHeight: "125px",
                    boxSizing: "border-box",
                }}
            >

                <p
                    style={{
                        color: "#666",
                        margin: 0,
                        fontSize: "16px",
                    }}
                >
                    Total Expense
                </p>

                <h2
                    style={{
                        color: "#dc2626",
                        marginTop: "10px",
                        marginBottom: 0,
                        fontSize: "24px",
                    }}
                >
                    ₹ {totalExpense.toLocaleString("en-IN")}
                </h2>

            </div>


            {/* =========================================
                TOTAL SAVINGS
               ========================================= */}

            <div
                style={{
                    background: "#ffffff",
                    padding: "25px",
                    borderRadius: "12px",
                    boxShadow:
                        "0 2px 10px rgba(0,0,0,0.08)",
                    minHeight: "125px",
                    boxSizing: "border-box",
                }}
            >

                <p
                    style={{
                        color: "#666",
                        margin: 0,
                        fontSize: "16px",
                    }}
                >
                    Total Savings
                </p>

                <h2
                    style={{
                        color: "#9333ea",
                        marginTop: "10px",
                        marginBottom: 0,
                        fontSize: "24px",
                    }}
                >
                    ₹ {totalSavings.toLocaleString("en-IN")}
                </h2>

            </div>


            {/* =========================================
                AVAILABLE BALANCE
               ========================================= */}

            <div
                style={{
                    background: "#ffffff",
                    padding: "25px",
                    borderRadius: "12px",
                    boxShadow:
                        "0 2px 10px rgba(0,0,0,0.08)",
                    minHeight: "125px",
                    boxSizing: "border-box",
                }}
            >

                <p
                    style={{
                        color: "#666",
                        margin: 0,
                        fontSize: "16px",
                    }}
                >
                    Available Balance
                </p>

                <h2
                    style={{
                        color:
                            totalBalance >= 0
                                ? "#2563eb"
                                : "#dc2626",
                        marginTop: "10px",
                        marginBottom: 0,
                        fontSize: "24px",
                    }}
                >
                    ₹ {totalBalance.toLocaleString("en-IN")}
                </h2>

            </div>


        </div>

    );
}

export default DashboardSummary;