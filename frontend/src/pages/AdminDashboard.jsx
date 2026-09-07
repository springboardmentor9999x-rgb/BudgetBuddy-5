import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import api from "../services/api";


function AdminDashboard() {
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState("");
    const [loading, setLoading] = useState(true);

    const loadDashboard = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                "/admin/analytics/full"
            );

            setData(response.data);

            if (
                !selectedUserId &&
                response.data?.user_analytics?.length
            ) {
                const firstNonAdmin =
                    response.data.user_analytics.find(
                        (item) => item.role !== "admin"
                    );

                setSelectedUserId(
                    String(
                        firstNonAdmin?.id ??
                        response.data.user_analytics[0].id
                    )
                );
            }
        } catch (error) {
            console.error(
                "Admin dashboard error:",
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
                "Unable to load admin dashboard"
            );
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadDashboard();
    }, []);


    const selectedUser = useMemo(() => {
        if (!data?.user_analytics) {
            return null;
        }

        return (
            data.user_analytics.find(
                (item) =>
                    String(item.id) ===
                    String(selectedUserId)
            ) || null
        );
    }, [data, selectedUserId]);


    if (loading) {
        return (
            <div
                style={{
                    padding: "40px",
                    textAlign: "center",
                    fontSize: "20px",
                }}
            >
                Loading Admin Dashboard...
            </div>
        );
    }


    if (!data) {
        return (
            <div
                style={{
                    padding: "40px",
                    textAlign: "center",
                }}
            >
                No dashboard data available.
            </div>
        );
    }


    const financial = data.financial || {};
    const users = data.users || {};
    const system = data.system || {};
    const monthly = data.monthly || [];
    const categories = data.expense_categories || [];
    const userAnalytics =
        data.user_analytics || [];


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
                    overflowX: "hidden",
                }}
            >
                <Navbar />

                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "15px",
                        marginBottom: "25px",
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <h1
                            style={{
                                margin: 0,
                                color: "#1e293b",
                            }}
                        >
                            🛡️ Admin Dashboard
                        </h1>

                        <p
                            style={{
                                marginTop: "8px",
                                marginBottom: 0,
                                color: "#64748b",
                            }}
                        >
                            Complete BudgetBuddy system-wide
                            financial overview.
                        </p>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                        }}
                    >
                        <button
                            onClick={() =>
                                navigate("/system-analytics")
                            }
                            style={secondaryButton}
                        >
                            📊 System Analytics
                        </button>

                        <button
                            onClick={() =>
                                navigate("/user-management")
                            }
                            style={primaryButton}
                        >
                            👥 User Management
                        </button>
                    </div>
                </div>


                {/* ================================================= */}
                {/* USER OVERVIEW */}
                {/* ================================================= */}

                <h2 style={sectionTitle}>
                    👥 User Overview
                </h2>

                <div style={cardGrid}>
                    <StatCard
                        title="Total Users"
                        value={users.total}
                        icon="👥"
                    />

                    <StatCard
                        title="Normal Users"
                        value={users.normal}
                        icon="👤"
                    />

                    <StatCard
                        title="Premium Users"
                        value={users.premium}
                        icon="⭐"
                    />

                    <StatCard
                        title="Administrators"
                        value={users.admins}
                        icon="🛡️"
                    />
                </div>


                {/* ================================================= */}
                {/* COMBINED FINANCIAL OVERVIEW */}
                {/* ================================================= */}

                <h2 style={sectionTitle}>
                    💰 Combined System Financial Overview
                </h2>

                <div style={cardGrid}>
                    <MoneyCard
                        title="Total Income"
                        value={financial.total_income}
                        icon="💵"
                        valueColor="#16a34a"
                    />

                    <MoneyCard
                        title="Total Expenses"
                        value={financial.total_expense}
                        icon="💸"
                        valueColor="#dc2626"
                    />

                    <MoneyCard
                        title="Total Savings"
                        value={financial.total_saved}
                        icon="🎯"
                        valueColor="#a855f7"
                    />

                    <MoneyCard
                        title="Net Balance"
                        value={financial.net_balance}
                        icon="💰"
                    />

                    <MoneyCard
                        title="Bank Balance"
                        value={financial.total_bank_balance}
                        icon="🏦"
                    />
                </div>


                {/* ================================================= */}
                {/* SYSTEM COUNTS */}
                {/* ================================================= */}

                <div style={cardGrid}>
                    <StatCard
                        title="Bank Accounts"
                        value={system.bank_accounts}
                        icon="🏦"
                    />

                    <StatCard
                        title="Budgets"
                        value={system.budgets}
                        icon="📊"
                    />

                    <StatCard
                        title="Savings Goals"
                        value={system.savings_goals}
                        icon="🎯"
                    />

                    <StatCard
                        title="Income Records"
                        value={system.income_records}
                        icon="💵"
                    />

                    <StatCard
                        title="Expense Records"
                        value={system.expense_records}
                        icon="💸"
                    />
                </div>


                {/* ================================================= */}
                {/* MONTHLY SYSTEM TREND */}
                {/* ================================================= */}

                <div style={chartCard}>
                    <h2 style={{ marginTop: 0 }}>
                        📈 Monthly System Financial Trend
                    </h2>

                    <p style={chartDescription}>
                        Combined income, expenses and savings
                        from all BudgetBuddy users.
                    </p>

                    <div
                        style={{
                            width: "100%",
                            height: "380px",
                        }}
                    >
                        {monthly.length > 0 ? (
                            <ResponsiveContainer>
                                <LineChart data={monthly}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis dataKey="label" />

                                    <YAxis />

                                    <Tooltip
                                        formatter={(
                                            value,
                                            name
                                        ) => [
                                            `₹${Number(
                                                value || 0
                                            ).toLocaleString(
                                                "en-IN"
                                            )}`,
                                            name,
                                        ]}
                                    />

                                    <Legend />

                                    <Line
                                        type="monotone"
                                        dataKey="income"
                                        name="Income"
                                        stroke="#16a34a"
                                        strokeWidth={3}
                                        dot={{ r: 4 }}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="expense"
                                        name="Expense"
                                        stroke="#dc2626"
                                        strokeWidth={3}
                                        dot={{ r: 4 }}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="savings"
                                        name="Savings"
                                        stroke="#a855f7"
                                        strokeWidth={3}
                                        dot={{ r: 4 }}
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
                    <h2 style={{ marginTop: 0 }}>
                        🥧 Combined Expense Distribution
                    </h2>

                    <p style={chartDescription}>
                        Expense categories across all users.
                    </p>

                    <div
                        style={{
                            width: "100%",
                            height: "380px",
                        }}
                    >
                        {categories.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={categories}
                                        dataKey="amount"
                                        nameKey="category"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={125}
                                        label
                                    >
                                        {categories.map(
                                            (entry, index) => (
                                                <Cell
                                                    key={
                                                        `expense-${index}`
                                                    }
                                                    fill={
                                                        expenseColors[
                                                            index %
                                                            expenseColors.length
                                                        ]
                                                    }
                                                />
                                            )
                                        )}
                                    </Pie>

                                    <Tooltip
                                        formatter={(
                                            value
                                        ) =>
                                            `₹${Number(
                                                value || 0
                                            ).toLocaleString(
                                                "en-IN"
                                            )}`
                                        }
                                    />

                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <EmptyChart />
                        )}
                    </div>
                </div>


                {/* ================================================= */}
                {/* SAVINGS GOALS */}
                {/* ================================================= */}

                <div style={chartCard}>
                    <h2 style={{ marginTop: 0 }}>
                        🎯 Combined Savings Goals
                    </h2>

                    <p style={chartDescription}>
                        Savings targets and current savings
                        from all users.
                    </p>

                    <div
                        style={{
                            width: "100%",
                            height: "380px",
                        }}
                    >
                        {data.savings_goals?.length > 0 ? (
                            <ResponsiveContainer>
                                <BarChart
                                    data={data.savings_goals.map(
                                        (goal) => ({
                                            name:
                                                `${goal.goal_name || "Goal"} (User ${goal.user_id})`,
                                            target:
                                                Number(
                                                    goal.target_amount ||
                                                    0
                                                ),
                                            saved:
                                                Number(
                                                    goal.current_amount ||
                                                    0
                                                ),
                                        })
                                    )}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                    />

                                    <XAxis
                                        dataKey="name"
                                    />

                                    <YAxis />

                                    <Tooltip
                                        formatter={(
                                            value,
                                            name
                                        ) => [
                                            `₹${Number(
                                                value || 0
                                            ).toLocaleString(
                                                "en-IN"
                                            )}`,
                                            name,
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
                {/* EVERY USER ANALYTICS */}
                {/* ================================================= */}

                <div style={chartCard}>
                    <h2 style={{ marginTop: 0 }}>
                        👤 Individual User Analytics
                    </h2>

                    <p style={chartDescription}>
                        Select a user to inspect that user's
                        complete financial analytics.
                    </p>

                    <select
                        value={selectedUserId}
                        onChange={(e) =>
                            setSelectedUserId(
                                e.target.value
                            )
                        }
                        style={userSelect}
                    >
                        <option value="">
                            Select a user
                        </option>

                        {userAnalytics.map((item) => (
                            <option
                                key={item.id}
                                value={item.id}
                            >
                                {item.username}
                                {" — "}
                                {item.plan === "admin"
                                    ? "Admin"
                                    : item.plan === "premium"
                                        ? "Premium"
                                        : "Normal"}
                            </option>
                        ))}
                    </select>
                </div>


                {selectedUser && (
                    <>
                        <div
                            style={{
                                background: "#eff6ff",
                                border: "1px solid #bfdbfe",
                                borderRadius: "12px",
                                padding: "18px",
                                marginBottom: "20px",
                            }}
                        >
                            <h3
                                style={{
                                    marginTop: 0,
                                    marginBottom: "6px",
                                }}
                            >
                                👤 {selectedUser.username}
                            </h3>

                            <div
                                style={{
                                    color: "#475569",
                                }}
                            >
                                {selectedUser.email}
                                {" • "}
                                {selectedUser.plan === "admin"
                                    ? "Administrator"
                                    : selectedUser.plan === "premium"
                                        ? "Premium User"
                                        : "Normal User"}
                            </div>
                        </div>

                        <div style={cardGrid}>
                            <MoneyCard
                                title="Income"
                                value={
                                    selectedUser.total_income
                                }
                                icon="💵"
                                valueColor="#16a34a"
                            />

                            <MoneyCard
                                title="Expenses"
                                value={
                                    selectedUser.total_expense
                                }
                                icon="💸"
                                valueColor="#dc2626"
                            />

                            <MoneyCard
                                title="Savings"
                                value={
                                    selectedUser.total_saved
                                }
                                icon="🎯"
                                valueColor="#a855f7"
                            />

                            <MoneyCard
                                title="Net Balance"
                                value={
                                    selectedUser.net_balance
                                }
                                icon="💰"
                            />

                            <MoneyCard
                                title="Bank Balance"
                                value={
                                    selectedUser.bank_balance
                                }
                                icon="🏦"
                            />
                        </div>


                        {/* SELECTED USER MONTHLY CHART */}

                        <div style={chartCard}>
                            <h2 style={{ marginTop: 0 }}>
                                📈 {selectedUser.username}'s
                                Monthly Trend
                            </h2>

                            <div
                                style={{
                                    width: "100%",
                                    height: "350px",
                                }}
                            >
                                {selectedUser.monthly?.length >
                                0 ? (
                                    <ResponsiveContainer>
                                        <LineChart
                                            data={
                                                selectedUser.monthly
                                            }
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                            />

                                            <XAxis
                                                dataKey="label"
                                            />

                                            <YAxis />

                                            <Tooltip
                                                formatter={(
                                                    value,
                                                    name
                                                ) => [
                                                    `₹${Number(
                                                        value || 0
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}`,
                                                    name,
                                                ]}
                                            />

                                            <Legend />

                                            <Line
                                                type="monotone"
                                                dataKey="income"
                                                name="Income"
                                                stroke="#16a34a"
                                                strokeWidth={3}
                                            />

                                            <Line
                                                type="monotone"
                                                dataKey="expense"
                                                name="Expense"
                                                stroke="#dc2626"
                                                strokeWidth={3}
                                            />

                                            <Line
                                                type="monotone"
                                                dataKey="savings"
                                                name="Savings"
                                                stroke="#a855f7"
                                                strokeWidth={3}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyChart />
                                )}
                            </div>
                        </div>


                        {/* SELECTED USER EXPENSE CATEGORIES */}

                        <div style={chartCard}>
                            <h2 style={{ marginTop: 0 }}>
                                🥧 {selectedUser.username}'s
                                Expense Distribution
                            </h2>

                            <div
                                style={{
                                    width: "100%",
                                    height: "350px",
                                }}
                            >
                                {selectedUser.expense_categories
                                    ?.length > 0 ? (
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={
                                                    selectedUser.expense_categories
                                                }
                                                dataKey="amount"
                                                nameKey="category"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={120}
                                                label
                                            >
                                                {selectedUser.expense_categories.map(
                                                    (
                                                        entry,
                                                        index
                                                    ) => (
                                                        <Cell
                                                            key={
                                                                `user-expense-${index}`
                                                            }
                                                            fill={
                                                                expenseColors[
                                                                    index %
                                                                    expenseColors.length
                                                                ]
                                                            }
                                                        />
                                                    )
                                                )}
                                            </Pie>

                                            <Tooltip
                                                formatter={(
                                                    value
                                                ) =>
                                                    `₹${Number(
                                                        value || 0
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}`
                                                }
                                            />

                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <EmptyChart />
                                )}
                            </div>
                        </div>


                        {/* SELECTED USER SAVINGS GOALS */}

                        <div style={chartCard}>
                            <h2 style={{ marginTop: 0 }}>
                                🎯 {selectedUser.username}'s
                                Savings Goals
                            </h2>

                            <div
                                style={{
                                    width: "100%",
                                    height: "350px",
                                }}
                            >
                                {selectedUser.savings_goals
                                    ?.length > 0 ? (
                                    <ResponsiveContainer>
                                        <BarChart
                                            data={
                                                selectedUser.savings_goals.map(
                                                    (goal) => ({
                                                        name:
                                                            goal.goal_name ||
                                                            "Goal",
                                                        target:
                                                            Number(
                                                                goal.target_amount ||
                                                                0
                                                            ),
                                                        saved:
                                                            Number(
                                                                goal.current_amount ||
                                                                0
                                                            ),
                                                    })
                                                )
                                            }
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                            />

                                            <XAxis
                                                dataKey="name"
                                            />

                                            <YAxis />

                                            <Tooltip
                                                formatter={(
                                                    value,
                                                    name
                                                ) => [
                                                    `₹${Number(
                                                        value || 0
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}`,
                                                    name,
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
                    </>
                )}


                {/* ================================================= */}
                {/* ALL USER FINANCIAL TABLE */}
                {/* ================================================= */}

                <div style={chartCard}>
                    <h2 style={{ marginTop: 0 }}>
                        👥 All Users Financial Overview
                    </h2>

                    <div
                        style={{
                            overflowX: "auto",
                        }}
                    >
                        <table
                            style={{
                                width: "100%",
                                minWidth: "900px",
                                borderCollapse: "collapse",
                            }}
                        >
                            <thead>
                                <tr
                                    style={{
                                        background: "#eff6ff",
                                    }}
                                >
                                    <th style={tableHead}>
                                        User
                                    </th>

                                    <th style={tableHead}>
                                        Plan
                                    </th>

                                    <th style={tableHead}>
                                        Income
                                    </th>

                                    <th style={tableHead}>
                                        Expense
                                    </th>

                                    <th style={tableHead}>
                                        Savings
                                    </th>

                                    <th style={tableHead}>
                                        Balance
                                    </th>

                                    <th style={tableHead}>
                                        Bank Balance
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {userAnalytics.map(
                                    (item) => (
                                        <tr
                                            key={item.id}
                                            style={{
                                                borderBottom:
                                                    "1px solid #e2e8f0",
                                            }}
                                        >
                                            <td style={tableCell}>
                                                <strong>
                                                    {
                                                        item.username
                                                    }
                                                </strong>
                                            </td>

                                            <td style={tableCell}>
                                                {item.plan ===
                                                "admin"
                                                    ? "Admin"
                                                    : item.plan ===
                                                        "premium"
                                                        ? "Premium"
                                                        : "Normal"}
                                            </td>

                                            <td
                                                style={{
                                                    ...tableCell,
                                                    color: "#16a34a",
                                                    fontWeight:
                                                        "600",
                                                }}
                                            >
                                                ₹
                                                {Number(
                                                    item.total_income ||
                                                    0
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}
                                            </td>

                                            <td
                                                style={{
                                                    ...tableCell,
                                                    color: "#dc2626",
                                                    fontWeight:
                                                        "600",
                                                }}
                                            >
                                                ₹
                                                {Number(
                                                    item.total_expense ||
                                                    0
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}
                                            </td>

                                            <td
                                                style={{
                                                    ...tableCell,
                                                    color: "#a855f7",
                                                    fontWeight:
                                                        "600",
                                                }}
                                            >
                                                ₹
                                                {Number(
                                                    item.total_saved ||
                                                    0
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}
                                            </td>

                                            <td style={tableCell}>
                                                ₹
                                                {Number(
                                                    item.net_balance ||
                                                    0
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}
                                            </td>

                                            <td style={tableCell}>
                                                ₹
                                                {Number(
                                                    item.bank_balance ||
                                                    0
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>


                {/* ================================================= */}
                {/* MODULE BUTTONS */}
                {/* ================================================= */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(260px, 1fr))",
                        gap: "20px",
                        marginTop: "25px",
                    }}
                >
                    <button
                        onClick={() =>
                            navigate("/system-analytics")
                        }
                        style={moduleButton}
                    >
                        <span
                            style={{
                                fontSize: "32px",
                            }}
                        >
                            📊
                        </span>

                        <strong>
                            System Analytics
                        </strong>

                        <span>
                            Open detailed system analytics
                        </span>
                    </button>

                    <button
                        onClick={() =>
                            navigate("/user-management")
                        }
                        style={moduleButton}
                    >
                        <span
                            style={{
                                fontSize: "32px",
                            }}
                        >
                            👥
                        </span>

                        <strong>
                            User Management
                        </strong>

                        <span>
                            Manage users and subscriptions
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}


// ==========================================================
// REUSABLE COMPONENTS
// ==========================================================

function StatCard({
    title,
    value,
    icon,
}) {
    return (
        <div style={statCard}>
            <div
                style={{
                    fontSize: "30px",
                }}
            >
                {icon}
            </div>

            <div
                style={{
                    color: "#64748b",
                    marginTop: "8px",
                }}
            >
                {title}
            </div>

            <div
                style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    marginTop: "5px",
                    color: "#1e293b",
                }}
            >
                {value ?? 0}
            </div>
        </div>
    );
}


function MoneyCard({
    title,
    value,
    icon,
    valueColor,
}) {
    return (
        <div style={statCard}>
            <div
                style={{
                    fontSize: "30px",
                }}
            >
                {icon}
            </div>

            <div
                style={{
                    color: "#64748b",
                    marginTop: "8px",
                }}
            >
                {title}
            </div>

            <div
                style={{
                    fontSize: "23px",
                    fontWeight: "bold",
                    marginTop: "5px",
                    color:
                        valueColor ||
                        "#1e293b",
                }}
            >
                ₹
                {Number(
                    value || 0
                ).toLocaleString(
                    "en-IN"
                )}
            </div>
        </div>
    );
}


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
            No data available.
        </div>
    );
}


// ==========================================================
// STYLES
// ==========================================================

const sectionTitle = {
    color: "#1e293b",
    marginTop: "25px",
    marginBottom: "15px",
};


const cardGrid = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "18px",
    marginBottom: "20px",
};


const statCard = {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow:
        "0 2px 10px rgba(0,0,0,0.06)",
};


const chartCard = {
    background: "white",
    padding: "22px",
    borderRadius: "12px",
    boxShadow:
        "0 2px 10px rgba(0,0,0,0.06)",
    marginBottom: "20px",
};


const chartDescription = {
    color: "#64748b",
    marginTop: "-8px",
    marginBottom: "15px",
};


const primaryButton = {
    border: "none",
    background: "#2563eb",
    color: "white",
    padding: "12px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
};


const secondaryButton = {
    border: "1px solid #2563eb",
    background: "white",
    color: "#2563eb",
    padding: "12px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
};


const moduleButton = {
    border: "none",
    background: "white",
    padding: "24px",
    borderRadius: "12px",
    boxShadow:
        "0 2px 10px rgba(0,0,0,0.08)",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    color: "#1e293b",
    fontSize: "16px",
};


const userSelect = {
    width: "100%",
    maxWidth: "500px",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "15px",
    background: "white",
};


const tableHead = {
    padding: "13px",
    textAlign: "left",
    color: "#1e293b",
    fontSize: "14px",
};


const tableCell = {
    padding: "13px",
    textAlign: "left",
    color: "#334155",
    fontSize: "14px",
};


export default AdminDashboard;
