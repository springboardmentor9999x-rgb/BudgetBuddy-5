import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";


// ==========================================================
// ACCOUNT CREATED DATE & TIME
// ==========================================================

const formatDateTime = (date) => {
    if (!date) {
        return "Not available";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Not available";
    }

    return parsedDate.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};


function UserManagement() {

    const navigate = useNavigate();

    const { user, loading: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);

    const [users, setUsers] = useState([]);

    const [myAccount, setMyAccount] = useState(null);

    const [search, setSearch] = useState("");

    const [selectedUser, setSelectedUser] = useState(null);

    const [showDetails, setShowDetails] = useState(false);

    const [showCreateUser, setShowCreateUser] = useState(false);

    const [newUser, setNewUser] = useState({
        username: "",
        email: "",
        password: "",
        plan: "normal",
    });


    // =====================================================
    // LOAD USER MANAGEMENT
    // =====================================================

    const loadUserManagement = async () => {

        try {

            setLoading(true);

            // -------------------------------------------------
            // ADMIN
            // -------------------------------------------------

            if (user?.role === "admin") {

                const response = await api.get(
                    "/admin/users"
                );

                setUsers(
                    response.data
                );

                return;
            }


            // -------------------------------------------------
            // NORMAL / PREMIUM USER
            // -------------------------------------------------

            const response = await api.get(
                "/admin/me"
            );

            setMyAccount(
                response.data
            );

        } catch (error) {

            console.error(
                "User Management error:",
                error
            );

            if (
                error.response?.status === 401
            ) {

                toast.error(
                    "Please login again."
                );

                localStorage.removeItem(
                    "token"
                );

                navigate("/login");

                return;
            }

            toast.error(
                error.response?.data?.detail ||
                "Unable to load User Management"
            );

        } finally {

            setLoading(false);
        }
    };


    useEffect(() => {

        if (!authLoading && user) {

            loadUserManagement();

        }

    }, [authLoading, user]);


    // =====================================================
    // ADMIN - VIEW USER DETAILS
    // =====================================================

    const handleViewDetails = async (
        userId
    ) => {

        try {

            const response = await api.get(
                `/admin/users/${userId}`
            );

            setSelectedUser(
                response.data
            );

            setShowDetails(
                true
            );

        } catch (error) {

            toast.error(
                error.response?.data?.detail ||
                "Unable to load user details"
            );
        }
    };


    // =====================================================
    // ADMIN - CHANGE PLAN
    // =====================================================

    const handleChangePlan = async (
        userId,
        plan
    ) => {

        try {

            await api.put(
                `/admin/users/${userId}/plan`,
                {
                    plan: plan,
                }
            );

            toast.success(
                "User plan updated successfully"
            );

            loadUserManagement();

        } catch (error) {

            toast.error(
                error.response?.data?.detail ||
                "Unable to update user plan"
            );
        }
    };

    // =====================================================
    // ADMIN - DELETE USER
    // =====================================================

    const handleDeleteUser = async (
        userId,
        username
    ) => {

        const confirmed = window.confirm(
            `Are you sure you want to permanently delete "${username}" and all of their financial data?`
        );

        if (!confirmed) {
            return;
        }

        try {

            await api.delete(
                `/admin/users/${userId}`
            );

            toast.success(
                "User deleted successfully"
            );

            loadUserManagement();

        } catch (error) {

            toast.error(
                error.response?.data?.detail ||
                "Unable to delete user"
            );
        }
    };


    // =====================================================
    // ADMIN - CREATE USER
    // =====================================================

    const handleCreateUser = async (
        e
    ) => {

        e.preventDefault();

        if (
            !newUser.username.trim() ||
            !newUser.email.trim() ||
            !newUser.password
        ) {

            toast.error(
                "Please fill all required fields"
            );

            return;
        }

        try {

            await api.post(
                "/admin/users",
                {
                    username:
                        newUser.username.trim(),

                    email:
                        newUser.email.trim(),

                    password:
                        newUser.password,

                    plan:
                        newUser.plan,
                }
            );

            toast.success(
                "User created successfully"
            );

            setNewUser({
                username: "",
                email: "",
                password: "",
                plan: "normal",
            });

            setShowCreateUser(
                false
            );

            loadUserManagement();

        } catch (error) {

            toast.error(
                error.response?.data?.detail ||
                "Unable to create user"
            );
        }
    };


    // =====================================================
    // LOADING
    // =====================================================

    if (
        authLoading ||
        loading
    ) {

        return (

            <div
                style={{
                    padding: "40px",
                    textAlign: "center",
                    fontSize: "20px",
                }}
            >
                Loading User Management...
            </div>
        );
    }


    // =====================================================
    // FILTER USERS
    // ADMIN
    // =====================================================

    const filteredUsers =
        users.filter((item) => {

            const value =
                search
                    .toLowerCase()
                    .trim();

            if (!value) {
                return true;
            }

            return (
                item.username
                    ?.toLowerCase()
                    .includes(value) ||

                item.email
                    ?.toLowerCase()
                    .includes(value) ||

                item.role
                    ?.toLowerCase()
                    .includes(value) ||

                item.plan
                    ?.toLowerCase()
                    .includes(value)
            );
        });


    // =====================================================
    // MAIN PAGE
    // =====================================================

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


                {/* =================================================
                    HEADER
                ================================================= */}

                <div
                    style={{
                        display: "flex",
                        justifyContent:
                            "space-between",
                        alignItems: "center",
                        marginBottom: "25px",
                        gap: "15px",
                        flexWrap: "wrap",
                    }}
                >

                    <div>

                        <h1
                            style={{
                                marginBottom: "5px",
                            }}
                        >
                            👥 User Management
                        </h1>

                        <p
                            style={{
                                color: "#64748b",
                                margin: 0,
                            }}
                        >
                            {user?.role === "admin"
                                ? "Manage all BudgetBuddy users and their accounts."
                                : "View your BudgetBuddy account and financial activity."
                            }
                        </p>

                    </div>


                    {user?.role === "admin" && (

                        <button
                            onClick={() =>
                                setShowCreateUser(
                                    true
                                )
                            }
                            style={primaryButton}
                        >
                            ➕ Create User
                        </button>

                    )}

                </div>


                {/* =================================================
                    ADMIN VIEW
                ================================================= */}

                {user?.role === "admin" ? (

                    <>

                        {/* -----------------------------------------
                            SEARCH
                        ----------------------------------------- */}

                        <div
                            style={{
                                background: "white",
                                padding: "18px",
                                borderRadius: "12px",
                                marginBottom: "20px",
                                boxShadow:
                                    "0 2px 10px rgba(0,0,0,0.06)",
                            }}
                        >

                            <input
                                type="text"
                                placeholder="🔍 Search username, email, role or plan..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    border:
                                        "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    boxSizing:
                                        "border-box",
                                    fontSize: "15px",
                                }}
                            />

                        </div>


                        {/* -----------------------------------------
                            USER COUNT
                        ----------------------------------------- */}

                        <div
                            style={{
                                marginBottom: "15px",
                                color: "#475569",
                            }}
                        >
                            Showing{" "}
                            <strong>
                                {filteredUsers.length}
                            </strong>{" "}
                            of{" "}
                            <strong>
                                {users.length}
                            </strong>{" "}
                            users
                        </div>


                        {/* -----------------------------------------
                            USER TABLE
                        ----------------------------------------- */}

                        <div
                            style={{
                                background: "white",
                                borderRadius: "12px",
                                boxShadow:
                                    "0 2px 10px rgba(0,0,0,0.06)",
                                overflowX: "auto",
                            }}
                        >

                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse:
                                        "collapse",
                                    minWidth:
                                        "1200px",
                                }}
                            >

                                <thead>

                                    <tr
                                        style={{
                                            background:
                                                "#eff6ff",
                                        }}
                                    >

                                        <th
                                            style={thStyle}
                                        >
                                            ID
                                        </th>

                                        <th
                                            style={thStyle}
                                        >
                                            Username
                                        </th>

                                        <th
                                            style={thStyle}
                                        >
                                            Email
                                        </th>

                                        <th
                                            style={thStyle}
                                        >
                                            Role
                                        </th>

                                        <th
                                            style={thStyle}
                                        >
                                            Plan
                                        </th>

                                        <th
                                            style={thStyle}
                                        >
                                            Verified
                                        </th>

                                        <th
                                            style={thStyle}
                                        >
                                            Account Created
                                        </th>

                                        <th
                                            style={thStyle}
                                        >
                                            Income
                                        </th>

                                        <th
                                            style={thStyle}
                                        >
                                            Expense
                                        </th>

                                        <th
                                            style={thStyle}
                                        >
                                            Accounts
                                        </th>

                                        <th
                                            style={thStyle}
                                        >
                                            Actions
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {filteredUsers.length ===
                                    0 ? (

                                        <tr>

                                            <td
                                                colSpan="11"
                                                style={{
                                                    padding:
                                                        "40px",
                                                    textAlign:
                                                        "center",
                                                    color:
                                                        "#64748b",
                                                }}
                                            >
                                                No users found.
                                            </td>

                                        </tr>

                                    ) : (

                                        filteredUsers.map(
                                            (item) => (

                                                <tr
                                                    key={
                                                        item.id
                                                    }
                                                    style={{
                                                        borderBottom:
                                                            "1px solid #e2e8f0",
                                                    }}
                                                >

                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >
                                                        {item.id}
                                                    </td>

                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >
                                                        <strong>
                                                            {
                                                                item.username
                                                            }
                                                        </strong>
                                                    </td>

                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >
                                                        {
                                                            item.email
                                                        }
                                                    </td>


                                                    {/* ROLE - READ ONLY */}

                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >
                                                        <span
                                                            style={{
                                                                ...badgeStyle,
                                                                background:
                                                                    item.role ===
                                                                    "admin"
                                                                        ? "#dbeafe"
                                                                        : "#f1f5f9",
                                                                color:
                                                                    item.role ===
                                                                    "admin"
                                                                        ? "#1d4ed8"
                                                                        : "#334155",
                                                            }}
                                                        >
                                                            {item.role ===
                                                            "admin"
                                                                ? "Admin"
                                                                : "User"}
                                                        </span>
                                                    </td>


                                                    {/* PLAN */}

                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >

                                                        {item.role ===
                                                        "admin" ? (

                                                            <span
                                                                style={{
                                                                    ...badgeStyle,
                                                                    background:
                                                                        "#e0e7ff",
                                                                    color:
                                                                        "#3730a3",
                                                                }}
                                                            >
                                                                Admin
                                                            </span>

                                                        ) : (

                                                            <select
                                                                value={
                                                                    item.plan
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    handleChangePlan(
                                                                        item.id,
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                style={
                                                                    selectStyle
                                                                }
                                                            >

                                                                <option value="normal">
                                                                    Normal
                                                                </option>

                                                                <option value="premium">
                                                                    Premium
                                                                </option>

                                                            </select>

                                                        )}

                                                    </td>


                                                    {/* VERIFIED */}

                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >

                                                        {item.verified ? (

                                                            <span
                                                                style={{
                                                                    ...badgeStyle,
                                                                    background:
                                                                        "#dcfce7",
                                                                    color:
                                                                        "#166534",
                                                                }}
                                                            >
                                                                ✓ Verified
                                                            </span>

                                                        ) : (

                                                            <span
                                                                style={{
                                                                    ...badgeStyle,
                                                                    background:
                                                                        "#fee2e2",
                                                                    color:
                                                                        "#991b1b",
                                                                }}
                                                            >
                                                                ✕ Not Verified
                                                            </span>

                                                        )}

                                                    </td>


                                                    {/* ACCOUNT CREATED */}

                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >
                                                        {formatDateTime(
                                                            item.created_at
                                                        )}
                                                    </td>


                                                    {/* INCOME */}

                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >
                                                        ₹
                                                        {Number(
                                                            item.total_income ||
                                                                0
                                                        ).toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </td>


                                                    {/* EXPENSE */}

                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >
                                                        ₹
                                                        {Number(
                                                            item.total_expense ||
                                                                0
                                                        ).toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </td>


                                                    {/* ACCOUNTS */}

                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >
                                                        {item.bank_accounts_count ||
                                                            0}
                                                    </td>


                                                    {/* ACTIONS */}

                                                    <td
                                                        style={
                                                            tdStyle
                                                        }
                                                    >

                                                        <div
                                                            style={{
                                                                display:
                                                                    "flex",
                                                                gap:
                                                                    "6px",
                                                                flexWrap:
                                                                    "wrap",
                                                            }}
                                                        >

                                                            <button
                                                                onClick={() =>
                                                                    handleViewDetails(
                                                                        item.id
                                                                    )
                                                                }
                                                                style={
                                                                    smallButton
                                                                }
                                                            >
                                                                👁 View
                                                            </button>


                                                            {item.id !==
                                                                user.id && (

                                                                <button
                                                                    onClick={() =>
                                                                        handleDeleteUser(
                                                                            item.id,
                                                                            item.username
                                                                        )
                                                                    }
                                                                    style={
                                                                        deleteButton
                                                                    }
                                                                >
                                                                    🗑 Delete
                                                                </button>

                                                            )}

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </>

                ) : (

                    /* =================================================
                       NORMAL / PREMIUM USER VIEW
                    ================================================= */

                    <PersonalUserView
                        account={
                            myAccount
                        }
                    />

                )}

            </div>


            {/* =====================================================
                USER DETAILS MODAL
            ===================================================== */}

            {showDetails &&
                selectedUser && (

                    <UserDetailsModal
                        data={
                            selectedUser
                        }
                        onClose={() =>
                            setShowDetails(
                                false
                            )
                        }
                    />

                )}


            {/* =====================================================
                CREATE USER MODAL
            ===================================================== */}

            {showCreateUser && (

                <div
                    style={overlayStyle}
                >

                    <div
                        style={modalStyle}
                    >

                        <div
                            style={{
                                display:
                                    "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                                marginBottom:
                                    "20px",
                            }}
                        >

                            <h2
                                style={{
                                    margin: 0,
                                }}
                            >
                                ➕ Create User
                            </h2>

                            <button
                                onClick={() =>
                                    setShowCreateUser(
                                        false
                                    )
                                }
                                style={
                                    closeButton
                                }
                            >
                                ✕
                            </button>

                        </div>


                        <form
                            onSubmit={
                                handleCreateUser
                            }
                        >

                            <label
                                style={
                                    labelStyle
                                }
                            >
                                Username
                            </label>

                            <input
                                type="text"
                                value={
                                    newUser.username
                                }
                                onChange={(e) =>
                                    setNewUser({
                                        ...newUser,
                                        username:
                                            e.target
                                                .value,
                                    })
                                }
                                style={
                                    inputStyle
                                }
                            />


                            <label
                                style={
                                    labelStyle
                                }
                            >
                                Email
                            </label>

                            <input
                                type="email"
                                value={
                                    newUser.email
                                }
                                onChange={(e) =>
                                    setNewUser({
                                        ...newUser,
                                        email:
                                            e.target
                                                .value,
                                    })
                                }
                                style={
                                    inputStyle
                                }
                            />


                            <label
                                style={
                                    labelStyle
                                }
                            >
                                Password
                            </label>

                            <input
                                type="password"
                                value={
                                    newUser.password
                                }
                                onChange={(e) =>
                                    setNewUser({
                                        ...newUser,
                                        password:
                                            e.target
                                                .value,
                                    })
                                }
                                style={
                                    inputStyle
                                }
                            />


                            <label
                                style={
                                    labelStyle
                                }
                            >
                                Plan
                            </label>

                            <select
                                value={
                                    newUser.plan
                                }
                                onChange={(e) =>
                                    setNewUser({
                                        ...newUser,
                                        plan:
                                            e.target
                                                .value,
                                    })
                                }
                                style={
                                    inputStyle
                                }
                            >

                                <option value="normal">
                                    Normal
                                </option>

                                <option value="premium">
                                    Premium
                                </option>

                            </select>


                            <button
                                type="submit"
                                style={{
                                    ...primaryButton,
                                    width: "100%",
                                    marginTop:
                                        "10px",
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


// ==========================================================
// PERSONAL USER VIEW
// ==========================================================

function PersonalUserView({
    account
}) {

    if (!account) {

        return (

            <div
                style={emptyBox}
            >
                Unable to load account information.
            </div>
        );
    }

    const user = account.user;

    const financial =
        account.financial_summary;

    const activity =
        account.activity;


    return (

        <>

            {/* ACCOUNT CARD */}

            <div
                style={sectionCard}
            >

                <h2>
                    👤 My Account
                </h2>

                <div
                    style={infoGrid}
                >

                    <Info
                        label="Username"
                        value={
                            user.username
                        }
                    />

                    <Info
                        label="Email"
                        value={
                            user.email
                        }
                    />

                    <Info
                        label="Role"
                        value={
                            user.role
                        }
                    />

                    <Info
                        label="Plan"
                        value={
                            user.plan
                        }
                        highlight={
                            user.plan ===
                            "premium"
                        }
                    />

                    <Info
                        label="Verification"
                        value={
                            user.verified
                                ? "Verified"
                                : "Not Verified"
                        }
                    />

                    <Info
                        label="User ID"
                        value={
                            user.id
                        }
                    />

                </div>

            </div>


            {/* FINANCIAL SUMMARY */}

            <h2
                style={{
                    marginTop:
                        "25px",
                }}
            >
                💰 Financial Summary
            </h2>


            <div
                style={cardGrid}
            >

                <SummaryCard
                    title="Total Income"
                    value={
                        financial.total_income
                    }
                    icon="💵"
                />

                <SummaryCard
                    title="Total Expenses"
                    value={
                        financial.total_expense
                    }
                    icon="💸"
                />

                <SummaryCard
                    title="Net Balance"
                    value={
                        financial.net_balance
                    }
                    icon="💰"
                />

                <SummaryCard
                    title="Total Savings"
                    value={
                        financial.total_savings
                    }
                    icon="🎯"
                />

            </div>


            {/* ACTIVITY */}

            <h2
                style={{
                    marginTop:
                        "25px",
                }}
            >
                📊 My Activity
            </h2>


            <div
                style={cardGrid}
            >

                <CountCard
                    title="Bank Accounts"
                    value={
                        activity.bank_accounts
                    }
                    icon="🏦"
                />

                <CountCard
                    title="Budgets"
                    value={
                        activity.budgets
                    }
                    icon="📊"
                />

                <CountCard
                    title="Savings Goals"
                    value={
                        activity.savings_goals
                    }
                    icon="🎯"
                />

                <CountCard
                    title="Income Records"
                    value={
                        activity.income_records
                    }
                    icon="💵"
                />

                <CountCard
                    title="Expense Records"
                    value={
                        activity.expense_records
                    }
                    icon="💸"
                />

            </div>

        </>
    );
}


// ==========================================================
// INFO COMPONENT
// ==========================================================

function Info({
    label,
    value,
    highlight
}) {

    return (

        <div
            style={{
                padding:
                    "15px",
                background:
                    "#f8fafc",
                borderRadius:
                    "8px",
            }}
        >

            <div
                style={{
                    color:
                        "#64748b",
                    fontSize:
                        "13px",
                    marginBottom:
                        "5px",
                }}
            >
                {label}
            </div>

            <div
                style={{
                    fontWeight:
                        "bold",
                    color:
                        highlight
                            ? "#ca8a04"
                            : "#1e293b",
                    textTransform:
                        "capitalize",
                }}
            >
                {value}
            </div>

        </div>
    );
}


// ==========================================================
// SUMMARY CARD
// ==========================================================

function SummaryCard({
    title,
    value,
    icon
}) {

    return (

        <div
            style={summaryCard}
        >

            <div
                style={{
                    fontSize:
                        "28px",
                }}
            >
                {icon}
            </div>

            <div
                style={{
                    color:
                        "#64748b",
                    marginTop:
                        "8px",
                }}
            >
                {title}
            </div>

            <div
                style={{
                    fontSize:
                        "22px",
                    fontWeight:
                        "bold",
                    marginTop:
                        "5px",
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


// ==========================================================
// COUNT CARD
// ==========================================================

function CountCard({
    title,
    value,
    icon
}) {

    return (

        <div
            style={summaryCard}
        >

            <div
                style={{
                    fontSize:
                        "28px",
                }}
            >
                {icon}
            </div>

            <div
                style={{
                    color:
                        "#64748b",
                    marginTop:
                        "8px",
                }}
            >
                {title}
            </div>

            <div
                style={{
                    fontSize:
                        "24px",
                    fontWeight:
                        "bold",
                    marginTop:
                        "5px",
                }}
            >
                {value || 0}
            </div>

        </div>
    );
}


// ==========================================================
// USER DETAILS MODAL
// ==========================================================

function UserDetailsModal({
    data,
    onClose
}) {

    const user =
        data.user;

    const financial =
        data.financial_summary;

    return (

        <div
            style={overlayStyle}
        >

            <div
                style={{
                    ...modalStyle,
                    maxWidth:
                        "900px",
                    maxHeight:
                        "90vh",
                    overflowY:
                        "auto",
                }}
            >

                <div
                    style={{
                        display:
                            "flex",
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
                        onClick={
                            onClose
                        }
                        style={
                            closeButton
                        }
                    >
                        ✕
                    </button>

                </div>


                {/* USER INFORMATION */}

                <div
                    style={
                        infoGrid
                    }
                >

                    <Info
                        label="Username"
                        value={
                            user.username
                        }
                    />

                    <Info
                        label="Email"
                        value={
                            user.email
                        }
                    />

                    <Info
                        label="Role"
                        value={
                            user.role
                        }
                    />

                    <Info
                        label="Plan"
                        value={
                            user.plan
                        }
                        highlight={
                            user.plan ===
                            "premium"
                        }
                    />

                    <Info
                        label="Verified"
                        value={
                            user.verified
                                ? "Yes"
                                : "No"
                        }
                    />

                    <Info
                        label="User ID"
                        value={
                            user.id
                        }
                    />

                    <Info
                        label="Account Created"
                        value={
                            formatDateTime(
                                user.created_at
                            )
                        }
                    />

                </div>


                {/* FINANCIAL INFORMATION */}

                <h3
                    style={{
                        marginTop:
                            "25px",
                    }}
                >
                    💰 Financial Summary
                </h3>


                <div
                    style={
                        cardGrid
                    }
                >

                    <SummaryCard
                        title="Income"
                        value={
                            financial.total_income
                        }
                        icon="💵"
                    />

                    <SummaryCard
                        title="Expenses"
                        value={
                            financial.total_expense
                        }
                        icon="💸"
                    />

                    <SummaryCard
                        title="Saved"
                        value={
                            financial.total_saved
                        }
                        icon="🎯"
                    />

                    <SummaryCard
                        title="Balance"
                        value={
                            financial.net_balance
                        }
                        icon="💰"
                    />

                </div>


                {/* BANK ACCOUNTS */}

                <h3
                    style={{
                        marginTop:
                            "25px",
                    }}
                >
                    🏦 Bank Accounts
                </h3>

                {data.bank_accounts?.length >
                0 ? (

                    <div
                        style={{
                            overflowX:
                                "auto",
                        }}
                    >

                        <table
                            style={{
                                width:
                                    "100%",
                                borderCollapse:
                                    "collapse",
                            }}
                        >

                            <thead>

                                <tr>

                                    <th
                                        style={
                                            thStyle
                                        }
                                    >
                                        Bank
                                    </th>

                                    <th
                                        style={
                                            thStyle
                                        }
                                    >
                                        Account Type
                                    </th>

                                    <th
                                        style={
                                            thStyle
                                        }
                                    >
                                        Balance
                                    </th>

                                    <th
                                        style={
                                            thStyle
                                        }
                                    >
                                        Primary
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {data.bank_accounts.map(
                                    (
                                        bank
                                    ) => (

                                        <tr
                                            key={
                                                bank.id
                                            }
                                        >

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                {
                                                    bank.bank_name
                                                }
                                            </td>

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                {
                                                    bank.account_type
                                                }
                                            </td>

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                ₹
                                                {Number(
                                                    bank.current_balance ||
                                                        0
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}
                                            </td>

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                {bank.is_primary
                                                    ? "Yes"
                                                    : "No"}
                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                ) : (

                    <p
                        style={{
                            color:
                                "#64748b",
                        }}
                    >
                        No bank accounts.
                    </p>

                )}


                {/* BUDGETS */}

                <h3
                    style={{
                        marginTop:
                            "25px",
                    }}
                >
                    📊 Budgets
                </h3>

                {data.budgets?.length >
                0 ? (

                    <div
                        style={{
                            overflowX:
                                "auto",
                        }}
                    >

                        <table
                            style={{
                                width:
                                    "100%",
                                borderCollapse:
                                    "collapse",
                            }}
                        >

                            <thead>

                                <tr>

                                    <th
                                        style={
                                            thStyle
                                        }
                                    >
                                        Category
                                    </th>

                                    <th
                                        style={
                                            thStyle
                                        }
                                    >
                                        Monthly Limit
                                    </th>

                                    <th
                                        style={
                                            thStyle
                                        }
                                    >
                                        Month
                                    </th>

                                    <th
                                        style={
                                            thStyle
                                        }
                                    >
                                        Year
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {data.budgets.map(
                                    (
                                        budget
                                    ) => (

                                        <tr
                                            key={
                                                budget.id
                                            }
                                        >

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                {
                                                    budget.category
                                                }
                                            </td>

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                ₹
                                                {Number(
                                                    budget.monthly_limit ||
                                                        0
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}
                                            </td>

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                {
                                                    budget.month
                                                }
                                            </td>

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                {
                                                    budget.year
                                                }
                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                ) : (

                    <p
                        style={{
                            color:
                                "#64748b",
                        }}
                    >
                        No budgets.
                    </p>

                )}


                {/* SAVINGS GOALS */}

                <h3
                    style={{
                        marginTop:
                            "25px",
                    }}
                >
                    🎯 Savings Goals
                </h3>

                {data.savings_goals?.length >
                0 ? (

                    <div
                        style={{
                            overflowX:
                                "auto",
                        }}
                    >

                        <table
                            style={{
                                width:
                                    "100%",
                                borderCollapse:
                                    "collapse",
                            }}
                        >

                            <thead>

                                <tr>

                                    <th
                                        style={
                                            thStyle
                                        }
                                    >
                                        Goal
                                    </th>

                                    <th
                                        style={
                                            thStyle
                                        }
                                    >
                                        Target
                                    </th>

                                    <th
                                        style={
                                            thStyle
                                        }
                                    >
                                        Current
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {data.savings_goals.map(
                                    (
                                        goal
                                    ) => (

                                        <tr
                                            key={
                                                goal.id
                                            }
                                        >

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                {
                                                    goal.goal_name
                                                }
                                            </td>

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                ₹
                                                {Number(
                                                    goal.target_amount ||
                                                        0
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}
                                            </td>

                                            <td
                                                style={
                                                    tdStyle
                                                }
                                            >
                                                ₹
                                                {Number(
                                                    goal.current_amount ||
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

                ) : (

                    <p
                        style={{
                            color:
                                "#64748b",
                        }}
                    >
                        No savings goals.
                    </p>

                )}

            </div>

        </div>
    );
}


// ==========================================================
// STYLES
// ==========================================================

const thStyle = {
    padding: "12px",
    textAlign: "left",
    borderBottom:
        "1px solid #cbd5e1",
    fontSize: "14px",
    color: "#334155",
};

const tdStyle = {
    padding: "12px",
    borderBottom:
        "1px solid #e2e8f0",
    fontSize: "14px",
};

const selectStyle = {
    padding: "7px",
    border:
        "1px solid #cbd5e1",
    borderRadius: "6px",
    background: "white",
    cursor: "pointer",
};

const badgeStyle = {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "20px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "capitalize",
};

const primaryButton = {
    padding: "11px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
};

const smallButton = {
    padding: "7px 10px",
    border: "none",
    borderRadius: "6px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
};

const deleteButton = {
    padding: "7px 10px",
    border: "none",
    borderRadius: "6px",
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
};

const inputStyle = {
    width: "100%",
    padding: "11px",
    marginBottom: "15px",
    border:
        "1px solid #cbd5e1",
    borderRadius: "7px",
    boxSizing: "border-box",
    fontSize: "15px",
};

const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontWeight: "bold",
    color: "#334155",
};

const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
        "rgba(15,23,42,0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    zIndex: 1000,
};

const modalStyle = {
    background: "white",
    width: "100%",
    maxWidth: "600px",
    borderRadius: "12px",
    padding: "25px",
    boxSizing: "border-box",
};

const closeButton = {
    border: "none",
    background: "#f1f5f9",
    borderRadius: "6px",
    padding: "8px 10px",
    cursor: "pointer",
    fontSize: "16px",
};

const sectionCard = {
    background: "white",
    padding: "25px",
    borderRadius: "12px",
    boxShadow:
        "0 2px 10px rgba(0,0,0,0.06)",
};

const infoGrid = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
};

const cardGrid = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "18px",
    marginBottom: "20px",
};

const summaryCard = {
    background: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow:
        "0 2px 10px rgba(0,0,0,0.06)",
};

const emptyBox = {
    background: "white",
    padding: "40px",
    borderRadius: "12px",
    textAlign: "center",
    color: "#64748b",
};


export default UserManagement;