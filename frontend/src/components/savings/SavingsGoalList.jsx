import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

function SavingsGoalList({ refresh }) {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add amount state for each goal
    const [amounts, setAmounts] = useState({});

    // History
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] =
        useState(false);


    // ==========================================
    // FETCH GOALS
    // ==========================================

    const fetchGoals = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                "/savings-goals"
            );

            setGoals(response.data);

        } catch (error) {
            console.log("Fetch goals error:", error);

            toast.error(
                error.response?.data?.detail ||
                "Unable to load savings goals"
            );

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchGoals();
    }, [refresh]);


    // ==========================================
    // ADD AMOUNT
    // ==========================================

    const handleAddAmount = async (goalId) => {

        const amount = amounts[goalId];

        if (!amount || Number(amount) <= 0) {
            toast.error("Enter a valid amount");
            return;
        }

        try {

            await api.post(
                `/savings-goals/${goalId}/add-amount`,
                {
                    amount: Number(amount)
                }
            );

            toast.success("Amount added successfully");

            // Clear input for this goal
            setAmounts((prev) => ({
                ...prev,
                [goalId]: ""
            }));

            // Reload goals
            await fetchGoals();

            // If history for this goal is open,
            // reload it also
            if (
                selectedGoal &&
                selectedGoal.id === goalId
            ) {
                fetchHistory(goalId);
            }

        } catch (error) {

            console.log(
                "Add amount error:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to add amount"
            );
        }
    };


    // ==========================================
    // FETCH HISTORY
    // ==========================================

    const fetchHistory = async (goalId) => {

        try {

            setHistoryLoading(true);

            const response = await api.get(
                `/savings-goals/${goalId}/history`
            );

            console.log(
                "History response:",
                response.data
            );

            setHistory(response.data);

        } catch (error) {

            console.log(
                "History error:",
                error.response?.data || error
            );

            setHistory([]);

            toast.error(
                error.response?.data?.detail ||
                "Unable to load history"
            );

        } finally {

            setHistoryLoading(false);
        }
    };


    // ==========================================
    // VIEW HISTORY
    // ==========================================

    const handleViewHistory = (goal) => {

        setSelectedGoal(goal);
        setHistory([]);

        fetchHistory(goal.id);
    };


    // ==========================================
    // DELETE GOAL
    // ==========================================

    const handleDelete = async (goalId) => {

        const confirmed = window.confirm(
            "Are you sure you want to delete this savings goal?"
        );

        if (!confirmed) {
            return;
        }

        try {

            await api.delete(
                `/savings-goals/${goalId}`
            );

            toast.success(
                "Savings goal deleted successfully"
            );

            // Close history if deleted goal was selected
            if (
                selectedGoal &&
                selectedGoal.id === goalId
            ) {
                setSelectedGoal(null);
                setHistory([]);
            }

            fetchGoals();

        } catch (error) {

            console.log(
                "Delete error:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to delete savings goal"
            );
        }
    };


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {
        return (
            <div style={{ marginTop: "30px" }}>
                Loading savings goals...
            </div>
        );
    }


    return (

        <div style={{ marginTop: "30px" }}>

            <h2>My Savings Goals</h2>


            {/* ================================= */}
            {/* NO GOALS */}
            {/* ================================= */}

            {goals.length === 0 && (

                <div
                    style={{
                        background: "white",
                        padding: "25px",
                        borderRadius: "12px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.08)"
                    }}
                >
                    No savings goals found.
                </div>

            )}


            {/* ================================= */}
            {/* GOALS CARDS */}
            {/* ================================= */}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "20px"
                }}
            >

                {goals.map((goal) => {

                    const target = Number(
                        goal.target_amount || 0
                    );

                    const current = Number(
                        goal.current_amount || 0
                    );

                    const remaining = Math.max(
                        target - current,
                        0
                    );

                    const percentage =
                        target > 0
                            ? Math.min(
                                (current / target) * 100,
                                100
                            )
                            : 0;


                    return (

                        <div
                            key={goal.id}
                            style={{
                                background: "white",
                                padding: "25px",
                                borderRadius: "12px",
                                boxShadow:
                                    "0 2px 10px rgba(0,0,0,0.08)"
                            }}
                        >

                            <h2
                                style={{
                                    marginTop: 0
                                }}
                            >
                                {goal.goal_name}
                            </h2>


                            <p>
                                <strong>Target:</strong>
                                {" "}₹{" "}
                                {target.toLocaleString("en-IN")}
                            </p>


                            <p>
                                <strong>Saved:</strong>
                                {" "}₹{" "}
                                {current.toLocaleString("en-IN")}
                            </p>


                            <p>
                                <strong>Remaining:</strong>
                                {" "}₹{" "}
                                {remaining.toLocaleString("en-IN")}
                            </p>


                            {/* PROGRESS BAR */}

                            <div
                                style={{
                                    width: "100%",
                                    height: "14px",
                                    background: "#e5e7eb",
                                    borderRadius: "10px",
                                    overflow: "hidden",
                                    marginTop: "15px"
                                }}
                            >

                                <div
                                    style={{
                                        width: `${percentage}%`,
                                        height: "100%",
                                        background: "#2563eb",
                                        transition: "width 0.3s"
                                    }}
                                />

                            </div>


                            <p
                                style={{
                                    marginTop: "8px"
                                }}
                            >
                                {percentage.toFixed(1)}% completed
                            </p>


                            {/* ================================= */}
                            {/* ADD AMOUNT - STAYS IN CARD */}
                            {/* ================================= */}

                            <div
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                    marginTop: "20px"
                                }}
                            >

                                <input
                                    type="number"
                                    placeholder="Add amount"
                                    value={
                                        amounts[goal.id] || ""
                                    }
                                    onChange={(e) =>
                                        setAmounts((prev) => ({
                                            ...prev,
                                            [goal.id]:
                                                e.target.value
                                        }))
                                    }
                                    min="1"
                                    style={{
                                        flex: 1,
                                        padding: "10px",
                                        border:
                                            "1px solid #ddd",
                                        borderRadius: "6px"
                                    }}
                                />


                                <button
                                    onClick={() =>
                                        handleAddAmount(goal.id)
                                    }
                                    style={{
                                        background: "#16a34a",
                                        color: "white",
                                        border: "none",
                                        padding: "10px 15px",
                                        borderRadius: "6px",
                                        cursor: "pointer"
                                    }}
                                >
                                    Add
                                </button>

                            </div>


                            {/* ================================= */}
                            {/* HISTORY BUTTON */}
                            {/* ================================= */}

                            <button
                                onClick={() =>
                                    handleViewHistory(goal)
                                }
                                style={{
                                    width: "100%",
                                    marginTop: "12px",
                                    background: "#2563eb",
                                    color: "white",
                                    border: "none",
                                    padding: "10px",
                                    borderRadius: "6px",
                                    cursor: "pointer"
                                }}
                            >
                                View History
                            </button>


                            {/* DELETE */}

                            <button
                                onClick={() =>
                                    handleDelete(goal.id)
                                }
                                style={{
                                    width: "100%",
                                    marginTop: "10px",
                                    background: "#dc2626",
                                    color: "white",
                                    border: "none",
                                    padding: "10px",
                                    borderRadius: "6px",
                                    cursor: "pointer"
                                }}
                            >
                                Delete Goal
                            </button>

                        </div>

                    );

                })}

            </div>


            {/* ===================================== */}
            {/* HISTORY AT BOTTOM OF PAGE */}
            {/* ===================================== */}

            {selectedGoal && (

                <div
                    style={{
                        marginTop: "40px",
                        background: "white",
                        padding: "25px",
                        borderRadius: "12px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.08)"
                    }}
                >

                    <div
                        style={{
                            display: "flex",
                            justifyContent:
                                "space-between",
                            alignItems: "center"
                        }}
                    >

                        <h2>
                            Savings History -{" "}
                            {selectedGoal.goal_name}
                        </h2>


                        <button
                            onClick={() => {
                                setSelectedGoal(null);
                                setHistory([]);
                            }}
                            style={{
                                background: "#64748b",
                                color: "white",
                                border: "none",
                                padding: "8px 14px",
                                borderRadius: "6px",
                                cursor: "pointer"
                            }}
                        >
                            Close
                        </button>

                    </div>


                    {historyLoading ? (

                        <p>Loading history...</p>

                    ) : history.length === 0 ? (

                        <p>
                            No transaction history found
                            for this goal.
                        </p>

                    ) : (

                        <div
                            style={{
                                overflowX: "auto"
                            }}
                        >

                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse:
                                        "collapse",
                                    marginTop: "20px"
                                }}
                            >

                                <thead>

                                    <tr
                                        style={{
                                            background:
                                                "#1E3A8A",
                                            color: "white"
                                        }}
                                    >

                                        <th
                                            style={{
                                                padding: "12px",
                                                textAlign: "left"
                                            }}
                                        >
                                            Amount Added
                                        </th>

                                        <th
                                            style={{
                                                padding: "12px",
                                                textAlign: "left"
                                            }}
                                        >
                                            Date
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {history.map(
                                        (transaction) => (

                                            <tr
                                                key={
                                                    transaction.id
                                                }
                                                style={{
                                                    borderBottom:
                                                        "1px solid #e5e7eb"
                                                }}
                                            >

                                                <td
                                                    style={{
                                                        padding: "12px"
                                                    }}
                                                >
                                                    ₹{" "}
                                                    {Number(
                                                        transaction.amount
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </td>


                                                <td
                                                    style={{
                                                        padding: "12px"
                                                    }}
                                                >
                                                    {
                                                        transaction.transaction_date
                                                    }
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            )}

        </div>

    );
}

export default SavingsGoalList;