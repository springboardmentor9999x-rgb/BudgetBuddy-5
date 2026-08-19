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

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirm_password: ""
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e) => {

        e.preventDefault();

        if (formData.password !== formData.confirm_password) {
            toast.error("Passwords do not match");
            return;
        }

        try {

            await api.post("/auth/register", {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                confirm_password: formData.confirm_password
            });

               toast.success("OTP sent to your email");

               navigate("/verify-otp", {
                    state: {
                        email: formData.email,
                        username: formData.username,
                        password: formData.password,
                    },
               });
            

        } catch (err) {

            toast.error(
                err.response?.data?.detail ||
                "Registration Failed"
            );

        }

    };

    return (

        <div className="auth-container">

            {/* Left Panel */}

            <div className="auth-left">

                <div className="logo">

                    <img src={logo} alt="logo" />

                    <span>BudgetBuddy</span>

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

            {/* Right Panel */}

            <div className="auth-right">

                <div className="auth-card">

                    <h2>Create Account</h2>

                    <span>
                        Join BudgetBuddy and manage your money smarter.
                    </span>

                    <form onSubmit={handleRegister}>

                        <div className="form-group">

                            <label>Full Name</label>

                            <input
                                type="text"
                                name="username"
                                placeholder="Enter your name"
                                value={formData.username}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="form-group">

                            <label>Email Address</label>

                            <input
                                type="email"
                                name="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />

                        </div>

                        <div className="form-group">

                            <label>Password</label>

                            <div className="password-box">

                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
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

                        <div className="form-group">

                            <label>Confirm Password</label>

                            <div className="password-box">

                                <input
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="confirm_password"
                                    placeholder="Confirm Password"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    required
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

                        <button
                            className="auth-btn"
                            type="submit"
                        >
                            Create Account
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