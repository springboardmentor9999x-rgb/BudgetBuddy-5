import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import api from "../services/api";
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../context/AuthContext";

function Profile() {
    const navigate = useNavigate();

    const {
        user,
        loading: authLoading,
        loadUser,
    } = useAuth();

    const [profile, setProfile] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editingAccount, setEditingAccount] =
        useState(false);

    const [editingProfile, setEditingProfile] =
        useState(false);

    const [changingPassword, setChangingPassword] =
        useState(false);

    // ==========================================
    // ACCOUNT FIELDS
    // ==========================================

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");

    // ==========================================
    // PROFILE FIELDS
    // ==========================================

    const [fullName, setFullName] = useState("");
    const [monthlyIncome, setMonthlyIncome] =
        useState("");
    const [financialPreferences, setFinancialPreferences] =
        useState("");

    // ==========================================
    // PASSWORD
    // ==========================================

    const [currentPassword, setCurrentPassword] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    // ==========================================
    // PROFILE IMAGE
    // ==========================================

    const [profileImage, setProfileImage] =
        useState(
            localStorage.getItem("profileImage") || ""
        );

    // ==========================================
    // LOAD USER + PROFILE
    // ==========================================

    const loadProfileData = async () => {
        try {
            setLoading(true);

            const userResponse =
                await api.get("/auth/me");

            const currentUser =
                userResponse.data;

            setUsername(
                currentUser.username || ""
            );

            setEmail(
                currentUser.email || ""
            );

            try {
                const profileResponse =
                    await api.get("/profiles/me");

                const profileData =
                    profileResponse.data;

                setProfile(profileData);

                setFullName(
                    profileData.full_name || ""
                );

                setMonthlyIncome(
                    profileData.monthly_income ?? ""
                );

                setFinancialPreferences(
                    profileData.financial_preferences ||
                    ""
                );

            } catch (profileError) {

                if (
                    profileError.response?.status ===
                    404
                ) {
                    setProfile(null);
                } else {
                    throw profileError;
                }
            }

        } catch (error) {

            console.error(
                "Profile loading error:",
                error
            );

            if (
                error.response?.status === 401
            ) {
                localStorage.removeItem("token");

                navigate("/login");

                return;
            }

            toast.error(
                error.response?.data?.detail ||
                "Unable to load profile"
            );

        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // LOAD
    // ==========================================

    useEffect(() => {

        if (!authLoading && user) {
            loadProfileData();
        }

    }, [authLoading, user]);

    // ==========================================
    // PROFILE IMAGE
    // ==========================================

    const handleProfileImage = (event) => {

        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            toast.error(
                "Please select an image file"
            );

            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error(
                "Image must be smaller than 2 MB"
            );

            return;
        }

        const reader = new FileReader();

        reader.onload = () => {

            const image =
                reader.result;

            setProfileImage(image);

            localStorage.setItem(
                "profileImage",
                image
            );

            toast.success(
                "Profile picture updated"
            );
        };

        reader.readAsDataURL(file);
    };

    // ==========================================
    // REMOVE PROFILE IMAGE
    // ==========================================

    const removeProfileImage = () => {

        setProfileImage("");

        localStorage.removeItem(
            "profileImage"
        );

        toast.success(
            "Profile picture removed"
        );
    };

    // ==========================================
    // SAVE ACCOUNT
    // ==========================================

    const handleAccountSave = async (event) => {

        event.preventDefault();

        if (!username.trim()) {
            toast.error(
                "Username cannot be empty"
            );

            return;
        }

        if (!email.trim()) {
            toast.error(
                "Email cannot be empty"
            );

            return;
        }

        try {

            setSaving(true);

            const response =
                await api.put(
                    "/auth/account",
                    {
                        username:
                            username.trim(),

                        email:
                            email.trim()
                    }
                );

            toast.success(
                response.data?.message ||
                "Account information updated"
            );

            setEditingAccount(false);

            await loadUser();

            await loadProfileData();

        } catch (error) {

            console.error(
                "Account update error:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to update account"
            );

        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // SAVE PROFILE
    // ==========================================

    const handleProfileSave = async (event) => {

        event.preventDefault();

        if (!fullName.trim()) {

            toast.error(
                "Full name cannot be empty"
            );

            return;
        }

        try {

            setSaving(true);

            let response;

            if (profile) {

                response =
                    await api.put(
                        "/profiles/me",
                        {
                            full_name:
                                fullName.trim(),

                            monthly_income:
                                monthlyIncome === ""
                                    ? null
                                    : Number(
                                        monthlyIncome
                                    ),

                            financial_preferences:
                                financialPreferences.trim()
                        }
                    );

            } else {

                response =
                    await api.post(
                        "/profiles",
                        {
                            full_name:
                                fullName.trim(),

                            monthly_income:
                                monthlyIncome === ""
                                    ? null
                                    : Number(
                                        monthlyIncome
                                    ),

                            financial_preferences:
                                financialPreferences.trim()
                        }
                    );
            }

            setProfile(response.data);

            setEditingProfile(false);

            toast.success(
                profile
                    ? "Profile updated successfully"
                    : "Profile created successfully"
            );

        } catch (error) {

            console.error(
                "Profile save error:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to save profile"
            );

        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // CHANGE PASSWORD
    // ==========================================

    const handleChangePassword = async (event) => {

        event.preventDefault();

        if (!currentPassword) {

            toast.error(
                "Enter your current password"
            );

            return;
        }

        if (newPassword.length < 8) {

            toast.error(
                "New password must contain at least 8 characters"
            );

            return;
        }

        if (newPassword !== confirmPassword) {

            toast.error(
                "New passwords do not match"
            );

            return;
        }

        try {

            setSaving(true);

            const response =
                await api.put(
                    "/auth/change-password",
                    {
                        current_password:
                            currentPassword,

                        new_password:
                            newPassword
                    }
                );

            toast.success(
                response.data?.message ||
                "Password changed successfully"
            );

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setChangingPassword(false);

        } catch (error) {

            console.error(
                "Password change error:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to change password"
            );

        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // LOGOUT
    // ==========================================

    const handleLogout = () => {

        localStorage.removeItem("token");

        toast.success(
            "Logged out successfully"
        );

        setTimeout(() => {
            window.location.href =
                "/login";
        }, 500);
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (authLoading || loading) {

        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                }}
            >
                Loading profile...
            </div>
        );
    }

    // ==========================================
    // NOT LOGGED IN
    // ==========================================

    if (!user) {

        return (
            <div
                style={{
                    textAlign: "center",
                    paddingTop: "100px",
                }}
            >
                <h2>
                    Please login first
                </h2>

                <button
                    onClick={() =>
                        navigate("/login")
                    }
                >
                    Go to Login
                </button>
            </div>
        );
    }

    const isPremium =
        user.plan === "premium";

    const isAdmin =
        user.role === "admin";

    // ==========================================
    // MAIN PAGE
    // ==========================================

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
                    minWidth: 0,
                }}
            >

                <Navbar />

                <main
                    style={{
                        padding: "25px",
                        maxWidth: "1200px",
                        margin: "0 auto",
                    }}
                >

                    {/* ======================================
                        PROFILE HEADER
                    ====================================== */}

                    <div
                        style={{
                            background: "white",
                            borderRadius: "14px",
                            padding: "25px",
                            boxShadow:
                                "0 3px 12px rgba(0,0,0,0.08)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent:
                                "space-between",
                            gap: "20px",
                            flexWrap: "wrap",
                        }}
                    >

                        <div
                            style={{
                                display: "flex",
                                alignItems:
                                    "center",
                                gap: "20px",
                            }}
                        >

                            {/* PROFILE IMAGE */}

                            <div
                                style={{
                                    position:
                                        "relative",
                                }}
                            >

                                {profileImage ? (

                                    <img
                                        src={
                                            profileImage
                                        }
                                        alt="Profile"
                                        style={{
                                            width:
                                                "95px",
                                            height:
                                                "95px",
                                            borderRadius:
                                                "50%",
                                            objectFit:
                                                "cover",
                                            border:
                                                "4px solid #3949db",
                                        }}
                                    />

                                ) : (

                                    <div
                                        style={{
                                            width:
                                                "95px",
                                            height:
                                                "95px",
                                            borderRadius:
                                                "50%",
                                            background:
                                                "#e0e7ff",
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            justifyContent:
                                                "center",
                                            fontSize:
                                                "45px",
                                            border:
                                                "4px solid #3949db",
                                        }}
                                    >
                                        👤
                                    </div>
                                )}

                            </div>

                            <div>

                                <h1
                                    style={{
                                        margin:
                                            "0 0 6px",
                                    }}
                                >
                                    My Profile
                                </h1>

                                <div
                                    style={{
                                        color:
                                            "#64748b",
                                    }}
                                >
                                    Manage your
                                    BudgetBuddy
                                    account
                                </div>

                                <div
                                    style={{
                                        marginTop:
                                            "8px",
                                        fontWeight:
                                            "bold",
                                    }}
                                >
                                    Welcome,{" "}
                                    {user.username ||
                                        "User"}
                                </div>

                            </div>

                        </div>

                        {/* PROFILE IMAGE ACTIONS */}

                        <div
                            style={{
                                display:
                                    "flex",
                                gap: "10px",
                                flexWrap:
                                    "wrap",
                            }}
                        >

                            <label
                                style={{
                                    padding:
                                        "10px 15px",
                                    background:
                                        "#3949db",
                                    color:
                                        "white",
                                    borderRadius:
                                        "7px",
                                    cursor:
                                        "pointer",
                                    fontWeight:
                                        "bold",
                                }}
                            >
                                📷 Change Photo

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={
                                        handleProfileImage
                                    }
                                    style={{
                                        display:
                                            "none",
                                    }}
                                />
                            </label>

                            {profileImage && (

                                <button
                                    onClick={
                                        removeProfileImage
                                    }
                                    style={{
                                        padding:
                                            "10px 15px",
                                        background:
                                            "white",
                                        color:
                                            "#dc2626",
                                        border:
                                            "1px solid #dc2626",
                                        borderRadius:
                                            "7px",
                                        cursor:
                                            "pointer",
                                    }}
                                >
                                    Remove Photo
                                </button>
                            )}

                        </div>

                    </div>

                    {/* ======================================
                        ACCOUNT INFORMATION
                    ====================================== */}

                    <section
                        style={{
                            background:
                                "white",
                            marginTop:
                                "20px",
                            padding:
                                "25px",
                            borderRadius:
                                "14px",
                            boxShadow:
                                "0 3px 12px rgba(0,0,0,0.08)",
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
                                gap: "15px",
                            }}
                        >

                            <h2>
                                🔐 Account Information
                            </h2>

                            {!editingAccount && (

                                <button
                                    onClick={() =>
                                        setEditingAccount(
                                            true
                                        )
                                    }
                                    style={{
                                        padding:
                                            "10px 18px",
                                        background:
                                            "#3949db",
                                        color:
                                            "white",
                                        border:
                                            "none",
                                        borderRadius:
                                            "7px",
                                        cursor:
                                            "pointer",
                                        fontWeight:
                                            "bold",
                                    }}
                                >
                                    ✏️ Edit Account
                                </button>
                            )}

                        </div>

                        {!editingAccount ? (

                            <div
                                style={{
                                    display:
                                        "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fit, minmax(220px, 1fr))",
                                    gap: "25px",
                                    marginTop:
                                        "20px",
                                }}
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
                                    capitalize
                                />

                                <Info
                                    label="Subscription"
                                    value={
                                        isPremium
                                            ? "Premium 👑"
                                            : "Normal"
                                    }
                                    highlight={
                                        isPremium
                                    }
                                />

                                <Info
                                    label="Email Verification"
                                    value={
                                        user.verified
                                            ? "Verified ✅"
                                            : "Not Verified ❌"
                                    }
                                />

                                <Info
                                    label="Account Created"
                                    value={
                                        user.created_at
                                            ? new Date(
                                                user.created_at
                                            ).toLocaleDateString(
                                                "en-IN"
                                            )
                                            : "Not available"
                                    }
                                />

                            </div>

                        ) : (

                            <form
                                onSubmit={
                                    handleAccountSave
                                }
                                style={{
                                    marginTop:
                                        "20px",
                                }}
                            >

                                <Field
                                    label="Username"
                                    value={
                                        username
                                    }
                                    onChange={(e) =>
                                        setUsername(
                                            e.target.value
                                        )
                                    }
                                />

                                <Field
                                    label="Email"
                                    type="email"
                                    value={
                                        email
                                    }
                                    onChange={(e) =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                />

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        gap: "10px",
                                        marginTop:
                                            "10px",
                                    }}
                                >

                                    <button
                                        type="submit"
                                        disabled={
                                            saving
                                        }
                                        style={{
                                            padding:
                                                "11px 20px",
                                            background:
                                                "#16a34a",
                                            color:
                                                "white",
                                            border:
                                                "none",
                                            borderRadius:
                                                "7px",
                                            cursor:
                                                "pointer",
                                            fontWeight:
                                                "bold",
                                        }}
                                    >
                                        💾 Save
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUsername(
                                                user.username ||
                                                ""
                                            );

                                            setEmail(
                                                user.email ||
                                                ""
                                            );

                                            setEditingAccount(
                                                false
                                            );
                                        }}
                                        style={{
                                            padding:
                                                "11px 20px",
                                            background:
                                                "white",
                                            border:
                                                "1px solid #cbd5e1",
                                            borderRadius:
                                                "7px",
                                            cursor:
                                                "pointer",
                                        }}
                                    >
                                        Cancel
                                    </button>

                                </div>

                            </form>
                        )}

                    </section>

                    {/* ======================================
                        PERSONAL PROFILE
                    ====================================== */}

                    <section
                        style={{
                            background:
                                "white",
                            marginTop:
                                "20px",
                            padding:
                                "25px",
                            borderRadius:
                                "14px",
                            boxShadow:
                                "0 3px 12px rgba(0,0,0,0.08)",
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
                                📋 Personal Information
                            </h2>

                            {profile &&
                                !editingProfile && (

                                    <button
                                        onClick={() =>
                                            setEditingProfile(
                                                true
                                            )
                                        }
                                        style={{
                                            padding:
                                                "10px 18px",
                                            background:
                                                "#3949db",
                                            color:
                                                "white",
                                            border:
                                                "none",
                                            borderRadius:
                                                "7px",
                                            cursor:
                                                "pointer",
                                            fontWeight:
                                                "bold",
                                        }}
                                    >
                                        ✏️ Edit Profile
                                    </button>
                                )}

                        </div>

                        {!profile ||
                            editingProfile ? (

                            <form
                                onSubmit={
                                    handleProfileSave
                                }
                                style={{
                                    marginTop:
                                        "20px",
                                }}
                            >

                                {!profile && (

                                    <p
                                        style={{
                                            color:
                                                "#64748b",
                                        }}
                                    >
                                        Your profile
                                        hasn't been
                                        created yet.
                                        Enter your
                                        details below.
                                    </p>
                                )}

                                <Field
                                    label="Full Name"
                                    value={
                                        fullName
                                    }
                                    onChange={(e) =>
                                        setFullName(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter your full name"
                                />

                                <Field
                                    label="Monthly Income"
                                    type="number"
                                    value={
                                        monthlyIncome
                                    }
                                    onChange={(e) =>
                                        setMonthlyIncome(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter monthly income"
                                />

                                <label
                                    style={{
                                        display:
                                            "block",
                                        marginTop:
                                            "15px",
                                        fontWeight:
                                            "bold",
                                    }}
                                >
                                    Financial Preferences
                                </label>

                                <textarea
                                    value={
                                        financialPreferences
                                    }
                                    onChange={(e) =>
                                        setFinancialPreferences(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Example: Save 20% of monthly income"
                                    rows="5"
                                    style={{
                                        width:
                                            "100%",
                                        padding:
                                            "12px",
                                        marginTop:
                                            "7px",
                                        border:
                                            "1px solid #cbd5e1",
                                        borderRadius:
                                            "7px",
                                        boxSizing:
                                            "border-box",
                                        resize:
                                            "vertical",
                                    }}
                                />

                                <div
                                    style={{
                                        marginTop:
                                            "20px",
                                        display:
                                            "flex",
                                        gap: "10px",
                                    }}
                                >

                                    <button
                                        type="submit"
                                        disabled={
                                            saving
                                        }
                                        style={{
                                            padding:
                                                "11px 20px",
                                            background:
                                                "#16a34a",
                                            color:
                                                "white",
                                            border:
                                                "none",
                                            borderRadius:
                                                "7px",
                                            cursor:
                                                "pointer",
                                            fontWeight:
                                                "bold",
                                        }}
                                    >
                                        💾{" "}
                                        {profile
                                            ? "Save Changes"
                                            : "Create Profile"}
                                    </button>

                                    {profile && (

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setEditingProfile(
                                                    false
                                                )
                                            }
                                            style={{
                                                padding:
                                                    "11px 20px",
                                                background:
                                                    "white",
                                                border:
                                                    "1px solid #cbd5e1",
                                                borderRadius:
                                                    "7px",
                                                cursor:
                                                    "pointer",
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    )}

                                </div>

                            </form>

                        ) : (

                            <div
                                style={{
                                    marginTop:
                                        "20px",
                                }}
                            >

                                <Info
                                    label="Full Name"
                                    value={
                                        profile.full_name
                                    }
                                />

                                <div
                                    style={{
                                        marginTop:
                                            "20px",
                                    }}
                                >

                                    <Info
                                        label="Monthly Income"
                                        value={
                                            profile.monthly_income !==
                                            null &&
                                            profile.monthly_income !==
                                            undefined
                                                ? `₹${Number(
                                                    profile.monthly_income
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}`
                                                : "Not provided"
                                        }
                                    />

                                </div>

                                <div
                                    style={{
                                        marginTop:
                                            "20px",
                                    }}
                                >

                                    <Info
                                        label="Financial Preferences"
                                        value={
                                            profile.financial_preferences ||
                                            "Not provided"
                                        }
                                    />

                                </div>

                            </div>
                        )}

                    </section>

                    {/* ======================================
                        PREMIUM
                    ====================================== */}

                    {!isPremium &&
                        !isAdmin && (

                            <section
                                style={{
                                    marginTop:
                                        "20px",
                                    padding:
                                        "25px",
                                    borderRadius:
                                        "14px",
                                    background:
                                        "#fff7ed",
                                    border:
                                        "1px solid #fed7aa",
                                }}
                            >

                                <h2>
                                    👑 Upgrade to Premium
                                </h2>

                                <p
                                    style={{
                                        color:
                                            "#64748b",
                                    }}
                                >
                                    Unlock advanced
                                    financial reports,
                                    PDF and Excel
                                    downloads, and
                                    other premium
                                    features.
                                </p>

                                <button
                                    onClick={() =>
                                        navigate(
                                            "/premium"
                                        )
                                    }
                                    style={{
                                        padding:
                                            "12px 25px",
                                        background:
                                            "#f59e0b",
                                        color:
                                            "white",
                                        border:
                                            "none",
                                        borderRadius:
                                            "7px",
                                        cursor:
                                            "pointer",
                                        fontWeight:
                                            "bold",
                                    }}
                                >
                                    👑 View Premium Plans
                                </button>

                            </section>
                        )}

                    {isPremium && (

                        <section
                            style={{
                                marginTop:
                                    "20px",
                                padding:
                                    "25px",
                                borderRadius:
                                    "14px",
                                background:
                                    "#ecfdf5",
                                border:
                                    "1px solid #a7f3d0",
                            }}
                        >

                            <h2>
                                👑 Premium Membership
                            </h2>

                            <p
                                style={{
                                    color:
                                        "#166534",
                                }}
                            >
                                You are currently a
                                Premium member.
                            </p>

                            <div
                                style={{
                                    display:
                                        "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fit, minmax(220px, 1fr))",
                                    gap: "10px",
                                    marginTop:
                                        "15px",
                                }}
                            >

                                <Feature>
                                    ✓ Advanced Financial
                                    Reports
                                </Feature>

                                <Feature>
                                    ✓ PDF Report
                                    Downloads
                                </Feature>

                                <Feature>
                                    ✓ Excel Report
                                    Downloads
                                </Feature>

                                <Feature>
                                    ✓ Premium Financial
                                    Tools
                                </Feature>

                            </div>

                        </section>
                    )}

                    {/* ======================================
                        CHANGE PASSWORD
                    ====================================== */}

                    <section
                        style={{
                            background:
                                "white",
                            marginTop:
                                "20px",
                            padding:
                                "25px",
                            borderRadius:
                                "14px",
                            boxShadow:
                                "0 3px 12px rgba(0,0,0,0.08)",
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
                                🔐 Security
                            </h2>

                            {!changingPassword && (

                                <button
                                    onClick={() =>
                                        setChangingPassword(
                                            true
                                        )
                                    }
                                    style={{
                                        padding:
                                            "10px 18px",
                                        background:
                                            "#3949db",
                                        color:
                                            "white",
                                        border:
                                            "none",
                                        borderRadius:
                                            "7px",
                                        cursor:
                                            "pointer",
                                        fontWeight:
                                            "bold",
                                    }}
                                >
                                    🔑 Change Password
                                </button>
                            )}

                        </div>

                        {changingPassword && (

                            <form
                                onSubmit={
                                    handleChangePassword
                                }
                                style={{
                                    marginTop:
                                        "20px",
                                    maxWidth:
                                        "600px",
                                }}
                            >

                                <Field
                                    label="Current Password"
                                    type="password"
                                    value={
                                        currentPassword
                                    }
                                    onChange={(e) =>
                                        setCurrentPassword(
                                            e.target.value
                                        )
                                    }
                                />

                                <Field
                                    label="New Password"
                                    type="password"
                                    value={
                                        newPassword
                                    }
                                    onChange={(e) =>
                                        setNewPassword(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Minimum 8 characters"
                                />

                                <Field
                                    label="Confirm New Password"
                                    type="password"
                                    value={
                                        confirmPassword
                                    }
                                    onChange={(e) =>
                                        setConfirmPassword(
                                            e.target.value
                                        )
                                    }
                                />

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        gap: "10px",
                                        marginTop:
                                            "20px",
                                    }}
                                >

                                    <button
                                        type="submit"
                                        disabled={
                                            saving
                                        }
                                        style={{
                                            padding:
                                                "11px 20px",
                                            background:
                                                "#16a34a",
                                            color:
                                                "white",
                                            border:
                                                "none",
                                            borderRadius:
                                                "7px",
                                            cursor:
                                                "pointer",
                                            fontWeight:
                                                "bold",
                                        }}
                                    >
                                        🔐 Update Password
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setChangingPassword(
                                                false
                                            );

                                            setCurrentPassword(
                                                ""
                                            );

                                            setNewPassword(
                                                ""
                                            );

                                            setConfirmPassword(
                                                ""
                                            );
                                        }}
                                        style={{
                                            padding:
                                                "11px 20px",
                                            background:
                                                "white",
                                            border:
                                                "1px solid #cbd5e1",
                                            borderRadius:
                                                "7px",
                                            cursor:
                                                "pointer",
                                        }}
                                    >
                                        Cancel
                                    </button>

                                </div>

                            </form>
                        )}

                    </section>

                    {/* ======================================
                        LOGOUT
                    ====================================== */}

                    <section
                        style={{
                            background:
                                "white",
                            marginTop:
                                "20px",
                            marginBottom:
                                "40px",
                            padding:
                                "25px",
                            borderRadius:
                                "14px",
                            boxShadow:
                                "0 3px 12px rgba(0,0,0,0.08)",
                        }}
                    >

                        <h2>
                            🚪 Account Actions
                        </h2>

                        <p
                            style={{
                                color:
                                    "#64748b",
                            }}
                        >
                            Sign out from your
                            BudgetBuddy account.
                        </p>

                        <button
                            onClick={
                                handleLogout
                            }
                            style={{
                                padding:
                                    "12px 25px",
                                background:
                                    "#dc2626",
                                color:
                                    "white",
                                border:
                                    "none",
                                borderRadius:
                                    "7px",
                                cursor:
                                    "pointer",
                                fontWeight:
                                    "bold",
                            }}
                        >
                            🚪 Logout
                        </button>

                    </section>

                </main>

            </div>
        </div>
    );
}

// ======================================================
// SMALL COMPONENTS
// ======================================================

function Info({
    label,
    value,
    capitalize = false,
    highlight = false,
}) {
    return (
        <div>

            <div
                style={{
                    color: "#64748b",
                    fontSize: "14px",
                    marginBottom: "6px",
                }}
            >
                {label}
            </div>

            <div
                style={{
                    fontWeight: "bold",
                    fontSize: "17px",
                    color: highlight
                        ? "#d97706"
                        : "#111827",
                    textTransform:
                        capitalize
                            ? "capitalize"
                            : "none",
                }}
            >
                {value || "Not provided"}
            </div>

        </div>
    );
}

function Field({
    label,
    type = "text",
    value,
    onChange,
    placeholder = "",
}) {
    return (
        <div style={{ marginTop: "15px" }}>

            <label
                style={{
                    display: "block",
                    fontWeight: "bold",
                    marginBottom: "7px",
                }}
            >
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{
                    width: "100%",
                    padding: "12px",
                    border:
                        "1px solid #cbd5e1",
                    borderRadius: "7px",
                    boxSizing:
                        "border-box",
                    fontSize: "15px",
                }}
            />

        </div>
    );
}

function Feature({ children }) {
    return (
        <div
            style={{
                background: "white",
                padding: "12px",
                borderRadius: "7px",
                color: "#166534",
                fontWeight: "bold",
            }}
        >
            {children}
        </div>
    );
}

export default Profile;