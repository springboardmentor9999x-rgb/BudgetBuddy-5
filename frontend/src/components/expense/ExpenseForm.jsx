import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

function ExpenseForm({ refresh }) {
    const [category, setCategory] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("UPI");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");

    const [banks, setBanks] = useState([]);
    const [bankAccountId, setBankAccountId] = useState("");

    // ==========================================
    // LOAD BANK ACCOUNTS
    // ==========================================

    useEffect(() => {
        loadBanks();
    }, []);

    const loadBanks = async () => {
        try {
            const response = await api.get("/banks");

            console.log(
                "BANK API RESPONSE:",
                response.data
            );

            const bankList = Array.isArray(response.data)
                ? response.data
                : [];

            setBanks(bankList);

            // Automatically select primary bank
            const primaryBank = bankList.find(
                (bank) => bank.is_primary === true
            );

            if (primaryBank) {
                setBankAccountId(
                    String(primaryBank.id)
                );
            }

        } catch (error) {
            console.error(
                "BANK LOAD ERROR:",
                error
            );

            console.error(
                "STATUS:",
                error.response?.status
            );

            console.error(
                "DATA:",
                error.response?.data
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to load bank accounts"
            );
        }
    };

    // ==========================================
    // ADD EXPENSE
    // ==========================================

    const addExpense = async (e) => {
        e.preventDefault();

        if (!category) {
            toast.error("Please select a category");
            return;
        }

        if (!amount || Number(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (!date) {
            toast.error("Please select a date");
            return;
        }

        if (!bankAccountId) {
            toast.error(
                "Please select a bank account"
            );
            return;
        }

        try {
            await api.post("/expenses", {
                category: category,
                payment_method: paymentMethod,
                amount: Number(amount),
                description: description || null,
                date: date,
                bank_account_id:
                    Number(bankAccountId),
            });

            toast.success(
                "Expense Added Successfully"
            );

            // Clear form
            setCategory("");
            setPaymentMethod("UPI");
            setAmount("");
            setDescription("");
            setDate("");

            // Keep selected bank
            // for the next transaction

            if (refresh) {
                refresh();
            }

        } catch (error) {
            console.error(
                "EXPENSE ERROR:",
                error
            );

            console.error(
                "STATUS:",
                error.response?.status
            );

            console.error(
                "DATA:",
                error.response?.data
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to add expense"
            );
        }
    };

    return (
        <div
            style={{
                width: "100%",
                maxWidth: "900px",
                margin: "30px auto",
                padding: "25px",
                background: "#fff",
                borderRadius: "12px",
                boxShadow:
                    "0 4px 15px rgba(0,0,0,0.08)",
                boxSizing: "border-box",
            }}
        >
            <h2
                style={{
                    margin: "0 0 20px 0",
                    color: "#222",
                }}
            >
                Add Expense
            </h2>

            <form
                onSubmit={addExpense}
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "1fr 1fr",
                    gap: "16px",
                }}
            >

                {/* CATEGORY */}

                <select
                    value={category}
                    onChange={(e) =>
                        setCategory(e.target.value)
                    }
                    style={{
                        width: "100%",
                        padding: "12px 14px",
                        border:
                            "1px solid #d1d5db",
                        borderRadius: "7px",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        background: "#fff",
                    }}
                >
                    <option value="">
                        Select Category
                    </option>

                    <option value="Food">
                        Food
                    </option>

                    <option value="Travel">
                        Travel
                    </option>

                    <option value="Shopping">
                        Shopping
                    </option>

                    <option value="Bills">
                        Bills
                    </option>

                    <option value="Education">
                        Education
                    </option>

                    <option value="Entertainment">
                        Entertainment
                    </option>

                    <option value="Healthcare">
                        Healthcare
                    </option>

                    <option value="Rent">
                        Rent
                    </option>

                    <option value="Other">
                        Other
                    </option>
                </select>

                {/* PAYMENT METHOD */}

                <select
                    value={paymentMethod}
                    onChange={(e) =>
                        setPaymentMethod(
                            e.target.value
                        )
                    }
                    style={{
                        width: "100%",
                        padding: "12px 14px",
                        border:
                            "1px solid #d1d5db",
                        borderRadius: "7px",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        background: "#fff",
                    }}
                >
                    <option value="UPI">
                        UPI
                    </option>

                    <option value="Bank Transfer">
                        Bank Transfer
                    </option>

                    <option value="Debit Card">
                        Debit Card
                    </option>

                    <option value="Credit Card">
                        Credit Card
                    </option>

                    <option value="Net Banking">
                        Net Banking
                    </option>

                    <option value="Cash">
                        Cash
                    </option>

                    <option value="Other">
                        Other
                    </option>
                </select>

                {/* AMOUNT */}

                <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) =>
                        setAmount(e.target.value)
                    }
                    min="1"
                    step="0.01"
                    style={{
                        width: "100%",
                        padding: "12px 14px",
                        border:
                            "1px solid #d1d5db",
                        borderRadius: "7px",
                        fontSize: "14px",
                        boxSizing: "border-box",
                    }}
                />

                {/* BANK ACCOUNT */}

                <select
                    value={bankAccountId}
                    onChange={(e) =>
                        setBankAccountId(
                            e.target.value
                        )
                    }
                    style={{
                        width: "100%",
                        padding: "12px 14px",
                        border:
                            "1px solid #d1d5db",
                        borderRadius: "7px",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        background: "#fff",
                    }}
                >
                    <option value="">
                        Select Bank Account
                    </option>

                    {banks.map((bank) => (
                        <option
                            key={bank.id}
                            value={bank.id}
                        >
                            {bank.bank_name}

                            {bank.account_number
                                ? ` - ****${String(
                                      bank.account_number
                                  ).slice(-4)}`
                                : ""}

                            {bank.is_primary
                                ? " (Primary)"
                                : ""}
                        </option>
                    ))}
                </select>

                {/* DESCRIPTION */}

                <textarea
                    placeholder="Description"
                    value={description}
                    onChange={(e) =>
                        setDescription(
                            e.target.value
                        )
                    }
                    rows="3"
                    style={{
                        width: "100%",
                        padding: "12px 14px",
                        border:
                            "1px solid #d1d5db",
                        borderRadius: "7px",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        resize: "vertical",
                        gridColumn: "1 / -1",
                    }}
                />

                {/* DATE */}

                <input
                    type="date"
                    value={date}
                    onChange={(e) =>
                        setDate(e.target.value)
                    }
                    style={{
                        width: "100%",
                        padding: "12px 14px",
                        border:
                            "1px solid #d1d5db",
                        borderRadius: "7px",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        gridColumn: "1 / -1",
                    }}
                />

                {/* BUTTON */}

                <button
                    type="submit"
                    style={{
                        width: "100%",
                        padding: "13px 20px",
                        background: "#dc2626",
                        color: "white",
                        border: "none",
                        borderRadius: "7px",
                        cursor: "pointer",
                        fontSize: "16px",
                        fontWeight: "600",
                        gridColumn: "1 / -1",
                    }}
                >
                    Add Expense
                </button>

            </form>

            {/* NO BANK MESSAGE */}

            {banks.length === 0 && (
                <p
                    style={{
                        color: "#dc2626",
                        marginTop: "12px",
                    }}
                >
                    No bank account found. Please
                    add a bank account first.
                </p>
            )}
        </div>
    );
}

export default ExpenseForm;