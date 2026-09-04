import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

function SavingsGoalForm({ refresh }) {

    const [goalName, setGoalName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [currentAmount, setCurrentAmount] = useState("0");

    const [bankAccountId, setBankAccountId] = useState("");
    const [bankAccounts, setBankAccounts] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingBanks, setLoadingBanks] = useState(true);


    // ==================================================
    // LOAD BANK ACCOUNTS
    // ==================================================

    useEffect(() => {

        const loadBankAccounts = async () => {

            try {

                setLoadingBanks(true);

                const response =
                    await api.get("/banks");

                setBankAccounts(
                    response.data || []
                );

            } catch (error) {

                console.log(
                    "BANK ACCOUNT LOAD ERROR:",
                    error.response?.data || error
                );

                toast.error(
                    "Unable to load bank accounts"
                );

            } finally {

                setLoadingBanks(false);
            }
        };

        loadBankAccounts();

    }, []);


    // ==================================================
    // SUBMIT
    // ==================================================

    const handleSubmit = async (e) => {

        e.preventDefault();


        if (!goalName.trim()) {

            toast.error(
                "Please enter a goal name"
            );

            return;
        }


        if (
            !targetAmount ||
            Number(targetAmount) <= 0
        ) {

            toast.error(
                "Target amount must be greater than 0"
            );

            return;
        }


        if (Number(currentAmount) < 0) {

            toast.error(
                "Current amount cannot be negative"
            );

            return;
        }


        if (
            Number(currentAmount) >
            Number(targetAmount)
        ) {

            toast.error(
                "Current amount cannot be greater than target amount"
            );

            return;
        }


        if (!bankAccountId) {

            toast.error(
                "Please select a bank account"
            );

            return;
        }


        try {

            setLoading(true);


            await api.post(
                "/savings-goals",
                {
                    goal_name:
                        goalName.trim(),

                    target_amount:
                        Number(targetAmount),

                    current_amount:
                        Number(currentAmount),

                    bank_account_id:
                        Number(bankAccountId),
                }
            );


            toast.success(
                "Savings goal created successfully"
            );


            setGoalName("");

            setTargetAmount("");

            setCurrentAmount("0");

            setBankAccountId("");


            refresh();


        } catch (error) {

            console.log(
                "Savings goal create error:",
                error.response?.data || error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to create savings goal"
            );

        } finally {

            setLoading(false);
        }
    };


    // ==================================================
    // RENDER
    // ==================================================

    return (

        <div
            style={{
                background: "white",
                padding: "25px",
                borderRadius: "12px",
                boxShadow:
                    "0 2px 10px rgba(0,0,0,0.08)",
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

                        <label>
                            Goal Name
                        </label>

                        <input
                            type="text"
                            placeholder="Example: Buy a Laptop"
                            value={goalName}
                            onChange={(e) =>
                                setGoalName(
                                    e.target.value
                                )
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

                        <label>
                            Target Amount
                        </label>

                        <input
                            type="number"
                            placeholder="Example: 50000"
                            value={targetAmount}
                            onChange={(e) =>
                                setTargetAmount(
                                    e.target.value
                                )
                            }
                            min="1"
                            step="0.01"
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

                        <label>
                            Current Saved Amount
                        </label>

                        <input
                            type="number"
                            placeholder="Example: 5000"
                            value={currentAmount}
                            onChange={(e) =>
                                setCurrentAmount(
                                    e.target.value
                                )
                            }
                            min="0"
                            step="0.01"
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


                    {/* BANK ACCOUNT */}

                    <div>

                        <label>
                            Bank Account
                        </label>

                        <select
                            value={bankAccountId}
                            onChange={(e) =>
                                setBankAccountId(
                                    e.target.value
                                )
                            }
                            disabled={
                                loadingBanks ||
                                bankAccounts.length === 0
                            }
                            style={{
                                width: "100%",
                                padding: "10px",
                                marginTop: "6px",
                                border: "1px solid #ddd",
                                borderRadius: "6px",
                                background: "white",
                            }}
                        >

                            <option value="">
                                {loadingBanks
                                    ? "Loading bank accounts..."
                                    : bankAccounts.length === 0
                                        ? "No bank accounts found"
                                        : "Select Bank Account"
                                }
                            </option>


                            {bankAccounts.map(
                                (bank) => (

                                    <option
                                        key={bank.id}
                                        value={bank.id}
                                    >
                                        {bank.bank_name}
                                        {" - "}
                                        ****
                                        {String(
                                            bank.account_number
                                        ).slice(-4)}
                                    </option>

                                )
                            )}

                        </select>

                    </div>

                </div>


                <button
                    type="submit"
                    disabled={
                        loading ||
                        loadingBanks ||
                        bankAccounts.length === 0
                    }
                    style={{
                        marginTop: "20px",
                        background:
                            loading ||
                            loadingBanks ||
                            bankAccounts.length === 0
                                ? "#94a3b8"
                                : "#2563eb",
                        color: "white",
                        border: "none",
                        padding: "11px 20px",
                        borderRadius: "6px",
                        cursor:
                            loading ||
                            loadingBanks ||
                            bankAccounts.length === 0
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