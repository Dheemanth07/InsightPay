import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
    const { user } = useAuth();

    const logout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    return (
        <div style={{ padding: "20px" }}>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <h1>Dashboard</h1>
                <button onClick={logout}>Logout</button>
            </div>

            {/* Welcome */}
            <p style={{ marginTop: "10px" }}>
                Welcome, <strong>{user?.name}</strong>
            </p>

            {/* Balance Card */}
            <div
                style={{
                    marginTop: "20px",
                    padding: "16px",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    maxWidth: "300px",
                }}
            >
                <h3>Wallet Balance</h3>
                <p style={{ fontSize: "20px", fontWeight: "bold" }}>₹ 0.00</p>
                <small>(Will be dynamic in next phase)</small>
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: "20px" }}>
                <h3>Quick Actions</h3>
                <button disabled style={{ marginRight: "10px" }}>
                    Send Money
                </button>
                <button disabled>Receive Money</button>
            </div>

            {/* Coming Soon */}
            <div style={{ marginTop: "30px", color: "#777" }}>
                <p>📊 Expense tracking, analytics, and insights coming soon.</p>
            </div>
        </div>
    );
}
