import { useState } from "react";
import { toast } from "react-toastify";
import api from "../services/api";

function Login() {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!username.trim()) {
            toast.error("Please enter your username");
            return;
        }

        if (!password) {
            toast.error("Please enter your password");
            return;
        }

        try {
            setLoading(true);

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

            // Save token of the account that just logged in
            localStorage.setItem(
                "token",
                response.data.access_token
            );

            // Show login success notification
            toast.success("Login successful");

            // Redirect to this account's dashboard
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 500);

        } catch (error) {

            console.log("Login error:", error);

            toast.error(
                error.response?.data?.detail ||
                "Login failed"
            );

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
                height: "100vh",
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
                        "0 0 20px rgba(0,0,0,.2)",
                }}
            >

                <h1 style={{ textAlign: "center" }}>
                    BudgetBuddy
                </h1>

                <h2 style={{ textAlign: "center" }}>
                    Login
                </h2>

                <form onSubmit={handleLogin}>

                    {/* USERNAME */}

                    <input
                        type="text"
                        placeholder="Username"
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

                    {/* PASSWORD */}

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

                    {/* LOGIN BUTTON */}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "12px",
                            marginTop: "20px",
                            background:
                                loading
                                    ? "#94a3b8"
                                    : "#3949db",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor:
                                loading
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