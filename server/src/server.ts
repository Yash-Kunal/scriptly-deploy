import express, { Response, Request } from "express"
import mongoose from "mongoose"
import authRoutes from "./routes/auth"
import roomsRoutes from "./routes/rooms"
import roomFilesRoutes from "./routes/roomFiles"
import { Room } from "./models/Room"
import dotenv from "dotenv"
import http from "http"
import cors from "cors"
import { SocketEvent, SocketId } from "./types/socket"
import { USER_CONNECTION_STATUS, User } from "./types/user"
import { Server } from "socket.io"
import path from "path"

dotenv.config()

const app = express()

// CORS configuration MUST come first, before any routes
app.use(cors({
    origin: [
        'http://localhost:5173', // Local development
        'http://localhost:3000', // Local development
        'https://scriptly-client.onrender.com' // Production client
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}))

// Handle preflight requests explicitly
app.options('*', cors())

app.use(express.json())

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/codesync';
mongoose.connect(MONGO_URI)
	.then(() => console.log('MongoDB connected'))
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		.catch((err: any) => console.error('MongoDB connection error:', err));

// Auth routes
app.use("/api/auth", authRoutes)
app.use("/api/rooms", roomsRoutes)
app.use("/api/rooms", roomFilesRoutes)

app.use(express.static(path.join(__dirname, "public"))) // Serve static files

// Serve static files from client build in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../client/dist')));
    
    // Handle React routing - send all non-API requests to React app
    app.get('*', (req: Request, res: Response) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
        }
    });
}

const server = http.createServer(app)
const io = new Server(server, {
	cors: {
		origin: [
			'http://localhost:5173',
			'http://localhost:3000', 
			'https://scriptly-client.onrender.com'
		],
		credentials: true,
		methods: ['GET', 'POST']
	},
	maxHttpBufferSize: 1e8,
	pingTimeout: 60000,
})

let userSocketMap: User[] = []

// Function to get all users in a room
function getUsersInRoom(roomId: string): User[] {
	return userSocketMap.filter((user) => user.roomId == roomId);
}

// Function to check if a user ID exists in a room
function isUserIdInRoom(roomId: string, userId: string): boolean {
	return userSocketMap.some((user) => user.roomId === roomId && user.userId === userId);
}

// Function to get room id by socket id
function getRoomId(socketId: SocketId): string | null {
	const roomId = userSocketMap.find(
		(user) => user.socketId === socketId
	)?.roomId

	if (!roomId) {
		console.error("Room ID is undefined for socket ID:", socketId)
		return null
	}
	return roomId
}

function getUserBySocketId(socketId: SocketId): User | null {
	const user = userSocketMap.find((user) => user.socketId === socketId)
	if (!user) {
		console.error("User not found for socket ID:", socketId)
		return null
	}
	return user
}

io.on("connection", (socket) => {
    const MAX_ROOM_CAPACITY = 5
	// Handle user actions
	socket.on(SocketEvent.JOIN_REQUEST, ({ roomId, username }) => {
		// Remove any previous entry for this socket in this room
		userSocketMap = userSocketMap.filter(
			(u) => !(u.socketId === socket.id && u.roomId === roomId)
		);

		// Enforce room capacity using Socket.IO adapter room size
		try {
			const roomSet = io.sockets.adapter.rooms.get(roomId)
			const currentCount = roomSet ? roomSet.size : 0
			if (currentCount >= MAX_ROOM_CAPACITY) {
				// Notify the joining socket that the room is full
				socket.emit("room-full", {
					roomId,
					message: `Room ${roomId} is full. Maximum allowed users: ${MAX_ROOM_CAPACITY}`,
				})
				return
			}
		} catch (err) {
			console.warn("Failed to check room capacity", err)
		}

		// Check if user ID exists in the room
		if (isUserIdInRoom(roomId, socket.handshake.query.userId as string)) {
			io.to(socket.id).emit(SocketEvent.USERNAME_EXISTS);
			return;
		}

		const user = {
			username,
			roomId,
			status: USER_CONNECTION_STATUS.ONLINE,
			cursorPosition: 0,
			typing: false,
			socketId: socket.id,
			currentFile: null,
			userId: typeof socket.handshake.query.userId === 'string' ? socket.handshake.query.userId : '', // Ensure userId is a string
		};
		userSocketMap.push(user);
		socket.join(roomId);
		socket.broadcast.to(roomId).emit(SocketEvent.USER_JOINED, { user });
		const users = getUsersInRoom(roomId);
		io.to(socket.id).emit(SocketEvent.JOIN_ACCEPTED, { user, users });

		// Load or create room files and send to the joining client
		;(async () => {
			try {
				let room = await Room.findOne({ roomId })
				if (!room) {
					const defaultFile = {
						name: "main.cpp",
						content: `#include <iostream>\n\nint main() {\n  std::cout << "Hello world" << std::endl;\n  return 0;\n}`,
						language: "cpp",
					}
					// cast to any to avoid TypeScript producing a too-complex union type
					room = (await Room.create({ roomId, files: [defaultFile] })) as any
				}
				if (room) {
					io.to(socket.id).emit("room-files", { files: room.files })
				} else {
					console.error("room is null after creation/fetch for roomId", roomId)
				}
			} catch (err) {
				console.error("error loading room files for join", err)
			}
		})()
	});

	socket.on("disconnecting", () => {
		const user = getUserBySocketId(socket.id)
		if (!user) return
		const roomId = user.roomId
		socket.broadcast
			.to(roomId)
			.emit(SocketEvent.USER_DISCONNECTED, { user })
		userSocketMap = userSocketMap.filter((u) => u.socketId !== socket.id)
		socket.leave(roomId)
	})

	// Handle file actions
	socket.on(
		SocketEvent.SYNC_FILE_STRUCTURE,
		({ fileStructure, openFiles, activeFile, socketId }) => {
			io.to(socketId).emit(SocketEvent.SYNC_FILE_STRUCTURE, {
				fileStructure,
				openFiles,
				activeFile,
			})
		}
	)

	socket.on(
		SocketEvent.DIRECTORY_CREATED,
		({ parentDirId, newDirectory }) => {
			const roomId = getRoomId(socket.id)
			if (!roomId) return
			socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_CREATED, {
				parentDirId,
				newDirectory,
			})
		}
	)

	socket.on(SocketEvent.DIRECTORY_UPDATED, ({ dirId, children }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_UPDATED, {
			dirId,
			children,
		})
	})

	// Listen for save-room-files from clients and persist to DB
	socket.on("save-room-files", async ({ roomId, files }) => {
		if (!roomId) return
		try {
			await Room.findOneAndUpdate({ roomId }, { files, updatedAt: new Date() }, { upsert: true })
			// Broadcast updated files to others in the room
			socket.to(roomId).emit("room-files-updated", { files })
		} catch (err) {
			console.error("save-room-files error", err)
		}
	})

	socket.on(SocketEvent.DIRECTORY_RENAMED, ({ dirId, newName }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.DIRECTORY_RENAMED, {
			dirId,
			newName,
		})
	})

	socket.on(SocketEvent.DIRECTORY_DELETED, ({ dirId }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast
			.to(roomId)
			.emit(SocketEvent.DIRECTORY_DELETED, { dirId })
	})

	socket.on(SocketEvent.FILE_CREATED, ({ parentDirId, newFile }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast
			.to(roomId)
			.emit(SocketEvent.FILE_CREATED, { parentDirId, newFile })
	})

	socket.on(SocketEvent.FILE_UPDATED, ({ fileId, newContent }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.FILE_UPDATED, {
			fileId,
			newContent,
		})
	})

	socket.on(SocketEvent.FILE_RENAMED, ({ fileId, newName }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.FILE_RENAMED, {
			fileId,
			newName,
		})
	})

	socket.on(SocketEvent.FILE_DELETED, ({ fileId }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.FILE_DELETED, { fileId })
	})

	// Handle user status
	socket.on(SocketEvent.USER_OFFLINE, ({ socketId }) => {
		userSocketMap = userSocketMap.map((user) => {
			if (user.socketId === socketId) {
				return { ...user, status: USER_CONNECTION_STATUS.OFFLINE }
			}
			return user
		})
		const roomId = getRoomId(socketId)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.USER_OFFLINE, { socketId })
	})

	socket.on(SocketEvent.USER_ONLINE, ({ socketId }) => {
		userSocketMap = userSocketMap.map((user) => {
			if (user.socketId === socketId) {
				return { ...user, status: USER_CONNECTION_STATUS.ONLINE }
			}
			return user
		})
		const roomId = getRoomId(socketId)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.USER_ONLINE, { socketId })
	})

	// Handle chat actions
	socket.on(SocketEvent.SEND_MESSAGE, ({ message }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		
		// Ensure username is properly set before broadcasting
		const user = getUserBySocketId(socket.id)
		if (user && (!message.username || message.username === "")) {
			message.username = user.username
		}
		
		// Add socketId to ensure proper message alignment on client
		message.socketId = socket.id
		
		socket.broadcast
			.to(roomId)
			.emit(SocketEvent.RECEIVE_MESSAGE, { message })
	})

	// Handle cursor position
	socket.on(SocketEvent.TYPING_START, ({ cursorPosition }) => {
		userSocketMap = userSocketMap.map((user) => {
			if (user.socketId === socket.id) {
				return { ...user, typing: true, cursorPosition }
			}
			return user
		})
		const user = getUserBySocketId(socket.id)
		if (!user) return
		const roomId = user.roomId
		socket.broadcast.to(roomId).emit(SocketEvent.TYPING_START, { user })
	})

	socket.on(SocketEvent.TYPING_PAUSE, () => {
		userSocketMap = userSocketMap.map((user) => {
			if (user.socketId === socket.id) {
				return { ...user, typing: false }
			}
			return user
		})
		const user = getUserBySocketId(socket.id)
		if (!user) return
		const roomId = user.roomId
		socket.broadcast.to(roomId).emit(SocketEvent.TYPING_PAUSE, { user })
	})

	socket.on(SocketEvent.REQUEST_DRAWING, () => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast
			.to(roomId)
			.emit(SocketEvent.REQUEST_DRAWING, { socketId: socket.id })
	})

	socket.on(SocketEvent.SYNC_DRAWING, ({ drawingData, socketId }) => {
		socket.broadcast
			.to(socketId)
			.emit(SocketEvent.SYNC_DRAWING, { drawingData })
	})

	socket.on(SocketEvent.DRAWING_UPDATE, ({ snapshot }) => {
		const roomId = getRoomId(socket.id)
		if (!roomId) return
		socket.broadcast.to(roomId).emit(SocketEvent.DRAWING_UPDATE, {
			snapshot,
		})
	})
})

const PORT = process.env.PORT || 3000

app.get("/", (req: Request, res: Response) => {
	// Send the index.html file
	res.sendFile(path.join(__dirname, "..", "public", "index.html"))
})

server.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`)
})
