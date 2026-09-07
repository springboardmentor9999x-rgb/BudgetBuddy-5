import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import api from "../services/api";


function SystemAnalytics() {

    const navigate = useNavigate();
    const { user } = useAuth();

    const [summary, setSummary] = useState(null);
    const [monthly, setMonthly] = useState([]);
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState(null);
    const [savingsGoals, setSavingsGoals] = useState([]);

    const [loading, setLoading] = useState(true);


    // ==================================================
    // LOAD ANALYTICS
    // ==================================================

    const loadAnalytics = async () => {

        try {

            setLoading(true);

            const [
                summaryResponse,
                monthlyResponse,
                categoryResponse,
                usersResponse,
                savingsGoalsResponse
            ] = await Promise.all([

                api.get("/analytics/system"),

                api.get("/analytics/monthly"),

                api.get(
                    "/analytics/expense-categories"
                ),

                api.get("/analytics/users"),

                user?.role === "admin"
                    ? api.get("/admin/analytics/savings-goals")
                    : api.get("/savings-goals"),
            ]);


            setSummary(
                summaryResponse.data
            );

            setMonthly(
                monthlyResponse.data
            );

            setCategories(
                categoryResponse.data
            );

            setUsers(
                usersResponse.data
            );

            setSavingsGoals(
                Array.isArray(savingsGoalsResponse.data)
                    ? savingsGoalsResponse.data
                    : savingsGoalsResponse.data?.goals || []
            );

        } catch (error) {

            console.error(
                "Analytics error:",
                error
            );

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {

                toast.error(
                    "Admin access required"
                );

                navigate("/dashboard");

                return;
            }

            toast.error(
                error.response?.data?.detail ||
                "Unable to load system analytics"
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {

        loadAnalytics();

    }, []);


    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {

        return (

            <div
                style={{
                    padding: "40px",
                    fontSize: "20px",
                }}
            >
                Loading System Analytics...
            </div>
        );
    }


    if (!summary) {

        return (

            <div
                style={{
                    padding: "40px",
                }}
            >
                No analytics data available.
            </div>
        );
    }


    // ==================================================
    // MAIN PAGE
    // ==================================================

    return (

        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                background: "#f5f7fb",
            }}
        >

            <Sidebar />


            <div
                style={{
                    flex: 1,
                    padding: "20px",
                    boxSizing: "border-box",
                }}
            >

                <Navbar />


                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        alignItems: "center",
                        marginBottom: "25px",
                    }}
                >

                    <div>

                        <h1
                            style={{
                                marginBottom: "5px",
                            }}
                        >
                            📊 System Analytics
                        </h1>

                        <p
                            style={{
                                color: "#64748b",
                            }}
                        >
                            Overall financial and
                            user activity across
                            BudgetBuddy.
                        </p>

                    </div>


                    <button
                        onClick={loadAnalytics}
                        style={{
                            padding: "10px 18px",
                            border: "none",
                            borderRadius: "7px",
                            background:
                                "#2563eb",
                            color: "white",
                            cursor: "pointer",
                        }}
                    >
                        🔄 Refresh
                    </button>

                </div>


                {/* ================================================= */}
                {/* FINANCIAL CARDS */}
                {/* ================================================= */}

                <div style={cardGrid}>

                    <Card
                        title="Total Income"
                        value={
                            `₹${summary.financial.total_income.toLocaleString("en-IN")}`
                        }
                        icon="💰"
                    />

                    <Card
                        title="Total Expenses"
                        value={
                            `₹${summary.financial.total_expenses.toLocaleString("en-IN")}`
                        }
                        icon="💸"
                    />

                    <Card
                        title="Net Balance"
                        value={
                            `₹${summary.financial.net_balance.toLocaleString("en-IN")}`
                        }
                        icon="💵"
                    />

                    <Card
                        title="Total Savings"
                        value={
                            `₹${summary.financial.total_savings.toLocaleString("en-IN")}`
                        }
                        icon="🎯"
                    />

                </div>


                {/* ================================================= */}
                {/* MONTHLY INCOME VS EXPENSE */}
                {/* ================================================= */}

                <div style={chartCard}>

                    <h2>
                        📈 Monthly Income vs Expenses
                    </h2>

                    <div
                        style={{
                            width: "100%",
                            height: "350px",
                        }}
                    >

                        {monthly.length > 0 ? (

                            <ResponsiveContainer>

                                <BarChart
                                    data={monthly}
                                >

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis
                                        dataKey="month"
                                    />

                                    <YAxis />

                                    <Tooltip />

                                    <Legend />

                                    <Bar
                                        dataKey="income"
                                        name="Income"
                                        fill="#16a34a"
                                        stroke="#16a34a"
                                    />

                                    <Bar
                                        dataKey="expenses"
                                        name="Expenses"
                                        fill="#dc2626"
                                        stroke="#dc2626"
                                    />

                                </BarChart>

                            </ResponsiveContainer>

                        ) : (

                            <EmptyChart />

                        )}

                    </div>

                </div>


                {/* ================================================= */}
                {/* FINANCIAL TREND */}
                {/* ================================================= */}

                <div style={chartCard}>

                    <h2>
                        📊 Financial Trend
                    </h2>

                    <div
                        style={{
                            width: "100%",
                            height: "350px",
                        }}
                    >

                        {monthly.length > 0 ? (

                            <ResponsiveContainer>

                                <LineChart
                                    data={monthly}
                                >

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis
                                        dataKey="month"
                                    />

                                    <YAxis />

                                    <Tooltip />

                                    <Legend />

                                    <Line
                                        type="monotone"
                                        dataKey="income"
                                        name="Income"
                                        fill="#16a34a"
                                        stroke="#16a34a"
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="expenses"
                                        name="Expenses"
                                        fill="#dc2626"
                                        stroke="#dc2626"
                                    />

                                </LineChart>

                            </ResponsiveContainer>

                        ) : (

                            <EmptyChart />

                        )}

                    </div>

                </div>


                {/* ================================================= */}
                {/* EXPENSE CATEGORY */}
                {/* ================================================= */}

                <div style={chartCard}>

                    <h2>
                        🥧 Expense Distribution
                    </h2>

                    <div
                        style={{
                            width: "100%",
                            height: "350px",
                        }}
                    >

                        {categories.length > 0 ? (

                            <ResponsiveContainer>

                                <PieChart>

                                    <Pie
                                        data={
                                            categories
                                        }
                                        dataKey="amount"
                                        nameKey="category"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={
                                            120
                                        }
                                        label
                                    >

                                        {categories.map(
                                            (
                                                entry,
                                                index
                                            ) => (

                                                <Cell
                                                    key={
                                                        `cell-${index}`
                                                    }
                                                    fill={expenseColors[index % expenseColors.length]}
                                                />

                                            )
                                        )}

                                    </Pie>

                                    <Tooltip />

                                    <Legend />

                                </PieChart>

                            </ResponsiveContainer>

                        ) : (

                            <EmptyChart />

                        )}

                    </div>

                </div>


                {/* ================================================= */}
                {/* SAVINGS GOALS PROGRESS */}
                {/* ================================================= */}

                <div style={chartCard}>

                    <h2>
                        🎯 Savings Goals Progress
                    </h2>

                    <div
                        style={{
                            width: "100%",
                            height: "350px",
                        }}
                    >

                        {savingsGoals.length > 0 ? (

                            <ResponsiveContainer>

                                <BarChart
                                    data={savingsGoals.map((goal) => ({
                                        name: goal.goal_name || goal.name || goal.Goal || "Goal",
                                        target: Number(goal.target_amount ?? goal.target ?? goal.Target ?? 0),
                                        saved: Number(goal.current_amount ?? goal.saved ?? goal.Saved ?? 0),
                                    }))}
                                >

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis
                                        dataKey="name"
                                    />

                                    <YAxis />

                                    <Tooltip
                                        formatter={(value, name) => [
                                            `₹${Number(value || 0).toLocaleString("en-IN")}`,
                                            name === "saved" ? "Saved" : "Target"
                                        ]}
                                    />

                                    <Legend />

                                    <Bar
                                        dataKey="target"
                                        name="Target"
                                        fill="#ddd6fe"
                                    />

                                    <Bar
                                        dataKey="saved"
                                        name="Saved"
                                        fill="#a855f7"
                                    />

                                </BarChart>

                            </ResponsiveContainer>

                        ) : (

                            <EmptyChart />

                        )}

                    </div>

                </div>


                

                {/* ================================================= */}
                {/* SYSTEM ACTIVITY */}
                {/* ================================================= */}

                <h2
                    style={{
                        marginTop: "30px",
                    }}
                >
                    ⚙️System Activity
                </h2>


                <div style={cardGrid}>

                    <Card
                        title="Bank Accounts"
                        value={
                            summary.system.bank_accounts
                        }
                        icon="🏦"
                    />

                    <Card
                        title="Budgets"
                        value={
                            summary.system.budgets
                        }
                        icon="📊"
                    />

                    <Card
                        title="Savings Goals"
                        value={
                            summary.system.savings_goals
                        }
                        icon="🎯"
                    />

                </div>

            </div>

        </div>
    );
}


// ==========================================================
// CARD
// ==========================================================

function Card({
    title,
    value,
    icon,
}) {

    return (

        <div
            style={{
                background: "white",
                padding: "22px",
                borderRadius: "12px",
                boxShadow:
                    "0 2px 10px rgba(0,0,0,0.08)",
            }}
        >

            <div
                style={{
                    fontSize: "28px",
                }}
            >
                {icon}
            </div>

            <div
                style={{
                    marginTop: "8px",
                    color: "#64748b",
                }}
            >
                {title}
            </div>

            <div
                style={{
                    marginTop: "5px",
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#1e293b",
                }}
            >
                {value}
            </div>

        </div>
    );
}


// ==========================================================
// EMPTY CHART
// ==========================================================

function EmptyChart() {

    return (

        <div
            style={{
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#64748b",
            }}
        >
            No data available yet.
        </div>
    );
}


// ==========================================================
// STYLES
// ==========================================================

const cardGrid = {

    display: "grid",

    gridTemplateColumns:
        "repeat(auto-fit, minmax(200px, 1fr))",

    gap: "18px",

    marginBottom: "25px",
};


const expenseColors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
];


const chartCard = {

    background: "white",

    padding: "20px",

    borderRadius: "12px",

    boxShadow:
        "0 2px 10px rgba(0,0,0,0.08)",

    marginBottom: "25px",
};


export default SystemAnalytics;