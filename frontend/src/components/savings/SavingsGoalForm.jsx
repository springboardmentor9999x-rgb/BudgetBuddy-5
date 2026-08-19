import { useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

function SavingsGoalForm({ refresh }) {
    const [goalName, setGoalName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [currentAmount, setCurrentAmount] = useState("0");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!goalName.trim()) {
            toast.error("Please enter a goal name");
            return;
        }

        if (!targetAmount || Number(targetAmount) <= 0) {
            toast.error("Target amount must be greater than 0");
            return;
        }

        if (Number(currentAmount) < 0) {
            toast.error("Current amount cannot be negative");
            return;
        }

        if (Number(currentAmount) > Number(targetAmount)) {
            toast.error(
                "Current amount cannot be greater than target amount"
            );
            return;
        }

        try {
            setLoading(true);

            await api.post("/savings-goals", {
                goal_name: goalName.trim(),
                target_amount: Number(targetAmount),
                current_amount: Number(currentAmount),
            });

            toast.success("Savings goal created successfully");

            setGoalName("");
            setTargetAmount("");
            setCurrentAmount("0");

            refresh();

        } catch (error) {
            console.log("Savings goal create error:", error);

            toast.error(
                error.response?.data?.detail ||
                "Unable to create savings goal"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                background: "white",
                padding: "25px",
                borderRadius: "12px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                marginTop: "25px",
            }}
        >
            <h2 style={{ marginTop: 0 }}>
                Create New Savings Goal
            </h2>

            <form onSubmit={handleSubmit}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "15px",
                    }}
                >
                    {/* GOAL NAME */}
                    <div>
                        <label>Goal Name</label>

                        <input
                            type="text"
                            placeholder="Example: Buy a Laptop"
                            value={goalName}
                            onChange={(e) =>
                                setGoalName(e.target.value)
                            }
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginTop: "6px",
                                boxSizing: "border-box",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                            }}
                        />
                    </div>

                    {/* TARGET AMOUNT */}
                    <div>
                        <label>Target Amount</label>

                        <input
                            type="number"
                            placeholder="Example: 50000"
                            value={targetAmount}
                            onChange={(e) =>
                                setTargetAmount(e.target.value)
                            }
                            min="1"
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginTop: "6px",
                                boxSizing: "border-box",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                            }}
                        />
                    </div>

                    {/* CURRENT AMOUNT */}
                    <div>
                        <label>Current Saved Amount</label>

                        <input
                            type="number"
                            placeholder="Example: 5000"
                            value={currentAmount}
                            onChange={(e) =>
                                setCurrentAmount(e.target.value)
                            }
                            min="0"
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginTop: "6px",
                                boxSizing: "border-box",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                            }}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        marginTop: "20px",
                        background: loading
                            ? "#94a3b8"
                            : "#2563eb",
                        color: "white",
                        border: "none",
                        padding: "11px 20px",
                        borderRadius: "6px",
                        cursor: loading
                            ? "not-allowed"
                            : "pointer",
                        fontSize: "15px",
                    }}
                >
                    {loading
                        ? "Creating..."
                        : "Create Savings Goal"}
                </button>
            </form>
        </div>
    );
}

export default SavingsGoalForm;