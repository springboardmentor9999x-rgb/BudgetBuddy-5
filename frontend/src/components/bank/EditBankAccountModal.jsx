import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

function EditBankAccountModal({
    show,
    account,
    onClose,
    refresh,
}) {
    const [bankName, setBankName] = useState("");
    const [accountHolder, setAccountHolder] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifscCode, setIfscCode] = useState("");
    const [accountType, setAccountType] = useState("Savings");
    const [currentBalance, setCurrentBalance] = useState("");
    const [isPrimary, setIsPrimary] = useState(false);

    useEffect(() => {
        if (account) {
            setBankName(account.bank_name || "");
            setAccountHolder(
                account.account_holder || ""
            );
            setAccountNumber(
                account.account_number || ""
            );
            setIfscCode(
                account.ifsc_code || ""
            );
            setAccountType(
                account.account_type || "Savings"
            );
            setCurrentBalance(
                account.current_balance || ""
            );
            setIsPrimary(
                account.is_primary || false
            );
        }
    }, [account]);

    if (!show || !account) {
        return null;
    }

    const updateBankAccount = async () => {

        if (
            !bankName ||
            !accountHolder ||
            !accountNumber ||
            !ifscCode ||
            currentBalance === ""
        ) {
            toast.error(
                "Please fill all required fields"
            );
            return;
        }

        try {

            await api.put(
                `/banks/${account.id}`,
                {
                    bank_name: bankName,
                    account_holder: accountHolder,
                    account_number: accountNumber,
                    ifsc_code: ifscCode,
                    account_type: accountType,
                    current_balance:
                        Number(currentBalance),
                    is_primary: isPrimary,
                }
            );

            toast.success(
                "Bank account updated successfully"
            );

            onClose();

            if (refresh) {
                refresh();
            }

        } catch (error) {

            console.log(
                "UPDATE BANK ERROR:",
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
                "Unable to update bank account"
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
                }}
            >

                <h2>Edit Bank Account</h2>

                <input
                    type="text"
                    placeholder="Bank Name"
                    value={bankName}
                    onChange={(e) =>
                        setBankName(
                            e.target.value
                        )
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

                <label
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "20px",
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

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                    }}
                >

                    <button
                        onClick={
                            updateBankAccount
                        }
                        style={{
                            flex: 1,
                            padding: "11px",
                            background:
                                "#2563eb",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
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
                            cursor: "pointer",
                        }}
                    >
                        Cancel
                    </button>

                </div>

            </div>

        </div>
    );
}

const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "12px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    boxSizing: "border-box",
};

export default EditBankAccountModal;