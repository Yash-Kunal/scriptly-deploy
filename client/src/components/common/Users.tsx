import { useAppContext } from "@/context/AppContext"
import { RemoteUser, USER_CONNECTION_STATUS } from "@/types/user"
import Avatar from "react-avatar"


function Users() {
    const { users, currentUser } = useAppContext()

    // Include current user in the list if not already present (compare by socketId)
    const allUsers = users.find(user => user.socketId === currentUser.socketId)
        ? users
        : [...users, currentUser];

    return (
        <div className="flex min-h-[200px] flex-grow justify-center overflow-y-auto py-2">
            <div className="flex h-full w-full flex-wrap items-start gap-x-2 gap-y-6">
                {allUsers.map((user) => {
                    return <User key={user.socketId || user.username} user={user} isMe={user.socketId === currentUser.socketId} />
                })}
            </div>
        </div>
    )
}

const User = ({ user, isMe }: { user: RemoteUser, isMe?: boolean }) => {
    const { username, status } = user;
    // Show only the provided username; fall back to 'Anonymous' if empty
    const displayName = username || 'Anonymous';
    const title = `${displayName} - ${status === USER_CONNECTION_STATUS.ONLINE ? "online" : "offline"}`;

    return (
        <div
            className={`relative flex w-[100px] flex-col items-center gap-2 ${isMe ? 'border-2 border-blue-500' : ''}`}
            title={title}
        >
            <Avatar name={displayName} size="50" round={"12px"} title={title} />
            <p className="line-clamp-2 max-w-full text-ellipsis break-words font-semibold">
                {displayName}
            </p>
            <div
                className={`absolute right-5 top-0 h-3 w-3 rounded-full ${
                    status === USER_CONNECTION_STATUS.ONLINE
                        ? "bg-green-500"
                        : "bg-danger"
                }`}
            ></div>
        </div>
    );
};

export default Users
