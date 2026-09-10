import { useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

import DashboardSummary from "../components/dashboard/DashboardSummary";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import IncomeExpenseChart from "../components/dashboard/IncomeExpenseChart";
import BudgetProgress from "../components/dashboard/BudgetProgress";
import SavingsGoals from "../components/dashboard/SavingsGoals";
import SpendingByCategory from "../components/dashboard/SpendingByCategory";
import TransactionTrend from "../components/dashboard/TransactionTrend";


function Dashboard() {

    const currentDate = new Date();

    const [month, setMonth] = useState(
        currentDate.getMonth() + 1
    );

    const [year, setYear] = useState(
        currentDate.getFullYear()
    );

    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];


    return (

        <div
            style={{
                minHeight: "100vh",
                background: "#f5f7fb",
            }}
        >

            {/* SIDEBAR */}

            <Sidebar />


            <main
                style={{
                    marginLeft: "250px",
                    minHeight: "100vh",
                    padding: "20px",
                    boxSizing: "border-box",
                }}
            >

                {/* NAVBAR */}

                <Navbar />


                {/* ==========================================
                    PAGE HEADER
                ========================================== */}

                <h1
                    style={{
                        marginTop: "20px",
                        marginBottom: "5px",
                    }}
                >
                    Dashboard
                </h1>

                <p
                    style={{
                        color: "#777",
                        marginTop: 0,
                        marginBottom: "20px",
                    }}
                >
                    Here's what's happening with your money.
                </p>


                {/* ==========================================
                    MONTH AND YEAR FILTER
                ========================================== */}

                <div
                    style={{
                        background: "white",
                        padding: "15px 20px",
                        borderRadius: "12px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.08)",
                        marginBottom: "20px",
                        display: "flex",
                        gap: "15px",
                        alignItems: "center",
                    }}
                >

                    <strong>
                        View:
                    </strong>


                    {/* MONTH */}

                    <select
                        value={month}
                        onChange={(e) =>
                            setMonth(
                                Number(e.target.value)
                            )
                        }
                        style={{
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid #ddd",
                            background: "white",
                            cursor: "pointer",
                        }}
                    >

                        {months.map(
                            (name, index) => (

                                <option
                                    key={index}
                                    value={index + 1}
                                >
                                    {name}
                                </option>

                            )
                        )}

                    </select>


                    {/* YEAR */}

                    <select
                        value={year}
                        onChange={(e) =>
                            setYear(
                                Number(e.target.value)
                            )
                        }
                        style={{
                            padding: "8px 12px",
                            borderRadius: "6px",
                            border: "1px solid #ddd",
                            background: "white",
                            cursor: "pointer",
                        }}
                    >

                        <option value={2026}>
                            2026
                        </option>

                        <option value={2025}>
                            2025
                        </option>

                        <option value={2024}>
                            2024
                        </option>

                    </select>

                </div>


                {/* ==========================================
                    SUMMARY CARDS
                ========================================== */}

                <DashboardSummary
                    month={month}
                    year={year}
                />


                {/* ==========================================
                    RECENT TRANSACTIONS
                ========================================== */}

                <RecentTransactions
                    month={month}
                    year={year}
                />


                {/* ==========================================
                    BUDGET PROGRESS
                ========================================== */}

                <BudgetProgress
                    month={month}
                    year={year}
                />


                {/* ==========================================
                    SAVINGS GOALS
                ========================================== */}

                <SavingsGoals />


                {/* ==========================================
                    BAR + DOUGHNUT CHARTS
                    SAME ROW
                ========================================== */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(2, minmax(0, 1fr))",
                        gap: "20px",
                        marginTop: "20px",
                    }}
                >

                    {/* BAR CHART */}

                    <IncomeExpenseChart
                        month={month}
                        year={year}
                    />


                    {/* DOUGHNUT CHART */}

                    <SpendingByCategory
                        month={month}
                        year={year}
                    />

                </div>


                {/* ==========================================
                    LINE GRAPH
                    BELOW BAR + DOUGHNUT
                ========================================== */}

                <div
                    style={{
                        marginTop: "20px",
                        marginBottom: "30px",
                    }}
                >

                    <TransactionTrend
                        month={month}
                        year={year}
                    />

                </div>

            </main>

        </div>

    );

}

export default Dashboard;