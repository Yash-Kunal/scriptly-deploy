import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import GitHubCorner from "./components/GitHubCorner"
import Toast from "./components/toast/Toast"
import EditorPage from "./pages/EditorPage"
import HomePage from "./pages/HomePage"
import React, { useState } from "react";
import AuthForm from "./components/AuthForm";

const App = () => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<{ email: string; username: string } | null>(
        localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
    );

    const handleAuthSuccess = (jwt: string, userObj: { email: string; username: string }) => {
        setToken(jwt);
        setUser(userObj);
        localStorage.setItem('token', jwt);
        localStorage.setItem('user', JSON.stringify(userObj));
    };

    if (!token || !user) {
        return <AuthForm onAuthSuccess={handleAuthSuccess} />;
    }

    return (
        <>
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-gray-900 bg-opacity-80 px-3 py-2 rounded shadow border border-gray-700">
                <span className="text-white font-semibold text-base truncate max-w-[120px]">{user?.username}</span>
                <button
                    onClick={() => {
                        setToken(null);
                        setUser(null);
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                    }}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 font-semibold text-sm shadow"
                >
                    Logout
                </button>
            </div>
            <Router>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/editor/:roomId" element={<EditorPage />} />
                </Routes>
            </Router>
            <Toast /> {/* Toast component from react-hot-toast */}
            
        </>
    );
}

export default App
