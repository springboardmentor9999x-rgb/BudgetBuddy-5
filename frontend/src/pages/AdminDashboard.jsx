import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
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

    const [analytics, setAnalytics] = useState(null);
    const [systemDetails, setSystemDetails] = useState(null);
    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);

    // ==========================================================
    // LOAD ADMIN DASHBOARD
    // ==========================================================

    const loadDashboard = async () => {
        try {
            setLoading(true);

            const [analyticsResponse, systemResponse, usersResponse] =
                await Promise.all([
                    api.get("/admin/analytics"),
                    api.get("/admin/system-details"),
                    api.get("/admin/users"),
                ]);

            setAnalytics(analyticsResponse.data);
            setSystemDetails(systemResponse.data);

            if (Array.isArray(usersResponse.data)) {
                setUsers(usersResponse.data);
            } else {
                setUsers([]);
            }

        } catch (error) {
            console.error("Admin dashboard error:", error);

            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                toast.error("Admin access required");
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


    // ==========================================================
    // LOADING
    // ==========================================================

    if (loading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    background: "#f5f7fb",
                }}
            >
                <Sidebar />

                <main
                    style={{
                        marginLeft: "250px",
                        minHeight: "100vh",
                        padding: "20px",
                        boxSizing: "border-box",
                    }}
                >
                    <Navbar />

                    <div
                        style={{
                            padding: "60px",
                            textAlign: "center",
                            color: "#666",
                        }}
                    >
                        Loading admin dashboard...
                    </div>
                </main>
            </div>
        );
    }


    // ==========================================================
    // SAFE DATA
    // ==========================================================

    const userData = analytics?.users || {};
    const financialData = analytics?.financial || {};
    const systemData = analytics?.system || {};
    const percentageData = analytics?.percentages || {};

    const applicationData =
        systemDetails?.application || {};

    const securityData =
        systemDetails?.security || {};


    // ==========================================================
    // USER CHART
    // ==========================================================

    const userChartData = [
        {
            name: "Normal",
            value: Number(userData.normal || 0),
        },
        {
            name: "Premium",
            value: Number(userData.premium || 0),
        },
        {
            name: "Admins",
            value: Number(userData.admins || 0),
        },
    ];


    // ==========================================================
    // FINANCIAL CHART
    // ==========================================================

    const financialChartData = [
        {
            name: "Income",
            amount: Number(financialData.total_income || 0),
        },
        {
            name: "Expense",
            amount: Number(financialData.total_expense || 0),
        },
        {
            name: "Saved",
            amount: Number(financialData.total_saved || 0),
        },
    ];


    // ==========================================================
    // FORMAT MONEY
    // ==========================================================

    const formatMoney = (value) => {
        return `₹ ${Number(value || 0).toLocaleString("en-IN")}`;
    };


    // ==========================================================
    // CARD
    // ==========================================================

    const StatCard = ({
        title,
        value,
        subtitle,
        icon,
    }) => {
        return (
            <div
                style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "20px",
                    boxShadow:
                        "0 2px 10px rgba(0,0,0,0.08)",
                    flex: "1",
                    minWidth: "180px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div>
                        <p
                            style={{
                                margin: 0,
                                color: "#777",
                                fontSize: "14px",
                            }}
                        >
                            {title}
                        </p>

                        <h2
                            style={{
                                margin: "8px 0 5px",
                                fontSize: "25px",
                            }}
                        >
                            {value}
                        </h2>

                        {subtitle && (
                            <p
                                style={{
                                    margin: 0,
                                    color: "#999",
                                    fontSize: "12px",
                                }}
                            >
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <div
                        style={{
                            width: "45px",
                            height: "45px",
                            borderRadius: "10px",
                            background: "#eff6ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "22px",
                        }}
                    >
                        {icon}
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f5f7fb",
            }}
        >
            <Sidebar />

            <main
                style={{
                    marginLeft: "250px",
                    minHeight: "100vh",
                    padding: "20px",
                    boxSizing: "border-box",
                }}
            >
                <Navbar />

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div
                    style={{
                        marginTop: "20px",
                        marginBottom: "25px",
                    }}
                >
                    <h1
                        style={{
                            margin: 0,
                        }}
                    >
                        Admin Dashboard
                    </h1>

                    <p
                        style={{
                            color: "#777",
                            marginTop: "6px",
                        }}
                    >
                        Monitor BudgetBuddy users, finances and system activity.
                    </p>
                </div>


                {/* ==================================================
                    STAT CARDS
                ================================================== */}

                <div
                    style={{
                        display: "flex",
                        gap: "20px",
                        flexWrap: "wrap",
                        marginBottom: "25px",
                    }}
                >
                    <StatCard
                        title="Total Users"
                        value={userData.total || 0}
                        subtitle={`${userData.verified || 0} verified`}
                        icon="👥"
                    />

                    <StatCard
                        title="Premium Users"
                        value={userData.premium || 0}
                        subtitle={`${percentageData.premium_users || 0}% of users`}
                        icon="⭐"
                    />

                    <StatCard
                        title="Total Income"
                        value={formatMoney(financialData.total_income)}
                        subtitle="System total"
                        icon="💰"
                    />

                    <StatCard
                        title="Total Expense"
                        value={formatMoney(financialData.total_expense)}
                        subtitle="System total"
                        icon="💸"
                    />
                </div>


                {/* ==================================================
                    SECOND ROW
                ================================================== */}

                <div
                    style={{
                        display: "flex",
                        gap: "20px",
                        flexWrap: "wrap",
                        marginBottom: "25px",
                    }}
                >
                    <StatCard
                        title="Total Saved"
                        value={formatMoney(financialData.total_saved)}
                        subtitle="Savings transactions"
                        icon="🏦"
                    />

                    <StatCard
                        title="Net Balance"
                        value={formatMoney(financialData.net_balance)}
                        subtitle="Income - Expense"
                        icon="📊"
                    />

                    <StatCard
                        title="Bank Accounts"
                        value={systemData.bank_accounts || 0}
                        subtitle="Across all users"
                        icon="🏛️"
                    />

                    <StatCard
                        title="Budgets"
                        value={systemData.budgets || 0}
                        subtitle="Created budgets"
                        icon="📋"
                    />
                </div>


                {/* ==================================================
                    CHARTS
                ================================================== */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(350px, 1fr))",
                        gap: "25px",
                    }}
                >

                    {/* USER DISTRIBUTION */}

                    <div
                        style={{
                            background: "white",
                            padding: "25px",
                            borderRadius: "12px",
                            boxShadow:
                                "0 2px 10px rgba(0,0,0,0.08)",
                        }}
                    >
                        <h2
                            style={{
                                marginTop: 0,
                            }}
                        >
                            User Distribution
                        </h2>

                        <div
                            style={{
                                width: "100%",
                                height: "300px",
                            }}
                        >
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={userChartData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label
                                    >
                                        {userChartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={[
                                                    "#2563EB", // Blue - Normal
                                                    "#9333EA", // Purple - Premium
                                                    "#DC2626", // Red - Admin
                                                ][index]}
                                            />
                                        ))}
                                    </Pie>

                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>


                    {/* FINANCIAL OVERVIEW */}

                    <div
                        style={{
                            background: "white",
                            padding: "25px",
                            borderRadius: "12px",
                            boxShadow:
                                "0 2px 10px rgba(0,0,0,0.08)",
                        }}
                    >
                        <h2
                            style={{
                                marginTop: 0,
                            }}
                        >
                            Financial Overview
                        </h2>

                        <div
                            style={{
                                width: "100%",
                                height: "300px",
                            }}
                        >
                            <ResponsiveContainer>
                                <BarChart
                                    data={financialChartData}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />

                                    <XAxis dataKey="name" />

                                    <YAxis />

                                    <Tooltip
                                        formatter={(value) =>
                                            formatMoney(value)
                                        }
                                    />

                                    <Legend />

                                    <Bar
                                        dataKey="amount"
                                        name="Amount"
                                    >
                                        {financialChartData.map((entry, index) => (
                                            <Cell
                                                key={`bar-${index}`}
                                                fill={[
                                                    "#16A34A", // Green - Income
                                                    "#DC2626", // Red - Expense
                                                    "#9333EA", // Purple - Saved
                                                ][index]}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>


                {/* ==================================================
                    SYSTEM INFORMATION
                ================================================== */}

                <div
                    style={{
                        background: "white",
                        padding: "25px",
                        borderRadius: "12px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.08)",
                        marginTop: "25px",
                    }}
                >
                    <h2
                        style={{
                            marginTop: 0,
                        }}
                    >
                        System Information
                    </h2>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "15px",
                        }}
                    >
                        <InfoBox
                            title="Savings Goals"
                            value={systemData.savings_goals}
                        />

                        <InfoBox
                            title="Income Records"
                            value={systemData.income_records}
                        />

                        <InfoBox
                            title="Expense Records"
                            value={systemData.expense_records}
                        />

                        <InfoBox
                            title="Savings Transactions"
                            value={systemData.savings_transactions}
                        />

                        <InfoBox
                            title="Verified Users"
                            value={userData.verified}
                        />

                        <InfoBox
                            title="Unverified Users"
                            value={userData.unverified}
                        />
                    </div>
                </div>


                {/* ==================================================
                    APPLICATION STATUS
                ================================================== */}

                <div
                    style={{
                        background: "white",
                        padding: "25px",
                        borderRadius: "12px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.08)",
                        marginTop: "25px",
                    }}
                >
                    <h2
                        style={{
                            marginTop: 0,
                        }}
                    >
                        Application & Security
                    </h2>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(220px, 1fr))",
                            gap: "15px",
                        }}
                    >
                        <InfoBox
                            title="Application"
                            value={applicationData.name}
                        />

                        <InfoBox
                            title="Architecture"
                            value={applicationData.architecture}
                        />

                        <InfoBox
                            title="Authentication"
                            value={applicationData.authentication}
                        />

                        <InfoBox
                            title="Access Control"
                            value={applicationData.access_control}
                        />

                        <InfoBox
                            title="System Status"
                            value={applicationData.status}
                        />

                        <InfoBox
                            title="JWT Authentication"
                            value={
                                securityData.jwt_authentication
                                    ? "Enabled"
                                    : "Disabled"
                            }
                        />

                        <InfoBox
                            title="Role Based Access"
                            value={
                                securityData.role_based_access
                                    ? "Enabled"
                                    : "Disabled"
                            }
                        />

                        <InfoBox
                            title="Admin Protection"
                            value={
                                securityData.admin_protection
                                    ? "Enabled"
                                    : "Disabled"
                            }
                        />
                    </div>
                </div>


                {/* ==================================================
                    RECENT USERS
                ================================================== */}

                <div
                    style={{
                        background: "white",
                        padding: "25px",
                        borderRadius: "12px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.08)",
                        marginTop: "25px",
                        marginBottom: "30px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "15px",
                        }}
                    >
                        <h2
                            style={{
                                margin: 0,
                            }}
                        >
                            Users
                        </h2>

                        <span
                            style={{
                                color: "#777",
                                fontSize: "14px",
                            }}
                        >
                            {users.length} users
                        </span>
                    </div>

                    {users.length === 0 ? (
                        <p
                            style={{
                                color: "#777",
                            }}
                        >
                            No users found.
                        </p>
                    ) : (
                        <div
                            style={{
                                overflowX: "auto",
                            }}
                        >
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            background: "#f8fafc",
                                        }}
                                    >
                                        <th style={tableHeader}>
                                            ID
                                        </th>

                                        <th style={tableHeader}>
                                            Username
                                        </th>

                                        <th style={tableHeader}>
                                            Email
                                        </th>

                                        <th style={tableHeader}>
                                            Role
                                        </th>

                                        <th style={tableHeader}>
                                            Plan
                                        </th>

                                        <th style={tableHeader}>
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td style={tableCell}>
                                                {user.id}
                                            </td>

                                            <td style={tableCell}>
                                                {user.username}
                                            </td>

                                            <td style={tableCell}>
                                                {user.email}
                                            </td>

                                            <td style={tableCell}>
                                                {user.role}
                                            </td>

                                            <td style={tableCell}>
                                                {user.plan}
                                            </td>

                                            <td style={tableCell}>
                                                {user.verified
                                                    ? "Verified"
                                                    : "Unverified"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}


// ==========================================================
// INFO BOX
// ==========================================================

function InfoBox({ title, value }) {
    return (
        <div
            style={{
                padding: "15px",
                borderRadius: "8px",
                background: "#f8fafc",
                border: "1px solid #e5e7eb",
            }}
        >
            <p
                style={{
                    margin: 0,
                    color: "#777",
                    fontSize: "13px",
                }}
            >
                {title}
            </p>

            <p
                style={{
                    margin: "7px 0 0",
                    fontWeight: "600",
                    fontSize: "16px",
                }}
            >
                {value ?? 0}
            </p>
        </div>
    );
}


// ==========================================================
// TABLE STYLES
// ==========================================================

const tableHeader = {
    padding: "12px",
    textAlign: "left",
    borderBottom: "1px solid #ddd",
    fontSize: "13px",
    color: "#555",
};

const tableCell = {
    padding: "12px",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
};


export default AdminDashboard;