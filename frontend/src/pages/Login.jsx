import { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Login() {

    const navigate = useNavigate();
    const { loadUser } = useAuth();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {

        e.preventDefault();

        if (!username.trim()) {
            toast.error("Please enter username or email");
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

            console.log("LOGIN USER:", username.trim());

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

            console.log("LOGIN RESPONSE:", response.data);

            const token = response.data.access_token;

            if (!token) {
                toast.error("Login token not received");
                return;
            }

            // Remove previous account token
            localStorage.removeItem("token");

            // Save new account token
            localStorage.setItem("token", token);

            // Load the newly logged-in user
            await loadUser();

            toast.success("Login successful");

            /*
             * IMPORTANT:
             * All users first go to the normal Dashboard.
             * Their role-based features are handled later.
             */

            navigate("/dashboard", {
                replace: true
            });

        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error.response?.data || error
            );

            toast.error(
                error.response?.data?.detail ||
                "Invalid username/email or password"
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
                        "0 0 20px rgba(0,0,0,.2)",
                }}
            >

                <h1
                    style={{
                        textAlign: "center",
                        marginBottom: "5px",
                    }}
                >
                    BudgetBuddy
                </h1>

                <h2
                    style={{
                        textAlign: "center",
                        marginTop: "0",
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
                        autoComplete="username"
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
                        autoComplete="current-password"
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