import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { toast } from "react-toastify";
import { FaEdit, FaTrash } from "react-icons/fa";
import EditBankAccountModal from "./EditBankAccountModal";

function BankAccountList({ refresh }) {

    const navigate = useNavigate();

    const [accounts, setAccounts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);

    // ==========================================
    // LOAD BANK ACCOUNTS
    // ==========================================

    const fetchAccounts = async () => {

        try {

            const response = await api.get("/banks");

            setAccounts(response.data);

        } catch (error) {

            console.log(
                "BANK LIST ERROR:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to load bank accounts"
            );
        }
    };

    useEffect(() => {

        fetchAccounts();

    }, [refresh]);


    // ==========================================
    // DELETE BANK ACCOUNT
    // ==========================================

    const deleteAccount = async (id) => {

        const confirmDelete = window.confirm(
            "Delete this bank account?"
        );

        if (!confirmDelete) {
            return;
        }

        try {

            await api.delete(`/banks/${id}`);

            toast.success(
                "Bank account deleted"
            );

            fetchAccounts();

        } catch (error) {

            console.log(
                "DELETE BANK ERROR:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to delete bank account"
            );
        }
    };


    // ==========================================
    // EDIT BANK ACCOUNT
    // ==========================================

    const editAccount = (account) => {

        setSelectedAccount(account);
        setShowModal(true);

    };


    // ==========================================
    // VIEW BANK TRANSACTIONS
    // ==========================================

    const viewTransactions = (bankId) => {

        navigate(
            `/banks/${bankId}/transactions`
        );

    };


    // ==========================================
    // UI
    // ==========================================

    return (

        <div
            style={{
                marginTop: "30px",
            }}
        >

            <h2>
                My Bank Accounts
            </h2>


            {/* ================================= */}
            {/* NO ACCOUNTS */}
            {/* ================================= */}

            {accounts.length === 0 ? (

                <div
                    style={{
                        background: "white",
                        padding: "30px",
                        borderRadius: "12px",
                        marginTop: "20px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.08)",
                        textAlign: "center",
                        color: "#777",
                    }}
                >
                    No bank accounts added yet.
                </div>

            ) : (

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "20px",
                        marginTop: "20px",
                    }}
                >

                    {accounts.map((account) => (

                        <div
                            key={account.id}
                            style={{
                                background: "white",
                                padding: "22px",
                                borderRadius: "12px",
                                boxShadow:
                                    "0 2px 10px rgba(0,0,0,0.08)",
                                borderTop:
                                    account.is_primary
                                        ? "4px solid #2563eb"
                                        : "4px solid #ddd",
                            }}
                        >

                            {/* ========================= */}
                            {/* BANK NAME */}
                            {/* ========================= */}

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent:
                                        "space-between",
                                    alignItems: "center",
                                    marginBottom: "15px",
                                }}
                            >

                                <h3
                                    style={{
                                        margin: 0,
                                    }}
                                >
                                    {account.bank_name}
                                </h3>

                                {account.is_primary && (

                                    <span
                                        style={{
                                            background:
                                                "#dbeafe",
                                            color:
                                                "#1d4ed8",
                                            padding:
                                                "5px 10px",
                                            borderRadius:
                                                "15px",
                                            fontSize:
                                                "12px",
                                            fontWeight:
                                                "bold",
                                        }}
                                    >
                                        PRIMARY
                                    </span>

                                )}

                            </div>


                            {/* ========================= */}
                            {/* ACCOUNT DETAILS */}
                            {/* ========================= */}

                            <p>
                                <strong>
                                    Account Holder:
                                </strong>{" "}
                                {account.account_holder}
                            </p>

                            <p>
                                <strong>
                                    Account:
                                </strong>{" "}
                                ****
                                {String(
                                    account.account_number
                                ).slice(-4)}
                            </p>

                            <p>
                                <strong>
                                    IFSC:
                                </strong>{" "}
                                {account.ifsc_code}
                            </p>

                            <p>
                                <strong>
                                    Type:
                                </strong>{" "}
                                {account.account_type}
                            </p>


                            {/* ========================= */}
                            {/* BALANCE */}
                            {/* ========================= */}

                            <h2
                                style={{
                                    color: "#2563eb",
                                    marginTop: "20px",
                                    marginBottom: "20px",
                                }}
                            >
                                ₹{" "}
                                {Number(
                                    account.current_balance
                                ).toLocaleString(
                                    "en-IN"
                                )}
                            </h2>


                            {/* ========================= */}
                            {/* EDIT + DELETE */}
                            {/* ========================= */}

                            <div
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                }}
                            >

                                <button
                                    onClick={() =>
                                        editAccount(
                                            account
                                        )
                                    }
                                    style={{
                                        flex: 1,
                                        background:
                                            "#f59e0b",
                                        color: "white",
                                        border: "none",
                                        padding:
                                            "9px 14px",
                                        borderRadius:
                                            "6px",
                                        cursor:
                                            "pointer",
                                    }}
                                >
                                    <FaEdit /> Edit
                                </button>


                                <button
                                    onClick={() =>
                                        deleteAccount(
                                            account.id
                                        )
                                    }
                                    style={{
                                        flex: 1,
                                        background:
                                            "#dc2626",
                                        color: "white",
                                        border: "none",
                                        padding:
                                            "9px 14px",
                                        borderRadius:
                                            "6px",
                                        cursor:
                                            "pointer",
                                    }}
                                >
                                    <FaTrash /> Delete
                                </button>

                            </div>


                            {/* ========================= */}
                            {/* VIEW TRANSACTIONS */}
                            {/* ========================= */}

                            <button
                                onClick={() =>
                                    viewTransactions(
                                        account.id
                                    )
                                }
                                style={{
                                    width: "100%",
                                    marginTop: "10px",
                                    background:
                                        "#2563eb",
                                    color: "white",
                                    border: "none",
                                    padding: "11px",
                                    borderRadius:
                                        "6px",
                                    cursor: "pointer",
                                    fontSize: "15px",
                                    fontWeight: "bold",
                                }}
                            >
                                📋 View Transactions
                            </button>

                        </div>

                    ))}

                </div>

            )}


            {/* ================================= */}
            {/* EDIT MODAL */}
            {/* ================================= */}

            <EditBankAccountModal
                show={showModal}
                account={selectedAccount}
                onClose={() =>
                    setShowModal(false)
                }
                refresh={fetchAccounts}
            />

        </div>
    );
}

export default BankAccountList;