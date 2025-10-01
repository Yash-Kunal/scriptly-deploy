import {
    ACTIVITY_STATE,
    AppContext as AppContextType,
    DrawingData,
} from "@/types/app";
import { RemoteUser, USER_STATUS, USER_CONNECTION_STATUS } from "@/types/user";
import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === null) {
        throw new Error(
            "useAppContext must be used within a AppContextProvider"
        );
    }
    return context;
};

function AppContextProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [users, setUsers] = useState<RemoteUser[]>([]);
    const [status, setStatus] = useState<USER_STATUS>(USER_STATUS.INITIAL);
    
    // Initialize currentUser with username from auth state
    const [currentUser, setCurrentUser] = useState<RemoteUser>({
        username: user?.username || "",
        roomId: "",
        status: USER_CONNECTION_STATUS.OFFLINE,
        cursorPosition: 0,
        typing: false,
        currentFile: "",
        socketId: "",
    });
    
    // Update currentUser when auth user changes
    useEffect(() => {
        // Only update currentUser if the username actually changed to avoid
        // triggering a render loop where multiple components keep updating each other.
        if (user) {
            if (user.username && user.username !== currentUser.username) {
                console.log("Auth state changed - updating username to:", user.username);
                setCurrentUser(prev => ({
                    ...prev,
                    username: user.username
                }));
            }
        } else {
            if (currentUser.username !== "" || currentUser.roomId !== "") {
                console.log("Auth user is null, resetting username");
                setCurrentUser(prev => ({
                    ...prev,
                    username: "",
                    roomId: ""
                }));
            }
        }
    }, [user, currentUser.username, currentUser.roomId, setCurrentUser]);
    
    const [activityState, setActivityState] = useState<ACTIVITY_STATE>(
        ACTIVITY_STATE.CODING
    );
    const [drawingData, setDrawingData] = useState<DrawingData>(null);

    return (
        <AppContext.Provider
            value={{
                users,
                setUsers,
                currentUser,
                setCurrentUser,
                status,
                setStatus,
                activityState,
                setActivityState,
                drawingData,
                setDrawingData,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

// Export both the context and the provider. Default export should be the provider
// so Vite's React plugin can consistently fast-refresh the component.
export { AppContext, AppContextProvider };
export default AppContextProvider;
