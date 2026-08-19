import { useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

function BankAccountForm({ refresh }) {

    const [bankName, setBankName] = useState("");
    const [accountHolder, setAccountHolder] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifscCode, setIfscCode] = useState("");
    const [accountType, setAccountType] = useState("Savings");
    const [currentBalance, setCurrentBalance] = useState("");
    const [isPrimary, setIsPrimary] = useState(false);

    const addBankAccount = async () => {

        if (
            !bankName ||
            !accountHolder ||
            !accountNumber ||
            !ifscCode ||
            !currentBalance
        ) {
            toast.error("Please fill all required fields");
            return;
        }

        try {

            await api.post("/banks", {
                bank_name: bankName,
                account_holder: accountHolder,
                account_number: accountNumber,
                ifsc_code: ifscCode,
                account_type: accountType,
                current_balance: Number(currentBalance),
                is_primary: isPrimary,
            });

            toast.success(
                "Bank account added successfully"
            );

            setBankName("");
            setAccountHolder("");
            setAccountNumber("");
            setIfscCode("");
            setAccountType("Savings");
            setCurrentBalance("");
            setIsPrimary(false);

            if (refresh) {
                refresh();
            }

        } catch (error) {

            console.log(
                "BANK ACCOUNT ERROR:",
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
                "Unable to add bank account"
            );
        }
    };

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

            <h2>Add Bank Account</h2>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(2, 1fr)",
                    gap: "15px",
                    marginTop: "20px",
                }}
            >

                <input
                    type="text"
                    placeholder="Bank Name"
                    value={bankName}
                    onChange={(e) =>
                        setBankName(e.target.value)
                    }
                    style={inputStyle}
                />

                <input
                    type="text"
                    placeholder="Account Holder Name"
                    value={accountHolder}
                    onChange={(e) =>
                        setAccountHolder(
                            e.target.value
                        )
                    }
                    style={inputStyle}
                />

                <input
                    type="text"
                    placeholder="Account Number"
                    value={accountNumber}
                    onChange={(e) =>
                        setAccountNumber(
                            e.target.value
                        )
                    }
                    style={inputStyle}
                />

                <input
                    type="text"
                    placeholder="IFSC Code"
                    value={ifscCode}
                    onChange={(e) =>
                        setIfscCode(
                            e.target.value.toUpperCase()
                        )
                    }
                    style={inputStyle}
                />

                <select
                    value={accountType}
                    onChange={(e) =>
                        setAccountType(
                            e.target.value
                        )
                    }
                    style={inputStyle}
                >
                    <option value="Savings">
                        Savings
                    </option>

                    <option value="Current">
                        Current
                    </option>

                    <option value="Salary">
                        Salary
                    </option>
                </select>

                <input
                    type="number"
                    placeholder="Current Balance"
                    value={currentBalance}
                    onChange={(e) =>
                        setCurrentBalance(
                            e.target.value
                        )
                    }
                    style={inputStyle}
                />

            </div>

            <label
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "20px",
                }}
            >

                <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) =>
                        setIsPrimary(
                            e.target.checked
                        )
                    }
                />

                Set as primary account

            </label>

            <button
                onClick={addBankAccount}
                style={{
                    marginTop: "20px",
                    padding: "12px 25px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "7px",
                    cursor: "pointer",
                    fontSize: "15px",
                }}
            >
                Add Bank Account
            </button>

        </div>
    );
}

const inputStyle = {
    width: "100%",
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "7px",
    boxSizing: "border-box",
};

export default BankAccountForm;