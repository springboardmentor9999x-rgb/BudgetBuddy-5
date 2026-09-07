import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";

function BankTransactions() {

    const { bankId } = useParams();
    const navigate = useNavigate();

    const [bank, setBank] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");


    // ==========================================
    // LOAD TRANSACTIONS
    // ==========================================

    const loadTransactions = async () => {

        try {

            const response = await api.get(
                `/banks/${bankId}/transactions`
            );

            setBank(response.data.bank);

            setTransactions(
                response.data.transactions || []
            );

        } catch (error) {

            console.log(
                "BANK TRANSACTION ERROR:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to load transactions"
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {
        loadTransactions();
    }, [bankId]);


    // ==========================================
    // TOTALS
    // ==========================================

    const totalIncome = transactions
        .filter((item) => item.type === "Income")
        .reduce(
            (total, item) =>
                total + Number(item.amount),
            0
        );

    const totalExpense = transactions
        .filter((item) => item.type === "Expense")
        .reduce(
            (total, item) =>
                total + Number(item.amount),
            0
        );

    const totalSavings = transactions
        .filter((item) => item.type === "Savings")
        .reduce(
            (total, item) =>
                total + Number(item.amount),
            0
        );

    const totalSpent = totalExpense + totalSavings;


    // ==========================================
    // FILTER
    // ==========================================

    const filteredTransactions =
        transactions.filter((item) => {

            const keyword =
                search.toLowerCase();

            const matchesType =
                typeFilter === "All" ||
                item.type === typeFilter;

            const matchesSearch =
                (item.category || "")
                    .toLowerCase()
                    .includes(keyword) ||

                (item.description || "")
                    .toLowerCase()
                    .includes(keyword) ||

                (item.source || "")
                    .toLowerCase()
                    .includes(keyword) ||

                (item.payment_method || "")
                    .toLowerCase()
                    .includes(keyword);

            return (
                matchesType &&
                matchesSearch
            );
        });


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (
            <div
                style={{
                    padding: "40px",
                    textAlign: "center",
                }}
            >
                Loading transactions...
            </div>
        );
    }


    return (

        <div
            style={{
                padding: "30px",
                background: "#f5f7fb",
                minHeight: "100vh",
                boxSizing: "border-box",
            }}
        >

            {/* BACK */}

            <button
                onClick={() =>
                    navigate("/banks")
                }
                style={{
                    background: "#1E3A8A",
                    color: "white",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "7px",
                    cursor: "pointer",
                    marginBottom: "20px",
                }}
            >
                ← Back to Bank Accounts
            </button>


            {/* BANK HEADER */}

            {bank && (

                <div
                    style={{
                        background: "white",
                        padding: "25px",
                        borderRadius: "12px",
                        marginBottom: "20px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.08)",
                    }}
                >

                    <div
                        style={{
                            display: "flex",
                            justifyContent:
                                "space-between",
                            alignItems: "center",
                        }}
                    >

                        <div>

                            <h1
                                style={{
                                    margin: 0,
                                }}
                            >
                                {bank.bank_name}
                            </h1>

                            <p
                                style={{
                                    color: "#777",
                                }}
                            >
                                Account: ****
                                {String(
                                    bank.account_number
                                ).slice(-4)}
                            </p>

                        </div>

                        {bank.is_primary && (

                            <span
                                style={{
                                    background:
                                        "#dbeafe",
                                    color:
                                        "#1d4ed8",
                                    padding:
                                        "6px 12px",
                                    borderRadius:
                                        "15px",
                                    fontWeight:
                                        "bold",
                                    fontSize:
                                        "12px",
                                }}
                            >
                                PRIMARY
                            </span>

                        )}

                    </div>

                    <h2
                        style={{
                            color: "#2563eb",
                            marginBottom: 0,
                        }}
                    >
                        ₹{" "}
                        {Number(
                            bank.current_balance
                        ).toLocaleString(
                            "en-IN"
                        )}
                    </h2>

                    <p
                        style={{
                            color: "#777",
                            marginTop: "5px",
                        }}
                    >
                        Current Balance
                    </p>

                </div>

            )}


            {/* SUMMARY CARDS */}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(5, 1fr)",
                    gap: "15px",
                    marginBottom: "20px",
                }}
            >

                {/* INCOME */}

                <div
                    style={{
                        background: "white",
                        padding: "20px",
                        borderRadius: "10px",
                        borderLeft:
                            "5px solid #16a34a",
                    }}
                >

                    <p
                        style={{
                            color: "#777",
                            margin: 0,
                        }}
                    >
                        Total Income
                    </p>

                    <h2
                        style={{
                            color: "#16a34a",
                        }}
                    >
                        + ₹{" "}
                        {totalIncome.toLocaleString(
                            "en-IN"
                        )}
                    </h2>

                </div>


                {/* EXPENSE */}

                <div
                    style={{
                        background: "white",
                        padding: "20px",
                        borderRadius: "10px",
                        borderLeft:
                            "5px solid #dc2626",
                    }}
                >

                    <p
                        style={{
                            color: "#777",
                            margin: 0,
                        }}
                    >
                        Total Expense
                    </p>

                    <h2
                        style={{
                            color: "#dc2626",
                        }}
                    >
                        - ₹{" "}
                        {totalExpense.toLocaleString(
                            "en-IN"
                        )}
                    </h2>

                </div>


                {/* SAVINGS */}

                <div
                    style={{
                        background: "white",
                        padding: "20px",
                        borderRadius: "10px",
                        borderLeft:
                            "5px solid #b45309",
                    }}
                >

                    <p
                        style={{
                            color: "#777",
                            margin: 0,
                        }}
                    >
                        Total Savings
                    </p>

                    <h2
                        style={{
                            color: "#b45309",
                        }}
                    >
                        - ₹{" "}
                        {totalSavings.toLocaleString(
                            "en-IN"
                        )}
                    </h2>

                </div>


                {/* TOTAL SPENT */}

                <div
                    style={{
                        background: "white",
                        padding: "20px",
                        borderRadius: "10px",
                        borderLeft:
                            "5px solid #7c3aed",
                    }}
                >

                    <p
                        style={{
                            color: "#777",
                            margin: 0,
                        }}
                    >
                        Total Spent
                    </p>

                    <h2
                        style={{
                            color: "#7c3aed",
                        }}
                    >
                        - ₹{" "}
                        {totalSpent.toLocaleString(
                            "en-IN"
                        )}
                    </h2>

                </div>


                {/* COUNT */}

                <div
                    style={{
                        background: "white",
                        padding: "20px",
                        borderRadius: "10px",
                        borderLeft:
                            "5px solid #2563eb",
                    }}
                >

                    <p
                        style={{
                            color: "#777",
                            margin: 0,
                        }}
                    >
                        Transactions
                    </p>

                    <h2
                        style={{
                            color: "#2563eb",
                        }}
                    >
                        {transactions.length}
                    </h2>

                </div>

            </div>


            {/* SEARCH + FILTER */}

            <div
                style={{
                    background: "white",
                    padding: "20px",
                    borderRadius: "10px",
                    marginBottom: "20px",
                    display: "flex",
                    gap: "15px",
                }}
            >

                <input
                    type="text"
                    placeholder="Search transactions..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    style={{
                        flex: 1,
                        padding: "12px",
                        border:
                            "1px solid #ccc",
                        borderRadius: "7px",
                        boxSizing:
                            "border-box",
                    }}
                />

                <select
                    value={typeFilter}
                    onChange={(e) =>
                        setTypeFilter(
                            e.target.value
                        )
                    }
                    style={{
                        padding: "12px",
                        border:
                            "1px solid #ccc",
                        borderRadius: "7px",
                    }}
                >
                    <option value="All">
                        All Transactions
                    </option>

                    <option value="Income">
                        Income Only
                    </option>

                    <option value="Expense">
                        Expense Only
                    </option>

                    <option value="Savings">
                        Savings Only
                    </option>
                </select>

            </div>


            {/* TRANSACTION TABLE */}

            <div
                style={{
                    background: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow:
                        "0 2px 10px rgba(0,0,0,0.08)",
                }}
            >

                <div
                    style={{
                        padding: "20px",
                        borderBottom:
                            "1px solid #eee",
                    }}
                >

                    <h2
                        style={{
                            margin: 0,
                        }}
                    >
                        Transaction History
                    </h2>

                </div>


                {filteredTransactions.length === 0 ? (

                    <div
                        style={{
                            padding: "50px",
                            textAlign: "center",
                            color: "#777",
                        }}
                    >
                        No matching transactions found.
                    </div>

                ) : (

                    <div
                        style={{
                            overflowX: "auto",
                        }}
                    >

                        <table
                            style={{
                                width: "100%",
                                borderCollapse:
                                    "collapse",
                            }}
                        >

                            <thead>

                                <tr
                                    style={{
                                        background:
                                            "#1E3A8A",
                                        color: "white",
                                    }}
                                >

                                    <th
                                        style={{
                                            padding:
                                                "14px",
                                            textAlign:
                                                "left",
                                        }}
                                    >
                                        Date
                                    </th>

                                    <th
                                        style={{
                                            padding:
                                                "14px",
                                            textAlign:
                                                "left",
                                        }}
                                    >
                                        Type
                                    </th>

                                    <th
                                        style={{
                                            padding:
                                                "14px",
                                            textAlign:
                                                "left",
                                        }}
                                    >
                                        Category
                                    </th>

                                    <th
                                        style={{
                                            padding:
                                                "14px",
                                            textAlign:
                                                "left",
                                        }}
                                    >
                                        Description
                                    </th>

                                    <th
                                        style={{
                                            padding:
                                                "14px",
                                            textAlign:
                                                "right",
                                        }}
                                    >
                                        Amount
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredTransactions.map(
                                    (item, index) => (

                                        <tr
                                            key={`${item.type}-${item.id}-${index}`}
                                            style={{
                                                borderBottom:
                                                    "1px solid #eee",
                                            }}
                                        >

                                            <td
                                                style={{
                                                    padding:
                                                        "14px",
                                                }}
                                            >
                                                {item.date}
                                            </td>

                                            <td
                                                style={{
                                                    padding:
                                                        "14px",
                                                }}
                                            >

                                                <span
                                                    style={{
                                                        padding:
                                                            "5px 10px",
                                                        borderRadius:
                                                            "20px",
                                                        background:
                                                            item.type ===
                                                            "Income"
                                                                ? "#dcfce7"
                                                                : "#fee2e2",
                                                        color:
                                                            item.type ===
                                                            "Income"
                                                                ? "#15803d"
                                                                : "#b91c1c",
                                                        fontWeight:
                                                            "bold",
                                                        fontSize:
                                                            "13px",
                                                    }}
                                                >
                                                    {item.type}
                                                </span>

                                            </td>

                                            <td
                                                style={{
                                                    padding:
                                                        "14px",
                                                }}
                                            >
                                                {item.category ||
                                                    "-"}
                                            </td>

                                            <td
                                                style={{
                                                    padding:
                                                        "14px",
                                                }}
                                            >
                                                {item.description ||
                                                    item.source ||
                                                    "-"}
                                            </td>

                                            <td
                                                style={{
                                                    padding:
                                                        "14px",
                                                    textAlign:
                                                        "right",
                                                    fontWeight:
                                                        "bold",
                                                    color:
                                                        item.type ===
                                                        "Income"
                                                            ? "#16a34a"
                                                            : "#dc2626",
                                                }}
                                            >
                                                {item.type ===
                                                "Income"
                                                    ? "+"
                                                    : "-"}{" "}
                                                ₹{" "}
                                                {Number(
                                                    item.amount
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}
                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

        </div>
    );
}

export default BankTransactions;