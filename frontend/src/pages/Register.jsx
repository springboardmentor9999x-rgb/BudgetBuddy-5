import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from "react-toastify";

import PasswordStrength from "../components/auth/PasswordStrength";
import api from "../services/api";

import "../styles/Auth.css";
import logo from "../assets/logo.png";

function Register() {

    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirm_password: ""
    });

    // --------------------------------------------------
    // HANDLE INPUT CHANGE
    // --------------------------------------------------

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };

    // --------------------------------------------------
    // EMAIL VALIDATION
    // --------------------------------------------------

    const isValidEmail = (email) => {

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailPattern.test(email.trim());

    };

    // --------------------------------------------------
    // GET ERROR MESSAGE
    // --------------------------------------------------

    const getErrorMessage = (err) => {

        const detail = err.response?.data?.detail;

        // FastAPI/Pydantic validation error
        if (Array.isArray(detail)) {

            const firstError = detail[0];

            if (firstError?.msg) {

                const message = firstError.msg;

                if (
                    message.toLowerCase().includes("email") ||
                    message.toLowerCase().includes("valid")
                ) {
                    return "Please enter a valid email address";
                }

                return message;
            }

        }

        // Normal FastAPI HTTPException
        if (typeof detail === "string") {

            if (
                detail.toLowerCase().includes("email") &&
                detail.toLowerCase().includes("valid")
            ) {
                return "Please enter a valid email address";
            }

            return detail;
        }

        return "Registration Failed";

    };

    // --------------------------------------------------
    // REGISTER
    // --------------------------------------------------

    const handleRegister = async (e) => {

        e.preventDefault();

        // Prevent double-click
        if (loading) {
            return;
        }

        const username = formData.username.trim();
        const email = formData.email.trim().toLowerCase();
        const password = formData.password;
        const confirmPassword = formData.confirm_password;

        // --------------------------------------------------
        // USERNAME VALIDATION
        // --------------------------------------------------

        if (!username) {

            toast.error("Please enter your name");
            return;

        }

        if (username.length < 3) {

            toast.error("Name must be at least 3 characters");
            return;

        }

        // --------------------------------------------------
        // EMAIL VALIDATION
        // --------------------------------------------------

        if (!email) {

            toast.error("Please enter your email address");
            return;

        }

        if (!isValidEmail(email)) {

            toast.error("Please enter a valid email address");
            return;

        }

        // --------------------------------------------------
        // PASSWORD VALIDATION
        // --------------------------------------------------

        if (!password) {

            toast.error("Please enter a password");
            return;

        }

        if (password.length < 8) {

            toast.error(
                "Password must be at least 8 characters long"
            );
            return;

        }

        if (!/[A-Z]/.test(password)) {

            toast.error(
                "Password must contain at least one uppercase letter"
            );
            return;

        }

        if (!/[a-z]/.test(password)) {

            toast.error(
                "Password must contain at least one lowercase letter"
            );
            return;

        }

        if (!/\d/.test(password)) {

            toast.error(
                "Password must contain at least one number"
            );
            return;

        }

        if (!/[^A-Za-z0-9]/.test(password)) {

            toast.error(
                "Password must contain at least one special character"
            );
            return;

        }

        // --------------------------------------------------
        // CONFIRM PASSWORD
        // --------------------------------------------------

        if (!confirmPassword) {

            toast.error("Please confirm your password");
            return;

        }

        if (password !== confirmPassword) {

            toast.error("Passwords do not match");
            return;

        }

        // --------------------------------------------------
        // SEND REGISTER REQUEST
        // --------------------------------------------------

        try {

            setLoading(true);

            await api.post("/auth/register", {

                username: username,
                email: email,
                password: password,
                confirm_password: confirmPassword

            });

            // --------------------------------------------------
            // SUCCESS
            // --------------------------------------------------

            toast.success(
                "Account created successfully! OTP sent to your email."
            );

            navigate("/verify-otp", {

                state: {
                    email: email,
                    username: username,
                    password: password
                }

            });

        } catch (err) {

            console.error("Registration error:", err);

            toast.error(
                getErrorMessage(err)
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="auth-container">

            {/* LEFT PANEL */}

            <div className="auth-left">

                <div className="logo">

                    <img
                        src="/budgetbudy.png"
                        alt="BudgetBuddy logo"
                    />

                    <span>
                        BudgetBuddy
                    </span>

                </div>

                <h1>

                    Welcome!

                    <br />

                    Start Your

                    <br />

                    SMART JOURNEY

                </h1>

                <p>

                    Create your BudgetBuddy account and start tracking
                    your income, expenses and savings smarter.

                </p>

            </div>

            {/* RIGHT PANEL */}

            <div className="auth-right">

                <div className="auth-card">

                    <h2>
                        Create Account
                    </h2>

                    <span>
                        Join BudgetBuddy and manage your money smarter.
                    </span>

                    <form onSubmit={handleRegister}>

                        {/* FULL NAME */}

                        <div className="form-group">

                            <label>
                                Full Name
                            </label>

                            <input
                                type="text"
                                name="username"
                                placeholder="Enter your name"
                                value={formData.username}
                                onChange={handleChange}
                            />

                        </div>

                        {/* EMAIL */}

                        <div className="form-group">

                            <label>
                                Email Address
                            </label>

                            <input
                                type="text"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                inputMode="email"
                                autoComplete="email"
                            />

                        </div>

                        {/* PASSWORD */}

                        <div className="form-group">

                            <label>
                                Password
                            </label>

                            <div className="password-box">

                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            !showPassword
                                        )
                                    }
                                >

                                    {
                                        showPassword
                                            ? <FaEyeSlash />
                                            : <FaEye />
                                    }

                                </button>

                            </div>

                            <PasswordStrength
                                password={formData.password}
                            />

                        </div>

                        {/* CONFIRM PASSWORD */}

                        <div className="form-group">

                            <label>
                                Confirm Password
                            </label>

                            <div className="password-box">

                                <input
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="confirm_password"
                                    placeholder="Confirm Password"
                                    value={
                                        formData.confirm_password
                                    }
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                >

                                    {
                                        showConfirmPassword
                                            ? <FaEyeSlash />
                                            : <FaEye />
                                    }

                                </button>

                            </div>

                        </div>

                        {/* CREATE ACCOUNT BUTTON */}

                        <button
                            className="auth-btn"
                            type="submit"
                            disabled={loading}
                            style={{
                                opacity: loading ? 0.7 : 1,
                                cursor: loading
                                    ? "not-allowed"
                                    : "pointer"
                            }}
                        >

                            {
                                loading
                                    ? "Creating Account..."
                                    : "Create Account"
                            }

                        </button>

                    </form>

                    <div className="bottom-text">

                        Already have an account?

                        <Link to="/login">
                            {" "}Sign In
                        </Link>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Register;