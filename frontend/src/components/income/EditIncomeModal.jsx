import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

function EditIncomeModal({
    show,
    income,
    onClose,
    refresh,
}) {
    const [source, setSource] = useState("");
    const [category, setCategory] = useState("Salary");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");

    const [banks, setBanks] = useState([]);
    const [bankAccountId, setBankAccountId] = useState("");

    // ==========================================
    // LOAD INCOME DATA
    // ==========================================

    useEffect(() => {
        if (income) {
            setSource(income.source || "");
            setCategory(income.category || "Salary");
            setAmount(income.amount || "");
            setDescription(income.description || "");
            setDate(income.date || "");

            setBankAccountId(
                income.bank_account_id
                    ? String(income.bank_account_id)
                    : ""
            );

            loadBanks();
        }
    }, [income]);

    // ==========================================
    // LOAD BANK ACCOUNTS
    // ==========================================

    const loadBanks = async () => {
        try {
            const response = await api.get("/banks");

            const bankList = Array.isArray(response.data)
                ? response.data
                : [];

            setBanks(bankList);

            // If transaction has no bank,
            // select primary bank
            if (
                income &&
                !income.bank_account_id
            ) {
                const primaryBank = bankList.find(
                    (bank) => bank.is_primary === true
                );

                if (primaryBank) {
                    setBankAccountId(
                        String(primaryBank.id)
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

    if (!show || !income) {
        return null;
    }

    // ==========================================
    // UPDATE INCOME
    // ==========================================

    const updateIncome = async () => {

        if (!source) {
            toast.error(
                "Please enter income source"
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

            const token =
                localStorage.getItem("token");

            await api.put(
                `/income/${income.id}`,
                {
                    source: source,
                    category: category,
                    amount: Number(amount),
                    description:
                        description || null,
                    date: date,
                    bank_account_id:
                        Number(bankAccountId),
                },
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            toast.success(
                "Income updated successfully"
            );

            if (refresh) {
                refresh();
            }

            onClose();

        } catch (error) {

            console.error(
                "UPDATE INCOME ERROR:",
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
                "Unable to update income"
            );
        }
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
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
                    Edit Income
                </h2>

                {/* SOURCE */}

                <input
                    type="text"
                    placeholder="Income Source"
                    value={source}
                    onChange={(e) =>
                        setSource(
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
                    <option value="Salary">
                        Salary
                    </option>

                    <option value="Business">
                        Business
                    </option>

                    <option value="Freelance">
                        Freelance
                    </option>

                    <option value="Gift">
                        Gift
                    </option>

                    <option value="Investment">
                        Investment
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
                        marginTop: "20px",
                        display: "flex",
                        gap: "10px",
                    }}
                >

                    <button
                        onClick={updateIncome}
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

export default EditIncomeModal;