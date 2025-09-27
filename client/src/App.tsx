import { Route, BrowserRouter as Router, Routes } from "react-router-dom"
import Toast from "./components/toast/Toast"
import EditorPage from "./pages/EditorPage"
import HomePage from "./pages/HomePage"
import AuthForm from "./components/AuthForm";
import { useAuth } from "./hooks/useAuth";
import { useEffect } from "react";

const App = () => {
    const { user, login, logout, isAuthenticated } = useAuth();
    
    // Debug logging for auth state changes
    useEffect(() => {
        console.log("App.tsx - Auth state changed:", { 
            isAuthenticated, 
            username: user?.username 
        });
    }, [isAuthenticated, user]);

    const handleAuthSuccess = (jwt: string, userObj: { email: string; username: string }) => {
        console.log("Auth success, logging in with:", userObj.username);
        login(jwt, userObj);
    };

    if (!isAuthenticated) {
        return <AuthForm onAuthSuccess={handleAuthSuccess} />;
    }

    return (
        <>
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-gray-900 bg-opacity-80 px-3 py-2 rounded shadow border border-gray-700">
                <span className="text-white font-semibold text-base truncate max-w-[120px]">{user?.username}</span>
                <button
                    onClick={logout}
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
