import { Schema, model, Document } from "mongoose"

interface FileEntry {
  name: string
  content: string
  language?: string
  updatedAt?: Date
}

export interface RoomDocument extends Document {
  roomId: string
  files: FileEntry[]
  createdAt: Date
  updatedAt: Date
}

// Keep schema declarations simple (no generic type parameter on Schema)
const FileSchema = new Schema(
  {
    name: { type: String, required: true },
    content: { type: String, default: "" },
    language: { type: String, default: "cpp" },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const RoomSchema = new Schema(
  {
    roomId: { type: String, required: true, unique: true },
    files: { type: [FileSchema], default: [] },
  },
  { timestamps: true },
)

// Avoid exporting with a deep generic to prevent TypeScript union complexity errors.
// Use untyped model export; application code can treat documents as RoomDocument where needed.
export const Room = model("Room", RoomSchema)
