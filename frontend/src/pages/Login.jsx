import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {

    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {

        e.preventDefault();

        if (!username.trim()) {
            toast.error("Please enter your username or email");
            return;
        }

        if (!password) {
            toast.error("Please enter your password");
            return;
        }

        try {

            setLoading(true);

            // Clear previous account token
            localStorage.removeItem("token");

            const formData = new URLSearchParams();

            formData.append(
                "username",
                username.trim()
            );

            formData.append(
                "password",
                password
            );

            const response = await api.post(
                "/auth/login",
                formData,
                {
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded",
                    },
                }
            );

            const token = response.data.access_token;

            if (!token) {
                throw new Error("Token was not returned");
            }

            // Save new account token
            localStorage.setItem(
                "token",
                token
            );

            console.log("NEW LOGIN TOKEN SAVED");

            toast.success("Login successful");

            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 500);

        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );

            // Remove token if login fails
            localStorage.removeItem("token");

            let errorMessage =
                "Invalid username/email or password";

            const detail = error.response?.data?.detail;

            // FastAPI validation errors
            if (Array.isArray(detail)) {

                errorMessage =
                    detail[0]?.msg ||
                    "Invalid username/email or password";

            }

            // Normal FastAPI error
            else if (typeof detail === "string") {

                errorMessage = detail;

            }

            // Network/server error
            else if (error.message === "Network Error") {

                errorMessage =
                    "Unable to connect to the server";

            }

            toast.error(errorMessage);

        } finally {

            setLoading(false);

        }
    };

    return (

        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                background: "#f3f4f6",
            }}
        >

            <div
                style={{
                    width: "420px",
                    background: "white",
                    padding: "35px",
                    borderRadius: "10px",
                    boxShadow:
                        "0 0 20px rgba(0,0,0,.15)",
                }}
            >

                <h1
                    style={{
                        textAlign: "center",
                        marginBottom: "5px"
                    }}
                >
                    BudgetBuddy
                </h1>

                <h2
                    style={{
                        textAlign: "center",
                        marginTop: "0"
                    }}
                >
                    Login
                </h2>

                <form onSubmit={handleLogin}>

                    <input
                        type="text"
                        placeholder="Username or Email"
                        value={username}
                        onChange={(e) =>
                            setUsername(e.target.value)
                        }
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "12px",
                            marginTop: "20px",
                            boxSizing: "border-box",
                        }}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "12px",
                            marginTop: "15px",
                            boxSizing: "border-box",
                        }}
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "12px",
                            marginTop: "20px",
                            background: loading
                                ? "#94a3b8"
                                : "#3949db",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: loading
                                ? "not-allowed"
                                : "pointer",
                        }}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </button>

                </form>

            </div>

        </div>
    );
}

export default Login;