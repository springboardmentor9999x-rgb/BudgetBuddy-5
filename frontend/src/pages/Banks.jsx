import { useState } from "react";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

import BankAccountForm from "../components/bank/BankAccountForm";
import BankAccountList from "../components/bank/BankAccountList";

function Banks() {

    const [refresh, setRefresh] = useState(false);

    const reloadBanks = () => {
        setRefresh((prev) => !prev);
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f5f7fb",
            }}
        >

            <Sidebar />

            <main
                style={{
                    marginLeft: "250px",
                    minHeight: "100vh",
                    padding: "20px",
                    boxSizing: "border-box",
                }}
            >

                <Navbar />

                <h1
                    style={{
                        marginTop: "25px",
                    }}
                >
                    Bank Accounts
                </h1>

                <BankAccountForm
                    refresh={reloadBanks}
                />

                <BankAccountList
                    refresh={refresh}
                />

            </main>

        </div>
    );
}

export default Banks;