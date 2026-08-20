import { useEffect, useState } from "react";
import api from "../../services/api";

function DashboardSummary() {

    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExpense, setTotalExpense] = useState(0);
    const [totalSavings, setTotalSavings] = useState(0);
    const [totalBalance, setTotalBalance] = useState(0);

    const loadSummary = async () => {

        try {

            const response = await api.get("/dashboard/summary");

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

            console.log(
                "Dashboard summary error:",
                error
            );

        }

    };


    useEffect(() => {

        loadSummary();

    }, []);


    return (

        <div
            style={{
                display: "grid",
                gridTemplateColumns:
                    "repeat(4, 1fr)",
                gap: "20px",
                marginTop: "25px",
                marginBottom: "30px",
            }}
        >

            {/* TOTAL INCOME */}

            <div
                style={{
                    background: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    boxShadow:
                        "0 2px 10px rgba(0,0,0,0.08)",
                }}
            >

                <p
                    style={{
                        color: "#666",
                        margin: 0,
                    }}
                >
                    Total Income
                </p>

                <h2
                    style={{
                        color: "#16a34a",
                        marginTop: "10px",
                    }}
                >
                    ₹ {totalIncome.toLocaleString("en-IN")}
                </h2>

            </div>


            {/* TOTAL EXPENSE */}

            <div
                style={{
                    background: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    boxShadow:
                        "0 2px 10px rgba(0,0,0,0.08)",
                }}
            >

                <p
                    style={{
                        color: "#666",
                        margin: 0,
                    }}
                >
                    Total Expense
                </p>

                <h2
                    style={{
                        color: "#dc2626",
                        marginTop: "10px",
                    }}
                >
                    ₹ {totalExpense.toLocaleString("en-IN")}
                </h2>

            </div>


            {/* TOTAL SAVINGS */}

            <div
                style={{
                    background: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    boxShadow:
                        "0 2px 10px rgba(0,0,0,0.08)",
                }}
            >

                <p
                    style={{
                        color: "#666",
                        margin: 0,
                    }}
                >
                    Total Savings
                </p>

                <h2
                    style={{
                        color: "#9333ea",
                        marginTop: "10px",
                    }}
                >
                    ₹ {totalSavings.toLocaleString("en-IN")}
                </h2>

            </div>


            {/* AVAILABLE BALANCE */}

            <div
                style={{
                    background: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    boxShadow:
                        "0 2px 10px rgba(0,0,0,0.08)",
                }}
            >

                <p
                    style={{
                        color: "#666",
                        margin: 0,
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
                    }}
                >
                    ₹ {totalBalance.toLocaleString("en-IN")}
                </h2>

            </div>

        </div>

    );
}

export default DashboardSummary;