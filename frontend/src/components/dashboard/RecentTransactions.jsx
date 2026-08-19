import { useEffect, useState } from "react";
import api from "../../services/api";

function RecentTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        try {
            const response = await api.get(
                "/dashboard/recent-transactions"
            );

            setTransactions(response.data);
        } catch (error) {
            console.log(
                "Recent transactions error:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    // Get badge colors based on transaction type
    const getTypeStyle = (type) => {
        if (type === "Income") {
            return {
                background: "#dcfce7",
                color: "#15803d",
            };
        }

        if (type === "Savings") {
            return {
                background: "#f3e8ff",
                color: "#9333ea",
            };
        }

        // Expense
        return {
            background: "#fee2e2",
            color: "#b91c1c",
        };
    };

    // Get amount colors based on transaction type
    const getAmountColor = (type) => {
        if (type === "Income") {
            return "#16a34a";
        }

        if (type === "Savings") {
            return "#9333ea";
        }

        return "#dc2626";
    };

    if (loading) {
        return (
            <div
                style={{
                    background: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    marginTop: "25px",
                }}
            >
                Loading transactions...
            </div>
        );
    }

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
            <h2
                style={{
                    marginTop: 0,
                    marginBottom: "20px",
                }}
            >
                Recent Transactions
            </h2>

            {transactions.length === 0 ? (
                <p style={{ color: "#777" }}>
                    No transactions available.
                </p>
            ) : (
                <div
                    style={{
                        overflowX: "auto",
                    }}
                >
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    background: "#f3f4f6",
                                }}
                            >
                                <th
                                    style={{
                                        padding: "12px",
                                        textAlign: "left",
                                    }}
                                >
                                    Date
                                </th>

                                <th
                                    style={{
                                        padding: "12px",
                                        textAlign: "left",
                                    }}
                                >
                                    Description
                                </th>

                                <th
                                    style={{
                                        padding: "12px",
                                        textAlign: "left",
                                    }}
                                >
                                    Type
                                </th>

                                <th
                                    style={{
                                        padding: "12px",
                                        textAlign: "right",
                                    }}
                                >
                                    Amount
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {transactions.map(
                                (item, index) => {
                                    const typeStyle =
                                        getTypeStyle(item.type);

                                    const amountColor =
                                        getAmountColor(item.type);

                                    return (
                                        <tr
                                            key={`${item.type}-${item.id}-${index}`}
                                            style={{
                                                borderBottom:
                                                    "1px solid #eee",
                                            }}
                                        >
                                            {/* DATE */}
                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                }}
                                            >
                                                {item.date}
                                            </td>

                                            {/* DESCRIPTION */}
                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                }}
                                            >
                                                {item.description}
                                            </td>

                                            {/* TYPE */}
                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display:
                                                            "inline-block",
                                                        padding:
                                                            "5px 10px",
                                                        borderRadius:
                                                            "20px",
                                                        background:
                                                            typeStyle.background,
                                                        color:
                                                            typeStyle.color,
                                                        fontSize:
                                                            "13px",
                                                        fontWeight:
                                                            "bold",
                                                    }}
                                                >
                                                    {item.type}
                                                </span>
                                            </td>

                                            {/* AMOUNT */}
                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                    textAlign:
                                                        "right",
                                                    fontWeight:
                                                        "bold",
                                                    color:
                                                        amountColor,
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
                                    );
                                }
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default RecentTransactions;