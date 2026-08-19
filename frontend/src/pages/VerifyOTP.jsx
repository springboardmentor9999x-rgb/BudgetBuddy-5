import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import "../styles/Auth.css";

function VerifyOTP() {
    const location = useLocation();
    const navigate = useNavigate();

    const [email, setEmail] = useState(
        location.state?.email || ""
    );

    const username = location.state?.username || "";
    const password = location.state?.password || "";
    

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const verifyOTP = async (e) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error("Please enter your email");
            return;
        }

        if (otp.trim().length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }

        try {
            setLoading(true);

            await api.post("/auth/verify-otp", {
                email: email.trim(),
                otp: otp.trim(),
            });

            toast.success("Email Verified Successfully");

            try {
                const formData = new URLSearchParams();

                formData.append("username", username);
                formData.append("password", password);

                const loginResponse = await api.post(
                    "/auth/login",
                    formData,
                    {
                        headers: {
                            "Content-Type":
                                "application/x-www-form-urlencoded"
                        }
                    }
                );

                localStorage.setItem(
                    "token",
                    loginResponse.data.access_token
                );

                toast.success("New account created successfully");

                navigate("/dashboard");

            } catch (loginError) {

                console.log(
                    "Automatic login error:",
                    loginError
                );

                toast.success(
                    "Account verified. Please login."
                );

                navigate("/login");
            }

        } catch (err) {
            toast.error(
                err.response?.data?.detail ||
                "Invalid OTP"
            );
        } finally {
            setLoading(false);
        }
    };

    const resendOTP = async () => {
        if (!email.trim()) {
            toast.error("Email is missing. Please enter it again.");
            return;
        }

        try {
            setResending(true);

            await api.post(
                `/auth/resend-otp/${encodeURIComponent(
                    email.trim()
                )}`
            );

            toast.success("OTP Sent Again");

        } catch (err) {
            toast.error(
                err.response?.data?.detail ||
                "Unable to resend OTP"
            );
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="auth-container">

            <div className="auth-left">
                <h1>Email Verification</h1>

                <p>
                    Enter the verification code sent to your email.
                </p>
            </div>

            <div className="auth-right">

                <div className="auth-card">

                    <h2>Verify OTP</h2>

                    <div className="form-group">
                        <label>Email</label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <form onSubmit={verifyOTP}>

                        <div className="form-group">

                            <label>Verification Code</label>

                            <input
                                type="text"
                                maxLength="6"
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChange={(e) =>
                                    setOtp(
                                        e.target.value
                                            .replace(/\D/g, "")
                                            .slice(0, 6)
                                    )
                                }
                                required
                            />

                        </div>

                        <button
                            className="auth-btn"
                            type="submit"
                            disabled={loading}
                        >
                            {loading
                                ? "Verifying..."
                                : "Verify"}
                        </button>

                    </form>

                    <div
                        className="bottom-text"
                        style={{
                            cursor: resending
                                ? "not-allowed"
                                : "pointer",
                            opacity: resending ? 0.6 : 1,
                        }}
                        onClick={
                            resending
                                ? undefined
                                : resendOTP
                        }
                    >
                        {resending
                            ? "Sending OTP..."
                            : "Resend OTP"}
                    </div>

                </div>

            </div>

        </div>
    );
}

export default VerifyOTP;