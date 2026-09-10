import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const formatDateTime = (date) => {
    if (!date) return "Not available";

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

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [showCreateUser, setShowCreateUser] = useState(false);
    const [newUser, setNewUser] = useState({
        username: "",
        email: "",
        password: "",
        plan: "normal",
    });

    useEffect(() => {
        if (!authLoading && (!user || user.role !== "admin")) {
            navigate("/dashboard", { replace: true });
        }
    }, [authLoading, user, navigate]);

    const loadUsers = async () => {
        try {
            setLoading(true);

            const response = await api.get("/admin/users");
            setUsers(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                navigate("/login", { replace: true });
                return;
            }

            if (error.response?.status === 403) {
                toast.error("Admin access required");
                navigate("/dashboard", { replace: true });
                return;
            }

            toast.error(
                error.response?.data?.detail ||
                "Unable to load users"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && user?.role === "admin") {
            loadUsers();
        }
    }, [authLoading, user]);

    const handleChangePlan = async (userId, plan) => {
        try {
            await api.put(`/admin/users/${userId}/plan`, { plan });

            toast.success("User plan updated successfully");
            await loadUsers();
        } catch (error) {
            toast.error(
                error.response?.data?.detail ||
                "Unable to update user plan"
            );
        }
    };

    const handleDeleteUser = async (userId, username, role) => {
        if (role === "admin") {
            toast.error(
                "The administrator account cannot be deleted."
            );
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to permanently delete "${username}"?`
        );

        if (!confirmed) return;

        try {
            await api.delete(`/admin/users/${userId}`);

            toast.success("User deleted successfully");
            await loadUsers();
        } catch (error) {
            toast.error(
                error.response?.data?.detail ||
                "Unable to delete user"
            );
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        if (
            !newUser.username.trim() ||
            !newUser.email.trim() ||
            !newUser.password
        ) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            await api.post("/admin/users", {
                username: newUser.username.trim(),
                email: newUser.email.trim(),
                password: newUser.password,
                plan: newUser.plan,
            });

            toast.success("User created successfully");

            setNewUser({
                username: "",
                email: "",
                password: "",
                plan: "normal",
            });

            setShowCreateUser(false);
            await loadUsers();
        } catch (error) {
            toast.error(
                error.response?.data?.detail ||
                "Unable to create user"
            );
        }
    };

    if (authLoading || loading) {
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

    if (!user || user.role !== "admin") {
        return null;
    }

    const value = search.toLowerCase().trim();

    const filteredUsers = users.filter((item) => {
        if (!value) return true;

        return (
            item.username?.toLowerCase().includes(value) ||
            item.email?.toLowerCase().includes(value) ||
            item.role?.toLowerCase().includes(value) ||
            item.plan?.toLowerCase().includes(value)
        );
    });

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

                {/* Page Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "15px",
                        marginTop: "25px",
                        marginBottom: "20px",
                        flexWrap: "wrap",
                    }}
                >
                    <div>
                        <h1 style={{ marginBottom: "5px" }}>
                            👥 User Management
                        </h1>

                        <p
                            style={{
                                color: "#64748b",
                                margin: 0,
                            }}
                        >
                            Admin-only account and subscription management.
                            Private financial information is not displayed.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowCreateUser(true)}
                        style={primaryButton}
                    >
                        ➕ Create User
                    </button>
                </div>

                {/* Search */}
                <div
                    style={{
                        background: "white",
                        padding: "15px",
                        borderRadius: "10px",
                        marginBottom: "20px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                >
                    <input
                        type="text"
                        placeholder="Search username, email, role or plan..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={searchInput}
                    />
                </div>

                {/* Users Table */}
                <div
                    style={{
                        background: "white",
                        borderRadius: "12px",
                        padding: "20px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                        overflowX: "auto",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "15px",
                        }}
                    >
                        <h2 style={{ margin: 0 }}>
                            Registered Users
                        </h2>

                        <span style={{ color: "#64748b" }}>
                            {filteredUsers.length} of {users.length} users
                        </span>
                    </div>

                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    textAlign: "left",
                                    background: "#f8fafc",
                                }}
                            >
                                {[
                                    "ID",
                                    "Username",
                                    "Email",
                                    "Role",
                                    "Plan",
                                    "Verified",
                                    "Account Created",
                                    "Actions",
                                ].map((heading) => (
                                    <th
                                        key={heading}
                                        style={tableHeader}
                                    >
                                        {heading}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {filteredUsers.map((item) => (
                                <tr key={item.id}>
                                    <td style={tableCell}>
                                        {item.id}
                                    </td>

                                    <td
                                        style={{
                                            ...tableCell,
                                            fontWeight: "600",
                                        }}
                                    >
                                        {item.username}
                                    </td>

                                    <td style={tableCell}>
                                        {item.email}
                                    </td>

                                    <td style={tableCell}>
                                        <span
                                            style={{
                                                ...badge,
                                                background:
                                                    item.role === "admin"
                                                        ? "#ede9fe"
                                                        : "#e0f2fe",
                                                color:
                                                    item.role === "admin"
                                                        ? "#7c3aed"
                                                        : "#0369a1",
                                            }}
                                        >
                                            {item.role === "admin"
                                                ? "Admin"
                                                : "User"}
                                        </span>
                                    </td>

                                    <td style={tableCell}>
                                        {item.role === "admin" ? (
                                            <span
                                                style={{
                                                    ...badge,
                                                    background: "#ede9fe",
                                                    color: "#7c3aed",
                                                }}
                                            >
                                                Admin
                                            </span>
                                        ) : (
                                            <select
                                                value={item.plan || "normal"}
                                                onChange={(e) =>
                                                    handleChangePlan(
                                                        item.id,
                                                        e.target.value
                                                    )
                                                }
                                                style={selectStyle}
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

                                    <td style={tableCell}>
                                        {item.verified ? (
                                            <span
                                                style={{
                                                    color: "#16a34a",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                ✓ Verified
                                            </span>
                                        ) : (
                                            <span
                                                style={{
                                                    color: "#dc2626",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                ✕ Unverified
                                            </span>
                                        )}
                                    </td>

                                    <td style={tableCell}>
                                        {formatDateTime(item.created_at)}
                                    </td>

                                    <td style={tableCell}>
                                        {item.role === "admin" ? (
                                            <span
                                                style={{
                                                    color: "#64748b",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                Protected
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    handleDeleteUser(
                                                        item.id,
                                                        item.username,
                                                        item.role
                                                    )
                                                }
                                                style={deleteButton}
                                            >
                                                🗑 Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="8"
                                        style={{
                                            padding: "30px",
                                            textAlign: "center",
                                            color: "#64748b",
                                        }}
                                    >
                                        No users found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Create User Modal */}
                {showCreateUser && (
                    <div style={modalOverlay}>
                        <div style={modal}>
                            <h2>Create User</h2>

                            <form onSubmit={handleCreateUser}>
                                <input
                                    placeholder="Username"
                                    value={newUser.username}
                                    onChange={(e) =>
                                        setNewUser({
                                            ...newUser,
                                            username: e.target.value,
                                        })
                                    }
                                    style={modalInput}
                                />

                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={newUser.email}
                                    onChange={(e) =>
                                        setNewUser({
                                            ...newUser,
                                            email: e.target.value,
                                        })
                                    }
                                    style={modalInput}
                                />

                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={newUser.password}
                                    onChange={(e) =>
                                        setNewUser({
                                            ...newUser,
                                            password: e.target.value,
                                        })
                                    }
                                    style={modalInput}
                                />

                                <select
                                    value={newUser.plan}
                                    onChange={(e) =>
                                        setNewUser({
                                            ...newUser,
                                            plan: e.target.value,
                                        })
                                    }
                                    style={modalInput}
                                >
                                    <option value="normal">
                                        Normal
                                    </option>

                                    <option value="premium">
                                        Premium
                                    </option>
                                </select>

                                <div
                                    style={{
                                        display: "flex",
                                        gap: "10px",
                                        justifyContent: "flex-end",
                                        marginTop: "15px",
                                    }}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowCreateUser(false)
                                        }
                                        style={cancelButton}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        style={primaryButton}
                                    >
                                        Create User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

/* =========================
   BUTTON STYLES
========================= */

const primaryButton = {
    padding: "10px 18px",
    border: "none",
    borderRadius: "7px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
};

const deleteButton = {
    padding: "8px 12px",
    border: "none",
    borderRadius: "6px",
    background: "#fee2e2",
    color: "#b91c1c",
    cursor: "pointer",
    fontWeight: "600",
};

const cancelButton = {
    padding: "10px 18px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    background: "white",
    cursor: "pointer",
};

const searchInput = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    fontSize: "14px",
};

const selectStyle = {
    padding: "7px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    background: "white",
};

const tableHeader = {
    padding: "12px 10px",
    borderBottom: "2px solid #e2e8f0",
    fontSize: "13px",
};

const tableCell = {
    padding: "13px 10px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "14px",
    verticalAlign: "middle",
};

const badge = {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
};

const modalOverlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
};

const modal = {
    width: "420px",
    maxWidth: "90%",
    background: "white",
    borderRadius: "12px",
    padding: "25px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
};

const modalInput = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px",
    marginTop: "10px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
};

export default UserManagement;