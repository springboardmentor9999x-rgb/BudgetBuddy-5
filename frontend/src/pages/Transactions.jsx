import { useEffect, useState } from "react";
import api from "../services/api";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

function Transactions() {

    const [income, setIncome] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [savingsTransactions, setSavingsTransactions] = useState([]);

    const [banks, setBanks] = useState([]);

    const [selectedBank, setSelectedBank] =
        useState("all");

    const [selectedType, setSelectedType] =
        useState("all");

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);


    // ==========================================
    // LOAD DATA
    // ==========================================

    const loadTransactions = async () => {

        try {

            setLoading(true);

            const [
                incomeResponse,
                expenseResponse,
                bankResponse,
                savingsResponse
            ] = await Promise.all([

                api.get("/income"),
                api.get("/expenses"),
                api.get("/banks"),
                api.get("/savings-goals/transactions/all")

            ]);


            // INCOME

            setIncome(
                Array.isArray(incomeResponse.data)
                    ? incomeResponse.data
                    : []
            );


            // EXPENSES

            setExpenses(
                Array.isArray(expenseResponse.data)
                    ? expenseResponse.data
                    : []
            );


            // BANKS

            setBanks(
                Array.isArray(bankResponse.data)
                    ? bankResponse.data
                    : []
            );


            // SAVINGS TRANSACTIONS

            setSavingsTransactions(
                Array.isArray(savingsResponse.data)
                    ? savingsResponse.data
                    : []
            );


        } catch (error) {

            console.error(
                "TRANSACTION LOAD ERROR:",
                error
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        loadTransactions();

    }, []);


    // ==========================================
    // COMBINE INCOME + EXPENSE + SAVINGS
    // ==========================================

    const transactions = [

        // ======================================
        // INCOME
        // ======================================

        ...income.map((item) => ({

            id: item.id,

            type: "Income",

            category: item.category,

            description:
                item.description ||
                item.source ||
                "-",

            amount: Number(item.amount),

            date: item.date,

            bank_account_id:
                item.bank_account_id,

        })),


        // ======================================
        // EXPENSE
        // ======================================

        ...expenses.map((item) => ({

            id: item.id,

            type: "Expense",

            category: item.category,

            description:
                item.description ||
                item.category ||
                "-",

            amount: Number(item.amount),

            date: item.date,

            bank_account_id:
                item.bank_account_id,

            payment_method:
                item.payment_method,

        })),


        // ======================================
        // SAVINGS
        // ======================================

        ...savingsTransactions.map((item) => ({

            id: item.id,

            type: "Savings",

            category: "Savings Goal",

            description:
                item.goal_name ||
                "Savings Goal",

            amount: Number(item.amount),

            date: item.transaction_date,

            bank_account_id: null,

        })),

    ];


    // ==========================================
    // FILTER
    // ==========================================

    const filteredTransactions =
        transactions
            .filter((item) => {

                // ----------------------------------
                // BANK FILTER
                // Savings transactions are shown
                // only when "All Accounts" is selected
                // ----------------------------------

                const matchesBank =

                    selectedBank === "all"

                    ||

                    (
                        item.type !== "Savings" &&

                        String(
                            item.bank_account_id
                        ) === String(selectedBank)
                    );


                // ----------------------------------
                // TYPE FILTER
                // ----------------------------------

                const matchesType =

                    selectedType === "all"

                    ||

                    item.type === selectedType;


                // ----------------------------------
                // SEARCH FILTER
                // ----------------------------------

                const keyword =
                    search.toLowerCase();


                const matchesSearch =

                    item.category
                        ?.toLowerCase()
                        .includes(keyword)

                    ||

                    item.description
                        ?.toLowerCase()
                        .includes(keyword)

                    ||

                    item.type
                        ?.toLowerCase()
                        .includes(keyword)

                    ||

                    item.payment_method
                        ?.toLowerCase()
                        .includes(keyword);


                return (

                    matchesBank &&

                    matchesType &&

                    matchesSearch

                );

            })

            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            );


    // ==========================================
    // TOTALS
    // ==========================================


    const totalIncome =

        filteredTransactions

            .filter(
                (item) =>
                    item.type === "Income"
            )

            .reduce(
                (sum, item) =>
                    sum + item.amount,
                0
            );


    const totalExpense =

        filteredTransactions

            .filter(
                (item) =>
                    item.type === "Expense"
            )

            .reduce(
                (sum, item) =>
                    sum + item.amount,
                0
            );


    const totalSavings =

        filteredTransactions

            .filter(
                (item) =>
                    item.type === "Savings"
            )

            .reduce(
                (sum, item) =>
                    sum + item.amount,
                0
            );


    const netAmount =

        totalIncome -
        totalExpense -
        totalSavings;


    // ==========================================
    // BANK NAME
    // ==========================================

    const getBankName = (bankId) => {

        if (!bankId) {
            return "-";
        }


        const bank = banks.find(
            (item) =>
                String(item.id) ===
                String(bankId)
        );


        if (!bank) {
            return "No Bank";
        }


        return (

            bank.bank_name +

            (

                bank.account_number

                    ? ` - ****${String(
                        bank.account_number
                    ).slice(-4)}`

                    : ""

            )

        );

    };


    // ==========================================
    // TYPE STYLE
    // ==========================================
    const getTypeStyle = (type) => {

        // INCOME - GREEN
        if (type === "Income") {

            return {
                background: "#dcfce7",
                color: "#15803d",
                sign: "+"
            };

        }


        // EXPENSE - RED
        if (type === "Expense") {

            return {
                background: "#fee2e2",
                color: "#b91c1c",
                sign: "-"
            };

        }


        // SAVINGS - PURPLE
        if (type === "Savings") {

            return {
                background: "#f3e8ff",
                color: "#9333ea",
                sign: "-"
            };

        }


        // DEFAULT
        return {
            background: "#f3f4f6",
            color: "#374151",
            sign: ""
        };

    };
    


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <div
                style={{
                    display: "flex",
                    minHeight: "100vh",
                    background: "#f5f7fb",
                }}
            >

                <Sidebar />

                <div
                    style={{
                        flex: 1,
                        padding: "20px",
                    }}
                >

                    <Navbar />

                    <p>
                        Loading transactions...
                    </p>

                </div>

            </div>

        );

    }


    return (

        <div
            style={{
                display: "flex",
                minHeight: "100vh",
                background: "#f5f7fb",
            }}
        >

            <Sidebar />


            <div
                style={{
                    flex: 1,
                    padding: "20px",
                    boxSizing: "border-box",
                }}
            >

                <Navbar />


                <h1
                    style={{
                        marginTop: "25px",
                        marginBottom: "25px",
                    }}
                >
                    Transactions
                </h1>


                {/* ==================================
                    FILTERS
                =================================== */}

                <div
                    style={{
                        background: "white",
                        padding: "20px",
                        borderRadius: "12px",
                        marginBottom: "20px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.08)",
                    }}
                >

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "1fr 1fr 1fr",
                            gap: "15px",
                        }}
                    >


                        {/* BANK FILTER */}

                        <select
                            value={selectedBank}
                            onChange={(e) =>
                                setSelectedBank(
                                    e.target.value
                                )
                            }
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                border:
                                    "1px solid #ccc",
                                boxSizing:
                                    "border-box",
                            }}
                        >

                            <option value="all">
                                All Accounts
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

                                        : ""

                                    }

                                </option>

                            ))}

                        </select>


                        {/* TYPE FILTER */}

                        <select
                            value={selectedType}
                            onChange={(e) =>
                                setSelectedType(
                                    e.target.value
                                )
                            }
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                border:
                                    "1px solid #ccc",
                                boxSizing:
                                    "border-box",
                            }}
                        >

                            <option value="all">
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


                        {/* SEARCH */}

                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            style={{
                                width: "100%",
                                padding: "12px",
                                borderRadius: "8px",
                                border:
                                    "1px solid #ccc",
                                boxSizing:
                                    "border-box",
                            }}
                        />

                    </div>

                </div>


                {/* ==================================
                    SUMMARY
                =================================== */}

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(4, 1fr)",
                        gap: "20px",
                        marginBottom: "25px",
                    }}
                >


                    {/* TOTAL INCOME */}

                    <div
                        style={{
                            background: "white",
                            padding: "20px",
                            borderRadius: "12px",
                            boxShadow:
                                "0 2px 10px rgba(0,0,0,0.08)",
                        }}
                    >

                        <p
                            style={{
                                margin: 0,
                                color: "#666",
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


                    {/* TOTAL EXPENSE */}

                    <div
                        style={{
                            background: "white",
                            padding: "20px",
                            borderRadius: "12px",
                            boxShadow:
                                "0 2px 10px rgba(0,0,0,0.08)",
                        }}
                    >

                        <p
                            style={{
                                margin: 0,
                                color: "#666",
                            }}
                        >
                            Total Expenses
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


                    {/* TOTAL SAVINGS */}

                    <div
                        style={{
                            background: "white",
                            padding: "20px",
                            borderRadius: "12px",
                            boxShadow:
                                "0 2px 10px rgba(0,0,0,0.08)",
                        }}
                    >

                        <p
                            style={{
                                margin: 0,
                                color: "#666",
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


                    {/* NET */}

                    <div
                        style={{
                            background: "white",
                            padding: "20px",
                            borderRadius: "12px",
                            boxShadow:
                                "0 2px 10px rgba(0,0,0,0.08)",
                        }}
                    >

                        <p
                            style={{
                                margin: 0,
                                color: "#666",
                            }}
                        >
                            Net Balance
                        </p>

                        <h2
                            style={{
                                color:
                                    netAmount >= 0
                                        ? "#2563eb"
                                        : "#dc2626",
                            }}
                        >
                            ₹{" "}

                            {netAmount.toLocaleString(
                                "en-IN"
                            )}

                        </h2>

                    </div>

                </div>


                {/* ==================================
                    TRANSACTION TABLE
                =================================== */}

                <div
                    style={{
                        background: "white",
                        borderRadius: "12px",
                        boxShadow:
                            "0 2px 10px rgba(0,0,0,0.08)",
                        overflow: "hidden",
                    }}
                >

                    <div
                        style={{
                            padding: "20px",
                        }}
                    >

                        <h2
                            style={{
                                margin: 0,
                            }}
                        >
                            Overall Transaction History
                        </h2>

                    </div>


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

                                    <th style={{ padding: "12px", textAlign: "left" }}>
                                        Date
                                    </th>

                                    <th style={{ padding: "12px", textAlign: "left" }}>
                                        Type
                                    </th>

                                    <th style={{ padding: "12px", textAlign: "left" }}>
                                        Category
                                    </th>

                                    <th style={{ padding: "12px", textAlign: "left" }}>
                                        Bank
                                    </th>

                                    <th style={{ padding: "12px", textAlign: "left" }}>
                                        Description / Goal
                                    </th>

                                    <th style={{ padding: "12px", textAlign: "right" }}>
                                        Amount
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {filteredTransactions.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="6"
                                            style={{
                                                padding: "40px",
                                                textAlign: "center",
                                                color: "#777",
                                            }}
                                        >
                                            No transactions found.
                                        </td>

                                    </tr>

                                ) : (

                                    filteredTransactions.map(
                                        (item, index) => {

                                            const typeStyle =
                                                getTypeStyle(
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

                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                        }}
                                                    >
                                                        {item.date}
                                                    </td>


                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                        }}
                                                    >

                                                        <span
                                                            style={{
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


                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                        }}
                                                    >
                                                        {item.category}
                                                    </td>


                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                        }}
                                                    >
                                                        {getBankName(
                                                            item.bank_account_id
                                                        )}
                                                    </td>


                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                        }}
                                                    >
                                                        {item.description}
                                                    </td>


                                                    <td
                                                        style={{
                                                            padding:
                                                                "12px",
                                                            textAlign:
                                                                "right",
                                                            fontWeight:
                                                                "bold",
                                                            color:
                                                                typeStyle.color,
                                                        }}
                                                    >

                                                        {typeStyle.sign} ₹{" "}

                                                        {item.amount.toLocaleString(
                                                            "en-IN"
                                                        )}

                                                    </td>

                                                </tr>

                                            );

                                        }
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Transactions;