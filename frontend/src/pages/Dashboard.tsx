import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
    const { user } = useAuth();

    const logout = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    return (
        <div>
            <h1>Dashboard</h1>
            <p>Welcome, {user?.name}</p>
            <button onClick={logout}>Logout</button>
        </div>
    );
}
