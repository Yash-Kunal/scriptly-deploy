import SplitterComponent from "@/components/SplitterComponent"
import ConnectionStatusPage from "@/components/connection/ConnectionStatusPage"
import Sidebar from "@/components/sidebar/Sidebar"
import WorkSpace from "@/components/workspace"
import { useAppContext } from "@/context/AppContext"
import { useSocket } from "@/context/SocketContext"
import useFullScreen from "@/hooks/useFullScreen"
import useUserActivity from "@/hooks/useUserActivity"
import { useAuth } from "@/hooks/useAuth"
import { SocketEvent } from "@/types/socket"
import { USER_STATUS, RemoteUser, USER_CONNECTION_STATUS } from "@/types/user"
import { useEffect } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useFileSystem } from "@/context/FileContext"

function EditorPage() {
    // Listen user online/offline status
    useUserActivity()
    // Enable fullscreen mode
    useFullScreen()
    const navigate = useNavigate()
    const { roomId } = useParams()
    const { status, setCurrentUser, currentUser } = useAppContext()
    const { socket } = useSocket()
    const { resetFiles } = useFileSystem()
    const location = useLocation()
    const { user: authUser } = useAuth()

    useEffect(() => {
        // Get username from auth state first (most reliable source)
        let username = authUser?.username;
        
        // If not in auth state, fallback to location state
        if (!username) {
            username = location.state?.username;
        }

        if (!username) {
            // If we still don't have a username, redirect to homepage
            navigate("/", {
                state: { roomId },
            });
            return;
        }

        // Update currentUser if roomId changed, username changed, or if currentUser doesn't match auth username
        const shouldUpdateUser = roomId && 
            (currentUser.roomId !== roomId || 
             currentUser.username !== username ||
             !currentUser.username);
             
        if (shouldUpdateUser) {
            console.log("EditorPage: Updating current user with username:", username);
            const user: RemoteUser = { 
                username, 
                roomId,
                status: USER_CONNECTION_STATUS.OFFLINE,
                cursorPosition: 0,
                typing: false,
                currentFile: "",
                socketId: "",
            }
            // Reset file state before joining a new room to prevent leaking files
            try {
                resetFiles()
            } catch (e) {
                console.warn("resetFiles not available", e)
            }
            setCurrentUser(user);
            socket.emit(SocketEvent.JOIN_REQUEST, { username, roomId });
        }
    }, [
        currentUser.username,
        currentUser.roomId,
        location.state?.username,
        navigate,
        roomId,
        setCurrentUser,
        socket,
        authUser?.username // only depend on the username string
    ])
    
    // Clear files when leaving the room or unmounting the page
    useEffect(() => {
        return () => {
            try {
                resetFiles()
            } catch (e) {
                // noop
            }
        }
    }, [resetFiles])

    if (status === USER_STATUS.CONNECTION_FAILED) {
        return <ConnectionStatusPage />
    }

    return (
        <SplitterComponent>
            <Sidebar />
            <WorkSpace/>
        </SplitterComponent>
    )
}

export default EditorPage
