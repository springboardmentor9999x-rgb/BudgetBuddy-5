function Navbar() {
    return (
        <div
            style={{
                height: "70px",
                background: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 30px",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
            }}
        >
            <h2>Dashboard</h2>

            <div>
                👤 Welcome
            </div>
        </div>
    );
}

export default Navbar;