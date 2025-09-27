import SplitterComponent from "@/components/SplitterComponent"
import ConnectionStatusPage from "@/components/connection/ConnectionStatusPage"
import Sidebar from "@/components/sidebar/Sidebar"
import WorkSpace from "@/components/workspace"
import { useAppContext } from "@/context/AppContext"
import { useSocket } from "@/context/SocketContext"
import useFullScreen from "@/hooks/useFullScreen"
import useUserActivity from "@/hooks/useUserActivity"
import { SocketEvent } from "@/types/socket"
import { USER_STATUS, RemoteUser, USER_CONNECTION_STATUS } from "@/types/user"
import { useEffect } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"

function EditorPage() {
    // Listen user online/offline status
    useUserActivity()
    // Enable fullscreen mode
    useFullScreen()
    const navigate = useNavigate()
    const { roomId } = useParams()
    const { status, setCurrentUser, currentUser } = useAppContext()
    const { socket } = useSocket()
    const location = useLocation()

    useEffect(() => {
        // Prioritize existing username from currentUser (which now loads from localStorage)
        // But if username isn't set yet, try to get it from location state
        let username = currentUser.username;
        
        // If no username from localStorage, try location state
        if (!username || username.length === 0) {
            username = location.state?.username;
        }

        if (!username) {
            // If we still don't have a username, redirect to homepage
            navigate("/", {
                state: { roomId },
            });
            return;
        }

        // Only update currentUser if we need to set roomId or if username changed
        if (roomId && (currentUser.roomId !== roomId || !currentUser.username)) {
            const user: RemoteUser = { 
                username, 
                roomId,
                status: USER_CONNECTION_STATUS.OFFLINE,
                cursorPosition: 0,
                typing: false,
                currentFile: "",
                socketId: "",
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
    ])

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
