import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

function SavingsGoalList({ refresh }) {

    const [goals, setGoals] = useState([]);
    const [banks, setBanks] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingBanks, setLoadingBanks] = useState(true);

    // Add amount state for each goal
    const [amounts, setAmounts] = useState({});

    // Bank account selected for each goal
    const [selectedBanks, setSelectedBanks] =
        useState({});

    // History
    const [selectedGoal, setSelectedGoal] =
        useState(null);

    const [history, setHistory] =
        useState([]);

    const [historyLoading, setHistoryLoading] =
        useState(false);

    // ==================================================
    // FETCH BANK ACCOUNTS
    // ==================================================

    const fetchBanks = async () => {

        try {

            setLoadingBanks(true);

            const response =
                await api.get("/banks");

            const bankList =
                Array.isArray(response.data)
                    ? response.data
                    : [];

            setBanks(bankList);

            // Set primary bank as default
            // for all existing goals

            const primaryBank =
                bankList.find(
                    (bank) =>
                        bank.is_primary === true
                );

            if (primaryBank) {

                setSelectedBanks((prev) => {

                    const updated = {
                        ...prev,
                    };

                    goals.forEach((goal) => {

                        if (
                            !updated[goal.id]
                        ) {
                            updated[goal.id] =
                                String(
                                    primaryBank.id
                                );
                        }

                    });

                    return updated;
                });

            }

        } catch (error) {

            console.log(
                "Bank fetch error:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to load bank accounts"
            );

        } finally {

            setLoadingBanks(false);
        }
    };

    // ==================================================
    // FETCH GOALS
    // ==================================================

    const fetchGoals = async () => {

        try {

            setLoading(true);

            const response =
                await api.get(
                    "/savings-goals"
                );

            const goalList =
                Array.isArray(response.data)
                    ? response.data
                    : [];

            setGoals(goalList);

            // If goals already contain bank_account_id,
            // use those accounts automatically.

            setSelectedBanks((prev) => {

                const updated = {
                    ...prev,
                };

                goalList.forEach((goal) => {

                    if (
                        goal.bank_account_id
                    ) {

                        updated[goal.id] =
                            String(
                                goal.bank_account_id
                            );
                    }

                });

                return updated;
            });

        } catch (error) {

            console.log(
                "Fetch goals error:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to load savings goals"
            );

        } finally {

            setLoading(false);
        }
    };

    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {

        fetchGoals();
        fetchBanks();

    }, [refresh]);

    // ==================================================
    // GET BANK
    // ==================================================

    const getBank = (bankId) => {

        if (!bankId) {
            return null;
        }

        return banks.find(
            (bank) =>
                String(bank.id) ===
                String(bankId)
        );
    };

    // ==================================================
    // BANK DISPLAY
    // ==================================================

    const getBankDisplayName = (bankId) => {

        const bank =
            getBank(bankId);

        if (!bank) {
            return "Unknown Account";
        }

        return (
            bank.bank_name +
            (
                bank.account_number
                    ? ` - ****${String(
                          bank.account_number
                      ).slice(-4)}`
                    : ""
            ) +
            (
                bank.is_primary
                    ? " (Primary)"
                    : ""
            )
        );
    };

    // ==================================================
    // ADD AMOUNT
    // ==================================================

    const handleAddAmount = async (goalId) => {

        const amount =
            amounts[goalId];

        const bankAccountId =
            selectedBanks[goalId];

        if (
            !amount ||
            Number(amount) <= 0
        ) {

            toast.error(
                "Enter a valid amount"
            );

            return;
        }

        if (!bankAccountId) {

            toast.error(
                "Please select the bank account"
            );

            return;
        }

        try {

            /*
             * IMPORTANT:
             * The backend must accept bank_account_id
             * for this endpoint.
             */

            await api.post(
                `/savings-goals/${goalId}/add-amount`,
                {
                    amount:
                        Number(amount),

                    bank_account_id:
                        Number(
                            bankAccountId
                        ),
                }
            );

            toast.success(
                `₹${Number(amount).toLocaleString(
                    "en-IN"
                )} added from ${getBankDisplayName(
                    bankAccountId
                )}`
            );

            // Clear amount
            setAmounts((prev) => ({
                ...prev,
                [goalId]: "",
            }));

            // Reload goals
            await fetchGoals();

            // Reload history if open
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

    // ==================================================
    // FETCH HISTORY
    // ==================================================

    const fetchHistory = async (goalId) => {

        try {

            setHistoryLoading(true);

            const response =
                await api.get(
                    `/savings-goals/${goalId}/history`
                );

            setHistory(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {

            console.log(
                "History error:",
                error.response?.data ||
                error
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

    // ==================================================
    // VIEW HISTORY
    // ==================================================

    const handleViewHistory = (goal) => {

        setSelectedGoal(goal);
        setHistory([]);

        fetchHistory(goal.id);
    };

    // ==================================================
    // DELETE GOAL
    // ==================================================

    const handleDelete = async (goalId) => {

        const confirmed =
            window.confirm(
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

    // ==================================================
    // LOADING
    // ==================================================

    if (loading) {

        return (
            <div
                style={{
                    marginTop: "30px",
                }}
            >
                Loading savings goals...
            </div>
        );
    }

    // ==================================================
    // RENDER
    // ==================================================

    return (

        <div
            style={{
                marginTop: "30px",
            }}
        >

            <h2>
                My Savings Goals
            </h2>

            {/* =================================
                NO GOALS
            ================================= */}

            {goals.length === 0 && (

                <div
                    style={{
                        background: "white",
                        padding: "25px",
                        borderRadius: "12px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.08)",
                    }}
                >
                    No savings goals found.
                </div>
            )}

            {/* =================================
                GOALS CARDS
            ================================= */}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "20px",
                }}
            >

                {goals.map((goal) => {

                    const target =
                        Number(
                            goal.target_amount ||
                            0
                        );

                    const current =
                        Number(
                            goal.current_amount ||
                            0
                        );

                    const remaining =
                        Math.max(
                            target - current,
                            0
                        );

                    const percentage =
                        target > 0
                            ? Math.min(
                                (current /
                                    target) *
                                    100,
                                100
                            )
                            : 0;

                    const selectedBankId =
                        selectedBanks[
                            goal.id
                        ];

                    const selectedBank =
                        getBank(
                            selectedBankId
                        );

                    return (

                        <div
                            key={goal.id}
                            style={{
                                background:
                                    "white",
                                padding:
                                    "25px",
                                borderRadius:
                                    "12px",
                                boxShadow:
                                    "0 2px 10px rgba(0,0,0,0.08)",
                            }}
                        >

                            {/* GOAL NAME */}

                            <h2
                                style={{
                                    marginTop: 0,
                                }}
                            >
                                {goal.goal_name}
                            </h2>

                            {/* BANK ACCOUNT */}

                            <div
                                style={{
                                    background:
                                        "#eff6ff",
                                    border:
                                        "1px solid #bfdbfe",
                                    padding:
                                        "12px",
                                    borderRadius:
                                        "7px",
                                    marginBottom:
                                        "15px",
                                }}
                            >

                                <div
                                    style={{
                                        fontSize:
                                            "13px",
                                        color:
                                            "#64748b",
                                        marginBottom:
                                            "4px",
                                    }}
                                >
                                    Linked Bank Account
                                </div>

                                <div
                                    style={{
                                        fontWeight:
                                            "600",
                                        color:
                                            "#1e3a8a",
                                    }}
                                >
                                    💳{" "}
                                    {goal.bank_account_id
                                        ? getBankDisplayName(
                                              goal.bank_account_id
                                          )
                                        : "Bank account not available"}
                                </div>

                            </div>

                            {/* TARGET */}

                            <p>
                                <strong>
                                    Target:
                                </strong>{" "}
                                ₹{" "}
                                {target.toLocaleString(
                                    "en-IN"
                                )}
                            </p>

                            {/* SAVED */}

                            <p>
                                <strong>
                                    Saved:
                                </strong>{" "}
                                ₹{" "}
                                {current.toLocaleString(
                                    "en-IN"
                                )}
                            </p>

                            {/* REMAINING */}

                            <p>
                                <strong>
                                    Remaining:
                                </strong>{" "}
                                ₹{" "}
                                {remaining.toLocaleString(
                                    "en-IN"
                                )}
                            </p>

                            {/* PROGRESS BAR */}

                            <div
                                style={{
                                    width:
                                        "100%",
                                    height:
                                        "14px",
                                    background:
                                        "#e5e7eb",
                                    borderRadius:
                                        "10px",
                                    overflow:
                                        "hidden",
                                    marginTop:
                                        "15px",
                                }}
                            >

                                <div
                                    style={{
                                        width:
                                            `${percentage}%`,
                                        height:
                                            "100%",
                                        background:
                                            "#2563eb",
                                        transition:
                                            "width 0.3s",
                                    }}
                                />

                            </div>

                            <p
                                style={{
                                    marginTop:
                                        "8px",
                                }}
                            >
                                {percentage.toFixed(
                                    1
                                )}
                                % completed
                            </p>

                            {/* =================================
                                SELECT BANK FOR ADD MONEY
                            ================================= */}

                            <div
                                style={{
                                    marginTop:
                                        "20px",
                                }}
                            >

                                <label
                                    style={{
                                        display:
                                            "block",
                                        fontWeight:
                                            "600",
                                        marginBottom:
                                            "6px",
                                    }}
                                >
                                    Account for Add Money
                                </label>

                                <select
                                    value={
                                        selectedBankId ||
                                        ""
                                    }
                                    onChange={(e) =>
                                        setSelectedBanks(
                                            (prev) => ({
                                                ...prev,
                                                [goal.id]:
                                                    e.target
                                                        .value,
                                            })
                                        )
                                    }
                                    disabled={
                                        loadingBanks ||
                                        banks.length ===
                                            0
                                    }
                                    style={{
                                        width:
                                            "100%",
                                        padding:
                                            "10px",
                                        border:
                                            "1px solid #ddd",
                                        borderRadius:
                                            "6px",
                                        background:
                                            "white",
                                        boxSizing:
                                            "border-box",
                                    }}
                                >

                                    <option value="">
                                        {loadingBanks
                                            ? "Loading accounts..."
                                            : "Select Bank Account"}
                                    </option>

                                    {banks.map(
                                        (bank) => (

                                            <option
                                                key={
                                                    bank.id
                                                }
                                                value={
                                                    bank.id
                                                }
                                            >
                                                {getBankDisplayName(
                                                    bank.id
                                                )}
                                            </option>

                                        )
                                    )}

                                </select>

                            </div>

                            {/* SELECTED ACCOUNT MESSAGE */}

                            {selectedBank && (

                                <div
                                    style={{
                                        marginTop:
                                            "8px",
                                        fontSize:
                                            "13px",
                                        color:
                                            "#dc2626",
                                        fontWeight:
                                            "600",
                                    }}
                                >
                                    💸 Money will be deducted
                                    from{" "}
                                    {getBankDisplayName(
                                        selectedBankId
                                    )}
                                </div>

                            )}

                            {/* =================================
                                ADD AMOUNT
                            ================================= */}

                            <div
                                style={{
                                    display:
                                        "flex",
                                    gap:
                                        "8px",
                                    marginTop:
                                        "12px",
                                }}
                            >

                                <input
                                    type="number"
                                    placeholder="Add amount"
                                    value={
                                        amounts[
                                            goal.id
                                        ] ||
                                        ""
                                    }
                                    onChange={(e) =>
                                        setAmounts(
                                            (prev) => ({
                                                ...prev,
                                                [goal.id]:
                                                    e.target
                                                        .value,
                                            })
                                        )
                                    }
                                    min="1"
                                    step="0.01"
                                    style={{
                                        flex: 1,
                                        padding:
                                            "10px",
                                        border:
                                            "1px solid #ddd",
                                        borderRadius:
                                            "6px",
                                    }}
                                />

                                <button
                                    onClick={() =>
                                        handleAddAmount(
                                            goal.id
                                        )
                                    }
                                    disabled={
                                        loadingBanks ||
                                        banks.length ===
                                            0
                                    }
                                    style={{
                                        background:
                                            "#16a34a",
                                        color:
                                            "white",
                                        border:
                                            "none",
                                        padding:
                                            "10px 15px",
                                        borderRadius:
                                            "6px",
                                        cursor:
                                            "pointer",
                                    }}
                                >
                                    Add
                                </button>

                            </div>

                            {/* HISTORY */}

                            <button
                                onClick={() =>
                                    handleViewHistory(
                                        goal
                                    )
                                }
                                style={{
                                    width:
                                        "100%",
                                    marginTop:
                                        "12px",
                                    background:
                                        "#2563eb",
                                    color:
                                        "white",
                                    border:
                                        "none",
                                    padding:
                                        "10px",
                                    borderRadius:
                                        "6px",
                                    cursor:
                                        "pointer",
                                }}
                            >
                                View History
                            </button>

                            {/* DELETE */}

                            <button
                                onClick={() =>
                                    handleDelete(
                                        goal.id
                                    )
                                }
                                style={{
                                    width:
                                        "100%",
                                    marginTop:
                                        "10px",
                                    background:
                                        "#dc2626",
                                    color:
                                        "white",
                                    border:
                                        "none",
                                    padding:
                                        "10px",
                                    borderRadius:
                                        "6px",
                                    cursor:
                                        "pointer",
                                }}
                            >
                                Delete Goal
                            </button>

                        </div>
                    );
                })}

            </div>

            {/* =====================================
                HISTORY
            ====================================== */}

            {selectedGoal && (

                <div
                    style={{
                        marginTop:
                            "40px",
                        background:
                            "white",
                        padding:
                            "25px",
                        borderRadius:
                            "12px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.08)",
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
                            Savings History -{" "}
                            {
                                selectedGoal.goal_name
                            }
                        </h2>

                        <button
                            onClick={() => {
                                setSelectedGoal(
                                    null
                                );
                                setHistory([]);
                            }}
                            style={{
                                background:
                                    "#64748b",
                                color:
                                    "white",
                                border:
                                    "none",
                                padding:
                                    "8px 14px",
                                borderRadius:
                                    "6px",
                                cursor:
                                    "pointer",
                            }}
                        >
                            Close
                        </button>

                    </div>

                    {historyLoading ? (

                        <p>
                            Loading history...
                        </p>

                    ) : history.length === 0 ? (

                        <p>
                            No transaction history
                            found for this goal.
                        </p>

                    ) : (

                        <div
                            style={{
                                overflowX:
                                    "auto",
                            }}
                        >

                            <table
                                style={{
                                    width:
                                        "100%",
                                    borderCollapse:
                                        "collapse",
                                    marginTop:
                                        "20px",
                                }}
                            >

                                <thead>

                                    <tr
                                        style={{
                                            background:
                                                "#1E3A8A",
                                            color:
                                                "white",
                                        }}
                                    >

                                        <th
                                            style={{
                                                padding:
                                                    "12px",
                                                textAlign:
                                                    "left",
                                            }}
                                        >
                                            Amount
                                        </th>

                                        <th
                                            style={{
                                                padding:
                                                    "12px",
                                                textAlign:
                                                    "left",
                                            }}
                                        >
                                            Bank Account
                                        </th>

                                        <th
                                            style={{
                                                padding:
                                                    "12px",
                                                textAlign:
                                                    "left",
                                            }}
                                        >
                                            Date
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {history.map(
                                        (
                                            transaction
                                        ) => (

                                            <tr
                                                key={
                                                    transaction.id
                                                }
                                                style={{
                                                    borderBottom:
                                                        "1px solid #e5e7eb",
                                                }}
                                            >

                                                {/* AMOUNT */}

                                                <td
                                                    style={{
                                                        padding:
                                                            "12px",
                                                    }}
                                                >
                                                    ₹{" "}
                                                    {Number(
                                                        transaction.amount ||
                                                        0
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </td>

                                                {/* BANK */}

                                                <td
                                                    style={{
                                                        padding:
                                                            "12px",
                                                        fontWeight:
                                                            "600",
                                                    }}
                                                >
                                                    {transaction.bank_account_id
                                                        ? getBankDisplayName(
                                                              transaction.bank_account_id
                                                          )
                                                        : selectedGoal.bank_account_id
                                                            ? getBankDisplayName(
                                                                  selectedGoal.bank_account_id
                                                              )
                                                            : "Account information unavailable"}
                                                </td>

                                                {/* DATE */}

                                                <td
                                                    style={{
                                                        padding:
                                                            "12px",
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