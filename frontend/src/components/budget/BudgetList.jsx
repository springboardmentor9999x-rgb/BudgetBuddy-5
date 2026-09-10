import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import { FaEdit, FaTrash } from "react-icons/fa";

function BudgetList({ refresh }) {
    const [budgets, setBudgets] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadingBanks, setLoadingBanks] = useState(true);

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);

    const [editingBudget, setEditingBudget] = useState(null);

    const [editCategory, setEditCategory] = useState("");
    const [editLimit, setEditLimit] = useState("");
    const [editMonth, setEditMonth] = useState(currentMonth);
    const [editYear, setEditYear] = useState(currentYear);

    // ==========================================
    // GET BANK ACCOUNTS
    // ==========================================

    const fetchBankAccounts = async () => {
        try {
            setLoadingBanks(true);

            const response = await api.get("/banks");

            setBankAccounts(response.data || []);
        } catch (error) {
            console.log(
                "BANK ACCOUNT LOAD ERROR:",
                error.response?.data || error
            );

            toast.error("Unable to load bank accounts");
        } finally {
            setLoadingBanks(false);
        }
    };

    // ==========================================
    // GET BANK NAME
    // ==========================================

    const getBankObject = (bankAccountId) => {
        if (!bankAccountId) {
            return null;
        }

        return bankAccounts.find(
            (bank) =>
                String(bank.id) === String(bankAccountId)
        );
    };

    const getBankName = (bankAccountId) => {
        const bank = getBankObject(bankAccountId);

        if (!bank) {
            return "Bank account not found";
        }

        return bank.bank_name;
    };

    const getLastFourDigits = (bankAccountId) => {
        const bank = getBankObject(bankAccountId);

        if (!bank) {
            return "----";
        }

        return String(bank.account_number).slice(-4);
    };

    // ==========================================
    // GET BUDGETS
    // ==========================================

    const fetchBudgets = async () => {
        try {
            setLoading(true);

            const response = await api.get("/budgets", {
                params: {
                    month: Number(month),
                    year: Number(year),
                },
            });

            setBudgets(response.data || []);
        } catch (error) {
            console.log(
                "BUDGET LIST ERROR:",
                error.response?.data || error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to load budgets"
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // LOAD DATA
    // ==========================================

    useEffect(() => {
        fetchBankAccounts();
    }, []);

    useEffect(() => {
        fetchBudgets();
    }, [refresh, month, year]);

    // ==========================================
    // DELETE BUDGET
    // ==========================================

    const deleteBudget = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this budget?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            await api.delete(`/budgets/${id}`);

            toast.success(
                "Budget deleted successfully"
            );

            fetchBudgets();
        } catch (error) {
            console.log(
                "DELETE BUDGET ERROR:",
                error.response?.data || error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to delete budget"
            );
        }
    };

    // ==========================================
    // OPEN EDIT
    // ==========================================

    const openEdit = (budget) => {
        setEditingBudget(budget);

        setEditCategory(budget.category);
        setEditLimit(budget.monthly_limit);
        setEditMonth(budget.month);
        setEditYear(budget.year);
    };

    // ==========================================
    // UPDATE BUDGET
    // ==========================================

    const updateBudget = async (e) => {
        e.preventDefault();

        if (!editCategory.trim()) {
            toast.error("Please enter a category");
            return;
        }

        if (!editLimit || Number(editLimit) <= 0) {
            toast.error(
                "Monthly limit must be greater than 0"
            );
            return;
        }

        try {
            await api.put(
                `/budgets/${editingBudget.id}`,
                {
                    category: editCategory.trim(),
                    monthly_limit: Number(editLimit),
                    month: Number(editMonth),
                    year: Number(editYear),
                }
            );

            toast.success(
                "Budget updated successfully"
            );

            setEditingBudget(null);

            setMonth(Number(editMonth));
            setYear(Number(editYear));

            fetchBudgets();
        } catch (error) {
            console.log(
                "UPDATE BUDGET ERROR:",
                error.response?.data || error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to update budget"
            );
        }
    };

    // ==========================================
    // GET PROGRESS COLOR
    // ==========================================

    const getProgressColor = (percentage) => {
        if (percentage >= 100) {
            return "#dc2626";
        }

        if (percentage >= 80) {
            return "#f59e0b";
        }

        return "#16a34a";
    };

    // ==========================================
    // MONTH NAME
    // ==========================================

    const getMonthName = (monthNumber) => {
        const months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];

        return months[Number(monthNumber) - 1];
    };

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <div
            style={{
                marginTop: "30px",
            }}
        >
            {/* ================================= */}
            {/* TITLE + FILTER */}
            {/* ================================= */}

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "15px",
                }}
            >
                <div>
                    <h2
                        style={{
                            marginBottom: "5px",
                        }}
                    >
                        Monthly Budget Progress
                    </h2>

                    <p
                        style={{
                            marginTop: 0,
                            color: "#64748b",
                        }}
                    >
                        Track your category-wise spending
                    </p>
                </div>

                {/* MONTH AND YEAR FILTER */}

                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                    }}
                >
                    <select
                        value={month}
                        onChange={(e) =>
                            setMonth(Number(e.target.value))
                        }
                        style={{
                            padding: "10px",
                            borderRadius: "6px",
                            border: "1px solid #ddd",
                        }}
                    >
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                    </select>

                    <input
                        type="number"
                        value={year}
                        onChange={(e) =>
                            setYear(Number(e.target.value))
                        }
                        min="2020"
                        max="2100"
                        style={{
                            width: "100px",
                            padding: "10px",
                            borderRadius: "6px",
                            border: "1px solid #ddd",
                        }}
                    />
                </div>
            </div>

            {/* ================================= */}
            {/* LOADING */}
            {/* ================================= */}

            {loading || loadingBanks ? (
                <div
                    style={{
                        background: "white",
                        padding: "30px",
                        borderRadius: "12px",
                        marginTop: "20px",
                        textAlign: "center",
                    }}
                >
                    Loading budgets...
                </div>
            ) : budgets.length === 0 ? (

                /* ================================= */
                /* EMPTY */
                /* ================================= */

                <div
                    style={{
                        background: "white",
                        padding: "30px",
                        borderRadius: "12px",
                        marginTop: "20px",
                        textAlign: "center",
                    }}
                >
                    <h3>
                        No budgets found
                    </h3>

                    <p
                        style={{
                            color: "#64748b",
                        }}
                    >
                        No budget is available for{" "}
                        {getMonthName(month)} {year}.
                    </p>
                </div>

            ) : (

                /* ================================= */
                /* BUDGET CARDS */
                /* ================================= */

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "20px",
                        marginTop: "20px",
                    }}
                >
                    {budgets.map((budget) => {
                        const percentage = Math.min(
                            Number(
                                budget.percentage_used || 0
                            ),
                            100
                        );

                        const progressColor =
                            getProgressColor(
                                Number(
                                    budget.percentage_used || 0
                                )
                            );

                        const bank =
                            getBankObject(
                                budget.bank_account_id
                            );

                        return (
                            <div
                                key={budget.id}
                                style={{
                                    background: "white",
                                    padding: "22px",
                                    borderRadius: "12px",
                                    boxShadow:
                                        "0 2px 10px rgba(0,0,0,0.08)",
                                }}
                            >
                                {/* CATEGORY */}

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent:
                                            "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <h3
                                        style={{
                                            margin: 0,
                                        }}
                                    >
                                        {budget.category}
                                    </h3>

                                    <span
                                        style={{
                                            fontSize: "12px",
                                            background: "#eff6ff",
                                            color: "#2563eb",
                                            padding: "5px 10px",
                                            borderRadius: "15px",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {getMonthName(
                                            budget.month
                                        )}{" "}
                                        {budget.year}
                                    </span>
                                </div>

                                {/* BANK ACCOUNT */}

                                <div
                                    style={{
                                        marginTop: "15px",
                                        padding: "12px",
                                        background: "#f8fafc",
                                        borderRadius: "8px",
                                        border:
                                            "1px solid #e2e8f0",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#64748b",
                                            marginBottom: "4px",
                                        }}
                                    >
                                        Bank Account
                                    </div>

                                    {bank ? (
                                        <div>
                                            <strong
                                                style={{
                                                    color: "#1e293b",
                                                }}
                                            >
                                                {bank.bank_name}
                                            </strong>

                                            <div
                                                style={{
                                                    marginTop: "3px",
                                                    fontSize: "13px",
                                                    color: "#64748b",
                                                }}
                                            >
                                                ****
                                                {String(
                                                    bank.account_number
                                                ).slice(-4)}

                                                {bank.is_primary && (
                                                    <span
                                                        style={{
                                                            marginLeft:
                                                                "8px",
                                                            color:
                                                                "#16a34a",
                                                            fontWeight:
                                                                "bold",
                                                        }}
                                                    >
                                                        • Primary
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <span
                                            style={{
                                                color: "#dc2626",
                                                fontSize: "13px",
                                            }}
                                        >
                                            Bank account not linked
                                        </span>
                                    )}
                                </div>

                                {/* LIMIT / SPENT */}

                                <div
                                    style={{
                                        marginTop: "20px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent:
                                                "space-between",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        <span>
                                            Spent
                                        </span>

                                        <strong>
                                            ₹
                                            {Number(
                                                budget.spent || 0
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </strong>
                                    </div>

                                    {/* PROGRESS BAR */}

                                    <div
                                        style={{
                                            width: "100%",
                                            height: "12px",
                                            background:
                                                "#e5e7eb",
                                            borderRadius: "10px",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width:
                                                    `${percentage}%`,
                                                height: "100%",
                                                background:
                                                    progressColor,
                                                transition:
                                                    "width 0.3s ease",
                                            }}
                                        />
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent:
                                                "space-between",
                                            marginTop: "8px",
                                            fontSize: "14px",
                                            color: "#64748b",
                                        }}
                                    >
                                        <span>
                                            {Number(
                                                budget.percentage_used ||
                                                0
                                            ).toFixed(2)}
                                            % used
                                        </span>

                                        <span>
                                            Limit: ₹
                                            {Number(
                                                budget.monthly_limit
                                            ).toLocaleString(
                                                "en-IN"
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* DETAILS */}

                                <div
                                    style={{
                                        marginTop: "20px",
                                        paddingTop: "15px",
                                        borderTop:
                                            "1px solid #e5e7eb",
                                    }}
                                >
                                    <p>
                                        <strong>
                                            Budget Limit:
                                        </strong>{" "}
                                        ₹
                                        {Number(
                                            budget.monthly_limit
                                        ).toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>

                                    <p>
                                        <strong>
                                            Amount Spent:
                                        </strong>{" "}
                                        ₹
                                        {Number(
                                            budget.spent || 0
                                        ).toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>

                                    <p
                                        style={{
                                            color:
                                                Number(
                                                    budget.remaining
                                                ) < 0
                                                    ? "#dc2626"
                                                    : "#16a34a",
                                        }}
                                    >
                                        <strong>
                                            Remaining:
                                        </strong>{" "}
                                        ₹
                                        {Number(
                                            budget.remaining || 0
                                        ).toLocaleString(
                                            "en-IN"
                                        )}
                                    </p>
                                </div>

                                {/* BUTTONS */}

                                <div
                                    style={{
                                        marginTop: "20px",
                                    }}
                                >
                                    <button
                                        onClick={() =>
                                            openEdit(budget)
                                        }
                                        style={{
                                            background: "#f59e0b",
                                            color: "white",
                                            border: "none",
                                            padding: "9px 14px",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            marginRight: "8px",
                                        }}
                                    >
                                        <FaEdit /> Edit
                                    </button>

                                    <button
                                        onClick={() =>
                                            deleteBudget(
                                                budget.id
                                            )
                                        }
                                        style={{
                                            background: "#dc2626",
                                            color: "white",
                                            border: "none",
                                            padding: "9px 14px",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        <FaTrash /> Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ================================= */}
            {/* EDIT MODAL */}
            {/* ================================= */}

            {editingBudget && (
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
                            background: "white",
                            padding: "30px",
                            borderRadius: "12px",
                            width: "400px",
                            maxWidth: "90%",
                        }}
                    >
                        <h2
                            style={{
                                marginTop: 0,
                            }}
                        >
                            Edit Budget
                        </h2>

                        <form onSubmit={updateBudget}>

                            {/* CATEGORY */}

                            <label>
                                Category
                            </label>

                            <input
                                type="text"
                                value={editCategory}
                                onChange={(e) =>
                                    setEditCategory(
                                        e.target.value
                                    )
                                }
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    marginTop: "6px",
                                    marginBottom: "15px",
                                    boxSizing:
                                        "border-box",
                                    border:
                                        "1px solid #ddd",
                                    borderRadius: "6px",
                                }}
                            />

                            {/* LIMIT */}

                            <label>
                                Monthly Limit
                            </label>

                            <input
                                type="number"
                                value={editLimit}
                                onChange={(e) =>
                                    setEditLimit(
                                        e.target.value
                                    )
                                }
                                min="1"
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    marginTop: "6px",
                                    marginBottom: "15px",
                                    boxSizing:
                                        "border-box",
                                    border:
                                        "1px solid #ddd",
                                    borderRadius: "6px",
                                }}
                            />

                            {/* MONTH */}

                            <label>
                                Month
                            </label>

                            <select
                                value={editMonth}
                                onChange={(e) =>
                                    setEditMonth(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    marginTop: "6px",
                                    marginBottom: "15px",
                                    border:
                                        "1px solid #ddd",
                                    borderRadius: "6px",
                                }}
                            >
                                <option value="1">
                                    January
                                </option>
                                <option value="2">
                                    February
                                </option>
                                <option value="3">
                                    March
                                </option>
                                <option value="4">
                                    April
                                </option>
                                <option value="5">
                                    May
                                </option>
                                <option value="6">
                                    June
                                </option>
                                <option value="7">
                                    July
                                </option>
                                <option value="8">
                                    August
                                </option>
                                <option value="9">
                                    September
                                </option>
                                <option value="10">
                                    October
                                </option>
                                <option value="11">
                                    November
                                </option>
                                <option value="12">
                                    December
                                </option>
                            </select>

                            {/* YEAR */}

                            <label>
                                Year
                            </label>

                            <input
                                type="number"
                                value={editYear}
                                onChange={(e) =>
                                    setEditYear(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                                min="2020"
                                max="2100"
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    marginTop: "6px",
                                    marginBottom: "20px",
                                    boxSizing:
                                        "border-box",
                                    border:
                                        "1px solid #ddd",
                                    borderRadius: "6px",
                                }}
                            />

                            {/* BUTTONS */}

                            <button
                                type="submit"
                                style={{
                                    background: "#2563eb",
                                    color: "white",
                                    border: "none",
                                    padding: "10px 16px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    marginRight: "10px",
                                }}
                            >
                                Update Budget
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setEditingBudget(null)
                                }
                                style={{
                                    background: "#64748b",
                                    color: "white",
                                    border: "none",
                                    padding: "10px 16px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BudgetList;