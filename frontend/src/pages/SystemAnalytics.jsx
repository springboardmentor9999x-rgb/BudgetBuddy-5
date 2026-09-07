import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { toast } from "react-toastify";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function SystemAnalytics() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadSystemDetails = async () => {
        try {
            setLoading(true);

            const response = await api.get("/admin/system-details");
            setData(response.data);
        } catch (error) {
            if (
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                toast.error("Admin access required");
                navigate("/dashboard", { replace: true });
                return;
            }

            toast.error(
                error.response?.data?.detail ||
                "Unable to load system details"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== "admin") {
                navigate("/dashboard", { replace: true });
                return;
            }

            loadSystemDetails();
        }
    }, [authLoading, user]);

    if (authLoading || loading) {
        return (
            <div style={{ padding: "40px", textAlign: "center", fontSize: "20px" }}>
                Loading System Details...
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ padding: "40px", textAlign: "center" }}>
                No system details available.
            </div>
        );
    }

    const users = data.users || {};
    const system = data.system || {};
    const security = data.security || {};

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

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "25px",
                        marginBottom: "25px",
                        gap: "15px",
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <h1 style={{ margin: 0 }}>
                            ⚙️ System Details
                        </h1>

                        <p style={{ color: "#64748b", marginTop: "7px" }}>
                            Administrative overview of BudgetBuddy system health,
                            users and module usage.
                        </p>
                    </div>

                    <button
                        onClick={loadSystemDetails}
                        style={refreshButton}
                    >
                        🔄 Refresh
                    </button>
                </div>

                <SectionTitle title="System Information" />

                <div style={grid}>
                    <InfoCard title="Application" value="BudgetBuddy" icon="💰" />
                    <InfoCard title="Architecture" value="React + FastAPI + PostgreSQL" icon="🏗️" />
                    <InfoCard title="Authentication" value="JWT Authentication" icon="🔐" />
                    <InfoCard title="Access Control" value="Role-Based Access" icon="🛡️" />
                    <InfoCard title="Admin Accounts" value={users.admins ?? 0} icon="👑" />
                    <InfoCard title="System Status" value="Operational" icon="🟢" />
                </div>

                <SectionTitle title="User Statistics" />

                <div style={grid}>
                    <StatCard title="Total Users" value={users.total} icon="👥" />
                    <StatCard title="Normal Users" value={users.normal} icon="👤" />
                    <StatCard title="Premium Users" value={users.premium} icon="⭐" />
                    <StatCard title="Verified Users" value={users.verified} icon="✅" />
                    <StatCard title="Unverified Users" value={users.unverified} icon="⚠️" />
                    <StatCard title="Premium Percentage" value={`${users.premium_percentage ?? 0}%`} icon="📈" />
                </div>

                <SectionTitle title="System Activity" />

                <div style={grid}>
                    <StatCard title="Bank Accounts" value={system.bank_accounts} icon="🏦" />
                    <StatCard title="Budgets" value={system.budgets} icon="📊" />
                    <StatCard title="Savings Goals" value={system.savings_goals} icon="🎯" />
                    <StatCard title="Income Records" value={system.income_records} icon="💵" />
                    <StatCard title="Expense Records" value={system.expense_records} icon="💸" />
                    <StatCard title="Savings Transactions" value={system.savings_transactions} icon="💎" />
                    <StatCard title="Notifications" value={system.notifications} icon="🔔" />
                    <StatCard title="Reports" value={system.reports} icon="📄" />
                </div>

                <SectionTitle title="Security Status" />

                <div style={securityGrid}>
                    <StatusRow
                        label="JWT Authentication"
                        value={security.jwt_authentication}
                    />
                    <StatusRow
                        label="Role-Based Access"
                        value={security.role_based_access}
                    />
                    <StatusRow
                        label="Admin Protection"
                        value={security.admin_protection}
                    />
                    <StatusRow
                        label="User Data Isolation"
                        value={security.user_data_isolation}
                    />
                    <StatusRow
                        label="Private Financial Data"
                        value={security.private_financial_data}
                    />
                </div>
            </div>
        </div>
    );
}

function SectionTitle({ title }) {
    return (
        <h2
            style={{
                marginTop: "28px",
                marginBottom: "15px",
                color: "#1e293b",
            }}
        >
            {title}
        </h2>
    );
}

function StatCard({ title, value, icon }) {
    return (
        <div style={card}>
            <div style={{ fontSize: "28px" }}>{icon}</div>
            <div style={{ marginTop: "8px", color: "#64748b" }}>
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
                {value ?? 0}
            </div>
        </div>
    );
}

function InfoCard({ title, value, icon }) {
    return <StatCard title={title} value={value} icon={icon} />;
}

function StatusRow({ label, value }) {
    return (
        <div
            style={{
                background: "white",
                padding: "16px 20px",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            <span style={{ fontWeight: "600", color: "#334155" }}>
                {label}
            </span>

            <span
                style={{
                    color: value ? "#16a34a" : "#dc2626",
                    fontWeight: "700",
                }}
            >
                {value ? "✓ Protected" : "✕ Check"}
            </span>
        </div>
    );
}

const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "18px",
};

const securityGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "15px",
};

const card = {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
};

const refreshButton = {
    padding: "10px 18px",
    border: "none",
    borderRadius: "7px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
};

export default SystemAnalytics;
