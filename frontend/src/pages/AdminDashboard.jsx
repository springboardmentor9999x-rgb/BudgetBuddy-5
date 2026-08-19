import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";

function AdminDashboard() {
    
    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState({
        total_users: 0,
        total_admins: 0,
        normal_users: 0,
    });

    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);

    const [selectedUser, setSelectedUser] = useState(null);

    const [showDetails, setShowDetails] = useState(false);

    const [showCreateUser, setShowCreateUser] = useState(false);

    const [newUser, setNewUser] = useState({
        username: "",
        email: "",
        password: "",
    });


    // ==========================================
    // LOAD ADMIN DASHBOARD
    // ==========================================

    const loadDashboard = async () => {

        try {

            const response = await api.get(
                "/admin/dashboard"
            );

            setDashboard(response.data);

        } catch (error) {

            toast.error(
                error.response?.data?.detail ||
                "Failed to load dashboard"
            );

        }

    };


    // ==========================================
    // LOAD ALL USERS
    // ==========================================

    const loadUsers = async () => {

        try {

            const response = await api.get(
                "/admin/users"
            );

            setUsers(response.data);

        } catch (error) {

            toast.error(
                error.response?.data?.detail ||
                "Failed to load users"
            );

        }

    };


    // ==========================================
    // LOAD DATA ON PAGE OPEN
    // ==========================================

    useEffect(() => {

        const loadData = async () => {

            setLoading(true);

            await Promise.all([
                loadDashboard(),
                loadUsers(),
            ]);

            setLoading(false);

        };

        loadData();

    }, []);


    // ==========================================
    // VIEW USER DETAILS
    // ==========================================

    const handleViewUser = async (userId) => {

        try {

            const response = await api.get(
                `/admin/users/${userId}`
            );

            setSelectedUser(response.data);

            setShowDetails(true);

        } catch (error) {

            toast.error(
                error.response?.data?.detail ||
                "Failed to load user details"
            );

        }

    };


    // ==========================================
    // DELETE USER
    // ==========================================

    const handleDeleteUser = async (
        userId,
        username
    ) => {

        const confirmDelete = window.confirm(
            `Are you sure you want to delete ${username}?\n\nThis will permanently delete the user and their related data.`
        );

        if (!confirmDelete) {
            return;
        }

        try {

            await api.delete(
                `/admin/users/${userId}`
            );

            toast.success(
                `${username} deleted successfully`
            );

            await loadDashboard();

            await loadUsers();

        } catch (error) {

            toast.error(
                error.response?.data?.detail ||
                "Failed to delete user"
            );

        }

    };


    // ==========================================
    // CREATE USER
    // ==========================================

    const handleCreateUser = async (e) => {

        e.preventDefault();

        if (
            !newUser.username ||
            !newUser.email ||
            !newUser.password
        ) {
            toast.error(
                "Please fill all fields"
            );

            return;
        }

        try {

            await api.post(
                "/admin/users",
                newUser
            );

            toast.success(
                "New user created successfully"
            );

            setNewUser({
                username: "",
                email: "",
                password: "",
            });

            setShowCreateUser(false);

            await loadDashboard();

            await loadUsers();

        } catch (error) {

            toast.error(
                error.response?.data?.detail ||
                "Failed to create user"
            );

        }

    };


    // ==========================================
    // DATE FORMAT
    // ==========================================

    const formatDate = (date) => {

        if (!date) {
            return "Not available";
        }

        return new Date(
            date
        ).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );

    };


    if (loading) {

        return (

            <div
                style={{
                    padding: "40px",
                    fontSize: "20px",
                }}
            >
                Loading Admin Dashboard...
            </div>

        );

    }


    return (

        <div
            style={{
                padding: "30px",
                width: "100%",
                boxSizing: "border-box",
            }}
        >

            {/* ================================= */}
            {/* HEADER */}
            {/* ================================= */}

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "30px",
                }}
            >

                <div>

                    <h1
                        style={{
                            margin: 0,
                        }}
                    >
                        🛡️ Admin Dashboard
                    </h1>

                    <p
                        style={{
                            color: "#64748b",
                        }}
                    >
                        Manage BudgetBuddy users and accounts
                    </p>

                </div>

                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                    }}
                >
                    {/* BACK BUTTON */}
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            padding: "12px 20px",
                            background: "#64748b",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "15px",
                            fontWeight: "bold",
                        }}
                    >
                        ← Back
                    </button>


                    {/* CREATE USER BUTTON */}
                    <button
                        onClick={() =>
                            setShowCreateUser(true)
                        }
                        style={{
                            padding: "12px 20px",
                            background: "#2563eb",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "15px",
                            fontWeight: "bold",
                        }}
                    >
                        ➕ Create New User
                    </button>
                </div>


            </div>


            {/* ================================= */}
            {/* SUMMARY CARDS */}
            {/* ================================= */}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(3, 1fr)",
                    gap: "25px",
                    marginBottom: "35px",
                }}
            >

                <div
                    style={{
                        background: "white",
                        padding: "25px",
                        borderRadius: "15px",
                        boxShadow:
                            "0 4px 15px rgba(0,0,0,0.08)",
                    }}
                >

                    <div
                        style={{
                            color: "#64748b",
                        }}
                    >
                        Total Users
                    </div>

                    <h2
                        style={{
                            marginBottom: 0,
                        }}
                    >
                        {dashboard.total_users}
                    </h2>

                </div>


                <div
                    style={{
                        background: "white",
                        padding: "25px",
                        borderRadius: "15px",
                        boxShadow:
                            "0 4px 15px rgba(0,0,0,0.08)",
                    }}
                >

                    <div
                        style={{
                            color: "#64748b",
                        }}
                    >
                        Total Admins
                    </div>

                    <h2
                        style={{
                            marginBottom: 0,
                        }}
                    >
                        {dashboard.total_admins}
                    </h2>

                </div>


                <div
                    style={{
                        background: "white",
                        padding: "25px",
                        borderRadius: "15px",
                        boxShadow:
                            "0 4px 15px rgba(0,0,0,0.08)",
                    }}
                >

                    <div
                        style={{
                            color: "#64748b",
                        }}
                    >
                        Normal Users
                    </div>

                    <h2
                        style={{
                            marginBottom: 0,
                        }}
                    >
                        {dashboard.normal_users}
                    </h2>

                </div>

            </div>


            {/* ================================= */}
            {/* USERS TABLE */}
            {/* ================================= */}

            <div
                style={{
                    background: "white",
                    borderRadius: "15px",
                    padding: "25px",
                    boxShadow:
                        "0 4px 15px rgba(0,0,0,0.08)",
                    overflowX: "auto",
                }}
            >

                <h2>
                    All User Accounts
                </h2>


                <table
                    style={{
                        width: "100%",
                        borderCollapse:
                            "collapse",
                        minWidth:
                            "1100px",
                    }}
                >

                    <thead>

                        <tr
                            style={{
                                background:
                                    "#f1f5f9",
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
                                Verified
                            </th>

                            <th style={tableHeader}>
                                Created On
                            </th>

                            <th style={tableHeader}>
                                Total Income
                            </th>

                            <th style={tableHeader}>
                                Total Expense
                            </th>

                            <th style={tableHeader}>
                                Banks
                            </th>

                            <th style={tableHeader}>
                                Budgets
                            </th>

                            <th style={tableHeader}>
                                Savings Goals
                            </th>

                            <th style={tableHeader}>
                                Actions
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {users.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="12"
                                    style={{
                                        padding:
                                            "30px",
                                        textAlign:
                                            "center",
                                    }}
                                >
                                    No users found
                                </td>

                            </tr>

                        ) : (

                            users.map((user) => (

                                <tr
                                    key={user.id}
                                    style={{
                                        borderBottom:
                                            "1px solid #e2e8f0",
                                    }}
                                >

                                    <td style={tableCell}>
                                        {user.id}
                                    </td>

                                    <td
                                        style={{
                                            ...tableCell,
                                            fontWeight:
                                                "bold",
                                        }}
                                    >
                                        {user.username}
                                    </td>

                                    <td style={tableCell}>
                                        {user.email}
                                    </td>

                                    <td style={tableCell}>
                                        {user.role}
                                    </td>

                                    <td style={tableCell}>
                                        {user.verified
                                            ? "✅ Yes"
                                            : "❌ No"}
                                    </td>

                                    <td style={tableCell}>
                                        {formatDate(
                                            user.created_at
                                        )}
                                    </td>

                                    <td style={tableCell}>
                                        ₹
                                        {Number(
                                            user.total_income
                                        ).toLocaleString(
                                            "en-IN"
                                        )}
                                    </td>

                                    <td style={tableCell}>
                                        ₹
                                        {Number(
                                            user.total_expense
                                        ).toLocaleString(
                                            "en-IN"
                                        )}
                                    </td>

                                    <td style={tableCell}>
                                        {user.bank_accounts_count}
                                    </td>

                                    <td style={tableCell}>
                                        {user.budgets_count}
                                    </td>

                                    <td style={tableCell}>
                                        {user.savings_goals_count}
                                    </td>

                                    <td style={tableCell}>

                                        <button
                                            onClick={() =>
                                                handleViewUser(
                                                    user.id
                                                )
                                            }
                                            style={{
                                                padding:
                                                    "8px 12px",
                                                background:
                                                    "#2563eb",
                                                color:
                                                    "white",
                                                border:
                                                    "none",
                                                borderRadius:
                                                    "6px",
                                                cursor:
                                                    "pointer",
                                                marginRight:
                                                    "8px",
                                            }}
                                        >
                                            View
                                        </button>


                                        {user.role !== "admin" && (

                                            <button
                                                onClick={() =>
                                                    handleDeleteUser(
                                                        user.id,
                                                        user.username
                                                    )
                                                }
                                                style={{
                                                    padding:
                                                        "8px 12px",
                                                    background:
                                                        "#dc2626",
                                                    color:
                                                        "white",
                                                    border:
                                                        "none",
                                                    borderRadius:
                                                        "6px",
                                                    cursor:
                                                        "pointer",
                                                }}
                                            >
                                                Delete
                                            </button>

                                        )}

                                    </td>

                                </tr>

                            ))

                        )}

                    </tbody>

                </table>

            </div>


            {/* ================================= */}
            {/* USER DETAILS MODAL */}
            {/* ================================= */}

            {showDetails && selectedUser && (

                <div style={modalOverlay}>

                    <div
                        style={{
                            ...modalBox,
                            maxWidth:
                                "850px",
                        }}
                    >

                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                            }}
                        >

                            <h2>
                                👤 User Details
                            </h2>

                            <button
                                onClick={() =>
                                    setShowDetails(false)
                                }
                                style={closeButton}
                            >
                                ✕
                            </button>

                        </div>


                        {/* USER INFO */}

                        <h3>
                            Account Information
                        </h3>

                        <div style={detailsGrid}>

                            <DetailItem
                                label="User ID"
                                value={
                                    selectedUser.user.id
                                }
                            />

                            <DetailItem
                                label="Username"
                                value={
                                    selectedUser.user.username
                                }
                            />

                            <DetailItem
                                label="Email"
                                value={
                                    selectedUser.user.email
                                }
                            />

                            <DetailItem
                                label="Role"
                                value={
                                    selectedUser.user.role
                                }
                            />

                            <DetailItem
                                label="Email Verified"
                                value={
                                    selectedUser.user.verified
                                        ? "Yes"
                                        : "No"
                                }
                            />

                            <DetailItem
                                label="Account Created"
                                value={formatDate(
                                    selectedUser.user.created_at
                                )}
                            />

                        </div>


                        {/* FINANCIAL SUMMARY */}

                        <h3
                            style={{
                                marginTop:
                                    "30px",
                            }}
                        >
                            💰 Financial Summary
                        </h3>

                        <div style={detailsGrid}>

                            <DetailItem
                                label="Total Income"
                                value={
                                    "₹" +
                                    Number(
                                        selectedUser
                                            .financial_summary
                                            .total_income
                                    ).toLocaleString(
                                        "en-IN"
                                    )
                                }
                            />

                            <DetailItem
                                label="Total Expense"
                                value={
                                    "₹" +
                                    Number(
                                        selectedUser
                                            .financial_summary
                                            .total_expense
                                    ).toLocaleString(
                                        "en-IN"
                                    )
                                }
                            />

                            <DetailItem
                                label="Total Saved"
                                value={
                                    "₹" +
                                    Number(
                                        selectedUser
                                            .financial_summary
                                            .total_saved
                                    ).toLocaleString(
                                        "en-IN"
                                    )
                                }
                            />

                            <DetailItem
                                label="Net Balance"
                                value={
                                    "₹" +
                                    Number(
                                        selectedUser
                                            .financial_summary
                                            .net_balance
                                    ).toLocaleString(
                                        "en-IN"
                                    )
                                }
                            />

                        </div>


                        {/* BANK ACCOUNTS */}

                        <h3
                            style={{
                                marginTop:
                                    "30px",
                            }}
                        >
                            🏦 Bank Accounts (
                            {selectedUser.bank_accounts.length}
                            )
                        </h3>

                        {selectedUser.bank_accounts.length === 0 ? (

                            <p>
                                No bank accounts
                            </p>

                        ) : (

                            selectedUser.bank_accounts.map(
                                (bank) => (

                                    <div
                                        key={bank.id}
                                        style={listCard}
                                    >

                                        <strong>
                                            {bank.bank_name}
                                        </strong>

                                        <div>
                                            Holder:{" "}
                                            {bank.account_holder}
                                        </div>

                                        <div>
                                            Balance: ₹
                                            {Number(
                                                bank.current_balance
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </div>

                                        <div>
                                            Type:{" "}
                                            {bank.account_type}
                                        </div>

                                    </div>

                                )
                            )

                        )}


                        {/* SAVINGS GOALS */}

                        <h3
                            style={{
                                marginTop:
                                    "30px",
                            }}
                        >
                            🎯 Savings Goals (
                            {selectedUser.savings_goals.length}
                            )
                        </h3>

                        {selectedUser.savings_goals.length === 0 ? (

                            <p>
                                No savings goals
                            </p>

                        ) : (

                            selectedUser.savings_goals.map(
                                (goal) => (

                                    <div
                                        key={goal.id}
                                        style={listCard}
                                    >

                                        <strong>
                                            {goal.goal_name}
                                        </strong>

                                        <div>
                                            Target: ₹
                                            {Number(
                                                goal.target_amount
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </div>

                                        <div>
                                            Saved: ₹
                                            {Number(
                                                goal.current_amount
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </div>

                                    </div>

                                )
                            )

                        )}


                        {/* BUDGETS */}

                        <h3
                            style={{
                                marginTop:
                                    "30px",
                            }}
                        >
                            📊 Budgets (
                            {selectedUser.budgets.length}
                            )
                        </h3>

                        {selectedUser.budgets.length === 0 ? (

                            <p>
                                No budgets
                            </p>

                        ) : (

                            selectedUser.budgets.map(
                                (budget) => (

                                    <div
                                        key={budget.id}
                                        style={listCard}
                                    >

                                        <strong>
                                            {budget.category}
                                        </strong>

                                        <div>
                                            Monthly Limit: ₹
                                            {Number(
                                                budget.monthly_limit
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </div>

                                        <div>
                                            Month:{" "}
                                            {budget.month}/
                                            {budget.year}
                                        </div>

                                    </div>

                                )
                            )

                        )}

                    </div>

                </div>

            )}


            {/* ================================= */}
            {/* CREATE USER MODAL */}
            {/* ================================= */}

            {showCreateUser && (

                <div style={modalOverlay}>

                    <div style={modalBox}>

                        <div
                            style={{
                                display: "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                            }}
                        >

                            <h2>
                                ➕ Create New User
                            </h2>

                            <button
                                onClick={() =>
                                    setShowCreateUser(false)
                                }
                                style={closeButton}
                            >
                                ✕
                            </button>

                        </div>


                        <form
                            onSubmit={
                                handleCreateUser
                            }
                        >

                            <input
                                placeholder="Username"
                                value={
                                    newUser.username
                                }
                                onChange={(e) =>
                                    setNewUser({
                                        ...newUser,
                                        username:
                                            e.target.value,
                                    })
                                }
                                style={inputStyle}
                            />

                            <input
                                type="email"
                                placeholder="Email"
                                value={
                                    newUser.email
                                }
                                onChange={(e) =>
                                    setNewUser({
                                        ...newUser,
                                        email:
                                            e.target.value,
                                    })
                                }
                                style={inputStyle}
                            />

                            <input
                                type="password"
                                placeholder="Password"
                                value={
                                    newUser.password
                                }
                                onChange={(e) =>
                                    setNewUser({
                                        ...newUser,
                                        password:
                                            e.target.value,
                                    })
                                }
                                style={inputStyle}
                            />

                            <button
                                type="submit"
                                style={{
                                    width:
                                        "100%",
                                    padding:
                                        "12px",
                                    background:
                                        "#16a34a",
                                    color:
                                        "white",
                                    border:
                                        "none",
                                    borderRadius:
                                        "8px",
                                    cursor:
                                        "pointer",
                                    fontSize:
                                        "16px",
                                }}
                            >
                                Create User
                            </button>

                        </form>

                    </div>

                </div>

            )}

        </div>

    );

}


// ==========================================
// REUSABLE DETAIL COMPONENT
// ==========================================

function DetailItem({
    label,
    value
}) {

    return (

        <div
            style={{
                background:
                    "#f8fafc",
                padding:
                    "15px",
                borderRadius:
                    "8px",
            }}
        >

            <div
                style={{
                    fontSize:
                        "13px",
                    color:
                        "#64748b",
                    marginBottom:
                        "5px",
                }}
            >
                {label}
            </div>

            <strong>
                {value}
            </strong>

        </div>

    );

}


// ==========================================
// STYLES
// ==========================================

const tableHeader = {
    padding: "12px",
    textAlign: "left",
    fontSize: "14px",
};


const tableCell = {
    padding: "12px",
    fontSize: "14px",
};


const modalOverlay = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
        "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px",
};


const modalBox = {
    background: "white",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflowY: "auto",
    padding: "30px",
    borderRadius: "15px",
    boxSizing: "border-box",
};


const closeButton = {
    border: "none",
    background: "transparent",
    fontSize: "22px",
    cursor: "pointer",
};


const detailsGrid = {
    display: "grid",
    gridTemplateColumns:
        "repeat(2, 1fr)",
    gap: "15px",
};


const listCard = {
    background: "#f8fafc",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "10px",
    lineHeight: "1.7",
};


const inputStyle = {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    boxSizing: "border-box",
    border:
        "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "15px",
};


export default AdminDashboard;