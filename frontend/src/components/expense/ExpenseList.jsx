import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import { FaEdit, FaTrash } from "react-icons/fa";
import EditExpenseModal from "./EditExpenseModal";

function ExpenseList({ refresh }) {
    const [expenses, setExpenses] = useState([]);

    const [banks, setBanks] = useState([]);
    const [selectedBank, setSelectedBank] = useState("all");

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [selectedExpense, setSelectedExpense] =
        useState(null);

    // ==========================================
    // LOAD BANK ACCOUNTS
    // ==========================================

    const fetchBanks = async () => {
        try {
            const response =
                await api.get("/banks");

            const bankList =
                Array.isArray(response.data)
                    ? response.data
                    : [];

            setBanks(bankList);

        } catch (error) {
            console.log(
                "BANK LOAD ERROR:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to load bank accounts"
            );
        }
    };

    // ==========================================
    // LOAD EXPENSES
    // ==========================================

    const fetchExpenses = async () => {
        try {
            const response =
                await api.get("/expenses");

            setExpenses(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {
            console.log(
                "EXPENSE LIST ERROR:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to load expenses"
            );
        }
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {
        fetchExpenses();
        fetchBanks();
    }, [refresh]);

    // ==========================================
    // FILTER EXPENSES
    // ==========================================

    const filteredExpenses =
        expenses.filter((item) => {

            // -------------------------------
            // BANK FILTER
            // -------------------------------

            const matchesBank =
                selectedBank === "all" ||
                String(item.bank_account_id) ===
                String(selectedBank);

            // -------------------------------
            // SEARCH
            // -------------------------------

            const category =
                item.category?.toLowerCase() ||
                "";

            const paymentMethod =
                item.payment_method?.toLowerCase() ||
                "";

            const description =
                item.description?.toLowerCase() ||
                "";

            const keyword =
                search.toLowerCase();

            const matchesSearch =
                category.includes(keyword) ||
                paymentMethod.includes(keyword) ||
                description.includes(keyword);

            return (
                matchesBank &&
                matchesSearch
            );
        });

    // ==========================================
    // DELETE EXPENSE
    // ==========================================

    const deleteExpense = async (id) => {

        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this expense?"
            );

        if (!confirmDelete) {
            return;
        }

        try {
            await api.delete(
                `/expenses/${id}`
            );

            toast.success(
                "Expense deleted successfully"
            );

            fetchExpenses();

        } catch (error) {
            console.log(
                "DELETE ERROR:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to delete expense"
            );
        }
    };

    // ==========================================
    // EDIT EXPENSE
    // ==========================================

    const editExpense = (item) => {
        setSelectedExpense(item);
        setShowModal(true);
    };

    // ==========================================
    // TOTAL EXPENSE
    // ==========================================

    const totalExpense =
        filteredExpenses.reduce(
            (total, item) =>
                total +
                Number(item.amount || 0),
            0
        );

    // ==========================================
    // SELECTED BANK
    // ==========================================

    const selectedBankObject =
        banks.find(
            (bank) =>
                String(bank.id) ===
                String(selectedBank)
        );

    // ==========================================
    // GET BANK INFORMATION
    // ==========================================

    const getBankInfo = (bankId) => {

        if (!bankId) {
            return {
                name: "No Account",
                number: "",
                primary: false,
            };
        }

        const bank = banks.find(
            (item) =>
                String(item.id) ===
                String(bankId)
        );

        if (!bank) {
            return {
                name: "Unknown Account",
                number: "",
                primary: false,
            };
        }

        return {
            name: bank.bank_name,
            number: bank.account_number
                ? `****${String(
                      bank.account_number
                  ).slice(-4)}`
                : "",
            primary: bank.is_primary === true,
        };
    };

    return (
        <div
            style={{
                marginTop: "40px",
            }}
        >

            {/* =====================================
                BANK FILTER
            ====================================== */}

            <div
                style={{
                    background: "#fff",
                    padding: "15px",
                    borderRadius: "10px",
                    marginBottom: "20px",
                    boxShadow:
                        "0 2px 8px rgba(0,0,0,0.08)",
                }}
            >
                <label
                    style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "8px",
                    }}
                >
                    Bank Account
                </label>

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
                        borderRadius: "7px",
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
                                : ""}

                            {bank.is_primary
                                ? " (Primary)"
                                : ""}
                        </option>
                    ))}
                </select>
            </div>

            {/* =====================================
                SELECTED BANK TITLE
            ====================================== */}

            {selectedBank !== "all" &&
                selectedBankObject && (

                    <h3
                        style={{
                            marginBottom:
                                "15px",
                        }}
                    >
                        Expense History -{" "}
                        {selectedBankObject.bank_name}
                    </h3>
                )}

            {/* =====================================
                TOTAL EXPENSE
            ====================================== */}

            <div
                style={{
                    background: "#dc2626",
                    color: "white",
                    padding: "20px",
                    borderRadius: "10px",
                    marginBottom: "20px",
                    fontSize: "22px",
                    fontWeight: "bold",
                }}
            >
                Total Expense : ₹{" "}
                {totalExpense.toLocaleString(
                    "en-IN"
                )}
            </div>

            {/* =====================================
                SEARCH
            ====================================== */}

            <input
                type="text"
                placeholder="Search expenses..."
                value={search}
                onChange={(e) =>
                    setSearch(e.target.value)
                }
                style={{
                    width: "100%",
                    padding: "12px",
                    marginBottom: "20px",
                    borderRadius: "8px",
                    border:
                        "1px solid #ccc",
                    boxSizing:
                        "border-box",
                }}
            />

            {/* =====================================
                TITLE
            ====================================== */}

            <h2>
                Expense History
            </h2>

            {/* =====================================
                TABLE
            ====================================== */}

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
                        background: "white",
                    }}
                >
                    <thead>
                        <tr
                            style={{
                                background:
                                    "#dc2626",
                                color: "white",
                            }}
                        >
                            <th
                                style={{
                                    padding:
                                        "12px",
                                }}
                            >
                                Category
                            </th>

                            <th
                                style={{
                                    padding:
                                        "12px",
                                }}
                            >
                                Payment Method
                            </th>

                            <th
                                style={{
                                    padding:
                                        "12px",
                                }}
                            >
                                Bank Account
                            </th>

                            <th
                                style={{
                                    padding:
                                        "12px",
                                }}
                            >
                                Amount
                            </th>

                            <th
                                style={{
                                    padding:
                                        "12px",
                                }}
                            >
                                Description
                            </th>

                            <th
                                style={{
                                    padding:
                                        "12px",
                                }}
                            >
                                Date
                            </th>

                            <th
                                style={{
                                    padding:
                                        "12px",
                                }}
                            >
                                Action
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredExpenses.length === 0 ? (

                            <tr>
                                <td
                                    colSpan="7"
                                    style={{
                                        padding:
                                            "30px",
                                        textAlign:
                                            "center",
                                        color:
                                            "#777",
                                    }}
                                >
                                    No expenses found
                                    for this bank.
                                </td>
                            </tr>

                        ) : (

                            filteredExpenses.map(
                                (item) => {

                                    const bank =
                                        getBankInfo(
                                            item.bank_account_id
                                        );

                                    return (
                                        <tr
                                            key={item.id}
                                            style={{
                                                textAlign:
                                                    "center",
                                                borderBottom:
                                                    "1px solid #ddd",
                                            }}
                                        >

                                            {/* CATEGORY */}

                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                }}
                                            >
                                                {item.category}
                                            </td>

                                            {/* PAYMENT METHOD */}

                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                }}
                                            >
                                                {item.payment_method}
                                            </td>

                                            {/* BANK ACCOUNT */}

                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                    fontWeight:
                                                        "600",
                                                }}
                                            >
                                                <div>
                                                    {bank.name}
                                                </div>

                                                {bank.number && (
                                                    <div
                                                        style={{
                                                            fontSize:
                                                                "12px",
                                                            color:
                                                                "#64748b",
                                                            marginTop:
                                                                "3px",
                                                        }}
                                                    >
                                                        {bank.number}

                                                        {bank.primary &&
                                                            " • Primary"}
                                                    </div>
                                                )}
                                            </td>

                                            {/* AMOUNT */}

                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                    color:
                                                        "#dc2626",
                                                    fontWeight:
                                                        "600",
                                                }}
                                            >
                                                ₹{" "}
                                                {Number(
                                                    item.amount ||
                                                    0
                                                ).toLocaleString(
                                                    "en-IN"
                                                )}
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

                                            {/* DATE */}

                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                }}
                                            >
                                                {item.date}
                                            </td>

                                            {/* ACTION */}

                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                }}
                                            >

                                                {/* EDIT */}

                                                <button
                                                    onClick={() =>
                                                        editExpense(
                                                            item
                                                        )
                                                    }
                                                    style={{
                                                        background:
                                                            "#ffc107",
                                                        border:
                                                            "none",
                                                        padding:
                                                            "8px",
                                                        marginRight:
                                                            "8px",
                                                        cursor:
                                                            "pointer",
                                                        borderRadius:
                                                            "5px",
                                                    }}
                                                >
                                                    <FaEdit />
                                                </button>

                                                {/* DELETE */}

                                                <button
                                                    onClick={() =>
                                                        deleteExpense(
                                                            item.id
                                                        )
                                                    }
                                                    style={{
                                                        background:
                                                            "#dc3545",
                                                        color:
                                                            "white",
                                                        border:
                                                            "none",
                                                        padding:
                                                            "8px",
                                                        cursor:
                                                            "pointer",
                                                        borderRadius:
                                                            "5px",
                                                    }}
                                                >
                                                    <FaTrash />
                                                </button>

                                            </td>

                                        </tr>
                                    );
                                }
                            )
                        )}
                    </tbody>
                </table>
            </div>

            {/* =====================================
                EDIT MODAL
            ====================================== */}

            <EditExpenseModal
                show={showModal}
                expense={selectedExpense}
                onClose={() =>
                    setShowModal(false)
                }
                refresh={fetchExpenses}
            />

        </div>
    );
}

export default ExpenseList;