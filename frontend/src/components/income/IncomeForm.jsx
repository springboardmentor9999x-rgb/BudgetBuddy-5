import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import "../../styles/income.css";

function IncomeForm({ refresh }) {
    const [source, setSource] = useState("");
    const [category, setCategory] = useState("Salary");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    
    const [banks, setBanks] = useState([]);
    const [bankAccountId, setBankAccountId] = useState("");

    // ==========================================
    // LOAD USER'S BANK ACCOUNTS
    // ==========================================

    useEffect(() => {
        loadBanks();
    }, []);

    const loadBanks = async () => {
        try {
            const response = await api.get("/banks");

            console.log("BANK API RESPONSE:", response.data);

            const bankList = Array.isArray(response.data)
                ? response.data
                : [];

            setBanks(bankList);

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
    // ADD INCOME
    // ==========================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!source) {
            toast.error("Enter income source");
            return;
        }

        if (!amount || Number(amount) <= 0) {
            toast.error("Enter a valid amount");
            return;
        }

        if (!date) {
            toast.error("Select a date");
            return;
        }

        if (!bankAccountId) {
            toast.error(
                "Please select a bank account"
            );
            return;
        }

        try {
            await api.post("/income", {
                source: source,
                category: category,
                amount: Number(amount),
                description: description || null,
                date: date,
                bank_account_id:
                    Number(bankAccountId),
            });

            toast.success(
                "Income added successfully"
            );

            // Clear form
            setSource("");
            setCategory("Salary");
            setAmount("");
            setDescription("");
            setDate("");

            // Keep selected bank
            // so user can add another transaction
            if (refresh) {
                refresh();
            }

        } catch (error) {
            console.log(
                "ADD INCOME ERROR:",
                error
            );

            console.log(
                "STATUS:",
                error.response?.status
            );

            console.log(
                "DATA:",
                error.response?.data
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to add income"
            );
        }
    };

    return (
        <div className="income-form">

            <h2>Add Income</h2>

            <form onSubmit={handleSubmit}>

                {/* SOURCE */}

                <input
                    type="text"
                    placeholder="Income Source"
                    value={source}
                    onChange={(e) =>
                        setSource(e.target.value)
                    }
                />

                {/* CATEGORY */}

                <select
                    value={category}
                    onChange={(e) =>
                        setCategory(e.target.value)
                    }
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
                        setAmount(e.target.value)
                    }
                />

                {/* BANK ACCOUNT */}

                <select
                    value={bankAccountId}
                    onChange={(e) =>
                        setBankAccountId(
                            e.target.value
                        )
                    }
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
                                ? ` - ****${String(bank.account_number).slice(-4)}`
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
                />

                {/* DATE */}

                <input
                    type="date"
                    value={date}
                    onChange={(e) =>
                        setDate(e.target.value)
                    }
                />

                {/* BUTTON */}

                <button type="submit">
                    Add Income
                </button>

            </form>

            {/* NO BANK MESSAGE */}

            {banks.length === 0 && (
                <p
                    style={{
                        color: "#dc2626",
                        marginTop: "10px",
                    }}
                >
                    No bank account found. Please
                    add a bank account first.
                </p>
            )}

        </div>
    );
}

export default IncomeForm;