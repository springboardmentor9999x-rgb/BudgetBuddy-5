import { useEffect, useState } from "react";
import api from "../../services/api";

function RecentTransactions() {

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Dropdown open/close
    // CLOSED BY DEFAULT
    const [isOpen, setIsOpen] = useState(false);

    // Transaction type filter
    const [typeFilter, setTypeFilter] = useState("All");


    // ==========================================
    // LOAD TRANSACTIONS
    // ==========================================

    const fetchTransactions = async () => {

        try {

            setLoading(true);

            const response = await api.get(
                "/dashboard/recent-transactions"
            );

            setTransactions(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

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


    // ==========================================
    // TYPE STYLE
    // ==========================================

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


    // ==========================================
    // AMOUNT COLOR
    // ==========================================

    const getAmountColor = (type) => {

        if (type === "Income") {
            return "#16a34a";
        }

        if (type === "Savings") {
            return "#9333ea";
        }

        return "#dc2626";

    };


    // ==========================================
    // FILTER TRANSACTIONS
    // ==========================================

    const filteredTransactions =
        typeFilter === "All"
            ? transactions
            : transactions.filter(
                (item) =>
                    item.type === typeFilter
            );


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <div
                style={{
                    background: "white",
                    padding: "25px",
                    borderRadius: "12px",
                    marginTop: "18px",
                }}
            >

                Loading transactions...

            </div>

        );

    }


    // ==========================================
    // MAIN UI
    // ==========================================

    return (

        <div
            style={{
                background: "white",
                padding: "20px 25px",
                borderRadius: "12px",
                boxShadow:
                    "0 2px 10px rgba(0,0,0,0.08)",
                marginTop: "18px",
                marginBottom: "20px",
            }}
        >

            {/* ==================================
                HEADER
            =================================== */}

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: isOpen
                        ? "20px"
                        : "0",
                }}
            >

                {/* TITLE + TOGGLE */}

                <button
                    onClick={() =>
                        setIsOpen(!isOpen)
                    }
                    style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontSize: "20px",
                        fontWeight: "bold",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        color: "#111827",
                    }}
                >

                    <span>
                        Recent Transactions
                    </span>

                    <span
                        style={{
                            fontSize: "16px",
                            color: "#555",
                        }}
                    >
                        {isOpen ? "▲" : "▼"}
                    </span>

                </button>


                {/* TYPE DROPDOWN */}

                {isOpen && (

                    <select
                        value={typeFilter}
                        onChange={(e) =>
                            setTypeFilter(
                                e.target.value
                            )
                        }
                        style={{
                            padding: "8px 12px",
                            border:
                                "1px solid #ccc",
                            borderRadius: "7px",
                            background: "white",
                            cursor: "pointer",
                        }}
                    >

                        <option value="All">
                            All Types
                        </option>

                        <option value="Income">
                            Income
                        </option>

                        <option value="Expense">
                            Expense
                        </option>

                        <option value="Savings">
                            Savings
                        </option>

                    </select>

                )}

            </div>


            {/* ==================================
                TRANSACTIONS CONTENT
            =================================== */}

            {isOpen && (

                <>

                    {filteredTransactions.length === 0 ? (

                        <p
                            style={{
                                color: "#777",
                                marginBottom: 0,
                            }}
                        >
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
                                    borderCollapse:
                                        "collapse",
                                }}
                            >

                                {/* TABLE HEADER */}

                                <thead>

                                    <tr
                                        style={{
                                            background:
                                                "#f3f4f6",
                                        }}
                                    >

                                        <th
                                            style={{
                                                padding: "12px",
                                                textAlign:
                                                    "left",
                                            }}
                                        >
                                            Date
                                        </th>


                                        <th
                                            style={{
                                                padding: "12px",
                                                textAlign:
                                                    "left",
                                            }}
                                        >
                                            Description
                                        </th>


                                        <th
                                            style={{
                                                padding: "12px",
                                                textAlign:
                                                    "left",
                                            }}
                                        >
                                            Type
                                        </th>


                                        <th
                                            style={{
                                                padding: "12px",
                                                textAlign:
                                                    "right",
                                            }}
                                        >
                                            Amount
                                        </th>

                                    </tr>

                                </thead>


                                {/* TABLE BODY */}

                                <tbody>

                                    {filteredTransactions.map(
                                        (item, index) => {

                                            const typeStyle =
                                                getTypeStyle(
                                                    item.type
                                                );

                                            const amountColor =
                                                getAmountColor(
                                                    item.type
                                                );

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
                                                        {item.description ||
                                                            "-"}
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

                </>

            )}

        </div>

    );

}

export default RecentTransactions;