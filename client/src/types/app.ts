import { StoreSnapshot, TLRecord } from "@tldraw/tldraw"
import { RemoteUser, USER_STATUS } from "./user"

type DrawingData = StoreSnapshot<TLRecord> | null

enum ACTIVITY_STATE {
    CODING = "coding",
    DRAWING = "drawing",
}

interface AppContext {
    users: RemoteUser[]
    setUsers: (
        users: RemoteUser[] | ((users: RemoteUser[]) => RemoteUser[]),
    ) => void
    currentUser: RemoteUser
    setCurrentUser: (user: RemoteUser) => void
    status: USER_STATUS
    setStatus: (status: USER_STATUS) => void
    activityState: ACTIVITY_STATE
    setActivityState: (state: ACTIVITY_STATE) => void
    drawingData: DrawingData
    setDrawingData: (data: DrawingData) => void
}

export { ACTIVITY_STATE }
export { AppContext, DrawingData }
