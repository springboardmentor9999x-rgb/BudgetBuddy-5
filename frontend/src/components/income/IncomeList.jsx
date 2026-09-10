import { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import { FaEdit, FaTrash } from "react-icons/fa";
import EditIncomeModal from "./EditIncomeModal";

function IncomeList({ refresh }) {
    const [income, setIncome] = useState([]);
    const [filteredIncome, setFilteredIncome] = useState([]);

    const [banks, setBanks] = useState([]);
    const [selectedBank, setSelectedBank] = useState("all");

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [selectedIncome, setSelectedIncome] = useState(null);

    // ==========================================
    // LOAD BANK ACCOUNTS
    // ==========================================

    const fetchBanks = async () => {
        try {
            const response = await api.get("/banks");

            const bankList = Array.isArray(response.data)
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
    // LOAD INCOME
    // ==========================================

    const fetchIncome = async () => {
        try {
            const token =
                localStorage.getItem("token");

            const response = await api.get(
                "/income",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            setIncome(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (error) {
            console.log(
                "INCOME LOAD ERROR:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to load income"
            );
        }
    };

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {
        fetchIncome();
        fetchBanks();
    }, [refresh]);

    // ==========================================
    // FILTER INCOME
    // ==========================================

    useEffect(() => {
        const keyword =
            search.toLowerCase();

        const result = income.filter((item) => {

            // -------------------------------
            // BANK FILTER
            // -------------------------------

            const matchesBank =
                selectedBank === "all" ||
                String(item.bank_account_id) ===
                String(selectedBank);

            // -------------------------------
            // SEARCH FILTER
            // -------------------------------

            const source =
                item.source?.toLowerCase() || "";

            const category =
                item.category?.toLowerCase() || "";

            const description =
                item.description?.toLowerCase() || "";

            const matchesSearch =
                source.includes(keyword) ||
                category.includes(keyword) ||
                description.includes(keyword);

            return (
                matchesBank &&
                matchesSearch
            );
        });

        setFilteredIncome(result);

    }, [
        income,
        search,
        selectedBank
    ]);

    // ==========================================
    // CHECK OPENING BALANCE
    // ==========================================

    const isOpeningBalance = (item) => {
        return (
            item.source ===
            "Bank Account Opening Balance"
            ||
            item.category ===
            "Opening Balance"
        );
    };

    // ==========================================
    // DELETE INCOME
    // ==========================================

    const deleteIncome = async (id) => {

        if (
            !window.confirm(
                "Delete this income?"
            )
        ) {
            return;
        }

        try {
            const token =
                localStorage.getItem("token");

            await api.delete(
                `/income/${id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            toast.success(
                "Income Deleted"
            );

            fetchIncome();

        } catch (error) {
            console.log(
                "DELETE INCOME ERROR:",
                error
            );

            toast.error(
                error.response?.data?.detail ||
                "Unable to delete"
            );
        }
    };

    // ==========================================
    // EDIT INCOME
    // ==========================================

    const editIncome = (item) => {

        // Opening balance cannot be edited
        if (isOpeningBalance(item)) {

            toast.info(
                "Opening Balance cannot be modified."
            );

            return;
        }

        setSelectedIncome(item);
        setShowModal(true);
    };

    // ==========================================
    // TOTAL INCOME
    // ==========================================

    const totalIncome =
        filteredIncome.reduce(
            (sum, item) =>
                sum + Number(item.amount || 0),
            0
        );

    // ==========================================
    // GET SELECTED BANK
    // ==========================================

    const selectedBankObject =
        banks.find(
            (bank) =>
                String(bank.id) ===
                String(selectedBank)
        );

    // ==========================================
    // GET BANK NAME
    // ==========================================

    const getBankName = (bankId) => {

        if (!bankId) {
            return "No Account";
        }

        const bank = banks.find(
            (item) =>
                String(item.id) ===
                String(bankId)
        );

        if (!bank) {
            return "Unknown Account";
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
    // GET BANK OBJECT FOR DISPLAY
    // ==========================================

    const getBankObject = (bankId) => {

        return banks.find(
            (bank) =>
                String(bank.id) ===
                String(bankId)
        );
    };

    return (
        <>
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
                        Income History -{" "}
                        {selectedBankObject.bank_name}
                    </h3>
                )}

            {/* =====================================
                TOTAL INCOME
            ====================================== */}

            <div
                style={{
                    background: "#3949db",
                    color: "white",
                    padding: "20px",
                    borderRadius: "10px",
                    marginBottom: "20px",
                    fontSize: "22px",
                    fontWeight: "bold",
                }}
            >
                Total Income : ₹{" "}
                {totalIncome.toLocaleString(
                    "en-IN"
                )}
            </div>

            {/* =====================================
                SEARCH
            ====================================== */}

            <input
                type="text"
                placeholder="Search Income..."
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
                                    "#3949db",
                                color: "white",
                            }}
                        >
                            <th
                                style={{
                                    padding:
                                        "12px",
                                }}
                            >
                                Source
                            </th>

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
                        {filteredIncome.length === 0 ? (

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
                                    No income found
                                    for this bank.
                                </td>
                            </tr>

                        ) : (

                            filteredIncome.map(
                                (item) => {

                                    const openingBalance =
                                        isOpeningBalance(
                                            item
                                        );

                                    const bank =
                                        getBankObject(
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

                                            {/* SOURCE */}

                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                    fontWeight:
                                                        openingBalance
                                                            ? "600"
                                                            : "normal",
                                                }}
                                            >
                                                {item.source}
                                            </td>

                                            {/* CATEGORY */}

                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                }}
                                            >
                                                {item.category}
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
                                                {bank ? (
                                                    <div>
                                                        <div>
                                                            {bank.bank_name}
                                                        </div>

                                                        {bank.account_number && (
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
                                                                ****
                                                                {String(
                                                                    bank.account_number
                                                                ).slice(
                                                                    -4
                                                                )}

                                                                {bank.is_primary &&
                                                                    " • Primary"}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    getBankName(
                                                        item.bank_account_id
                                                    )
                                                )}
                                            </td>

                                            {/* AMOUNT */}

                                            <td
                                                style={{
                                                    padding:
                                                        "12px",
                                                    color:
                                                        "#16a34a",
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
                                                {openingBalance ? (

                                                    <span
                                                        style={{
                                                            display:
                                                                "inline-block",
                                                            padding:
                                                                "7px 12px",
                                                            borderRadius:
                                                                "6px",
                                                            background:
                                                                "#f1f5f9",
                                                            color:
                                                                "#64748b",
                                                            fontSize:
                                                                "13px",
                                                            fontWeight:
                                                                "600",
                                                        }}
                                                    >
                                                        🔒 Locked
                                                    </span>

                                                ) : (

                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                editIncome(
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
                                                                    "10px",
                                                                cursor:
                                                                    "pointer",
                                                                borderRadius:
                                                                    "5px",
                                                            }}
                                                        >
                                                            <FaEdit />
                                                        </button>

                                                        <button
                                                            onClick={() =>
                                                                deleteIncome(
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
                                                    </>
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

            {/* =====================================
                EDIT MODAL
            ====================================== */}

            <EditIncomeModal
                show={showModal}
                income={selectedIncome}
                onClose={() =>
                    setShowModal(false)
                }
                refresh={fetchIncome}
            />
        </>
    );
}

export default IncomeList;