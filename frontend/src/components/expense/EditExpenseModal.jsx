import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

function EditExpenseModal({
    show,
    expense,
    onClose,
    refresh,
}) {
    const [category, setCategory] = useState("");
    const [paymentMethod, setPaymentMethod] =
        useState("UPI");
    const [amount, setAmount] = useState("");
    const [description, setDescription] =
        useState("");
    const [date, setDate] = useState("");

    const [banks, setBanks] = useState([]);
    const [bankAccountId, setBankAccountId] =
        useState("");

    // ==========================================
    // LOAD EXPENSE DATA
    // ==========================================

    useEffect(() => {

        if (expense) {

            setCategory(
                expense.category || ""
            );

            setPaymentMethod(
                expense.payment_method || "UPI"
            );

            setAmount(
                expense.amount || ""
            );

            setDescription(
                expense.description || ""
            );

            setDate(
                expense.date || ""
            );

            setBankAccountId(
                expense.bank_account_id
                    ? String(
                          expense.bank_account_id
                      )
                    : ""
            );

            loadBanks();
        }

    }, [expense]);

    // ==========================================
    // LOAD BANK ACCOUNTS
    // ==========================================

    const loadBanks = async () => {

        try {

            const response =
                await api.get("/banks");

            const bankList =
                Array.isArray(response.data)
                    ? response.data
                    : [];

            setBanks(bankList);

            // If old transaction has no bank,
            // select primary bank

            if (
                expense &&
                !expense.bank_account_id
            ) {

                const primaryBank =
                    bankList.find(
                        (bank) =>
                            bank.is_primary === true
                    );

                if (primaryBank) {

                    setBankAccountId(
                        String(
                            primaryBank.id
                        )
                    );

                }
            }

        } catch (error) {

            console.error(
                "BANK LOAD ERROR:",
                error
            );

            toast.error(
                "Unable to load bank accounts"
            );
        }
    };

    if (!show || !expense) {
        return null;
    }

    // ==========================================
    // UPDATE EXPENSE
    // ==========================================

    const updateExpense = async () => {

        if (!category) {
            toast.error(
                "Please select a category"
            );
            return;
        }

        if (!amount || Number(amount) <= 0) {
            toast.error(
                "Please enter a valid amount"
            );
            return;
        }

        if (!date) {
            toast.error(
                "Please select a date"
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

            await api.put(
                `/expenses/${expense.id}`,
                {
                    category: category,
                    payment_method:
                        paymentMethod,
                    amount: Number(amount),
                    description:
                        description || null,
                    date: date,
                    bank_account_id:
                        Number(bankAccountId),
                }
            );

            toast.success(
                "Expense updated successfully"
            );

            onClose();

            if (refresh) {
                refresh();
            }

        } catch (error) {

            console.error(
                "UPDATE EXPENSE ERROR:",
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
                "Unable to update expense"
            );
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background:
                    "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
            }}
        >

            <div
                style={{
                    width: "450px",
                    maxWidth: "90%",
                    background: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    boxSizing: "border-box",
                }}
            >

                <h2>
                    Edit Expense
                </h2>

                {/* CATEGORY */}

                <select
                    value={category}
                    onChange={(e) =>
                        setCategory(
                            e.target.value
                        )
                    }
                    style={{
                        width: "100%",
                        padding: "11px",
                        marginTop: "15px",
                        boxSizing:
                            "border-box",
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
                        padding: "11px",
                        marginTop: "15px",
                        boxSizing:
                            "border-box",
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
                        setAmount(
                            e.target.value
                        )
                    }
                    style={{
                        width: "100%",
                        padding: "11px",
                        marginTop: "15px",
                        boxSizing:
                            "border-box",
                    }}
                />

                {/* BANK */}

                <select
                    value={bankAccountId}
                    onChange={(e) =>
                        setBankAccountId(
                            e.target.value
                        )
                    }
                    style={{
                        width: "100%",
                        padding: "11px",
                        marginTop: "15px",
                        boxSizing:
                            "border-box",
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
                        padding: "11px",
                        marginTop: "15px",
                        boxSizing:
                            "border-box",
                        resize: "vertical",
                    }}
                />

                {/* DATE */}

                <input
                    type="date"
                    value={date}
                    onChange={(e) =>
                        setDate(
                            e.target.value
                        )
                    }
                    style={{
                        width: "100%",
                        padding: "11px",
                        marginTop: "15px",
                        boxSizing:
                            "border-box",
                    }}
                />

                {/* BUTTONS */}

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "20px",
                    }}
                >

                    <button
                        onClick={updateExpense}
                        style={{
                            flex: 1,
                            padding: "11px",
                            background:
                                "#2563eb",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor:
                                "pointer",
                        }}
                    >
                        Update
                    </button>

                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: "11px",
                            background:
                                "#6b7280",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor:
                                "pointer",
                        }}
                    >
                        Cancel
                    </button>

                </div>

            </div>

        </div>
    );
}

export default EditExpenseModal;