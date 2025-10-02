import { Router } from "express"
import { Room } from "../models/Room"

const router = Router()

// Get files for a room (create with default if missing)
router.get("/:roomId/files", async (req, res) => {
  const { roomId } = req.params
  try {
    // Fetch the Room Document (not lean) so types align with Mongoose Document
    let room = await Room.findOne({ roomId })
    if (!room) {
      const defaultFile = {
        name: "main.cpp",
        content: `#include <iostream>\n\nint main() {\n  std::cout << "Hello world" << std::endl;\n  return 0;\n}`,
        language: "cpp",
      }
  // cast to any to avoid complex union type issues in ts-node
  room = (await Room.create({ roomId, files: [defaultFile] })) as any
  // created room should be non-null; return early with created files
  return res.json({ files: room ? room.files : [] })
    }

    // Guard and return files if present
    if (!room.files) {
      return res.json({ files: [] })
    }

    return res.json({ files: room.files })
  } catch (err) {
    console.error("roomFiles GET error", err)
    return res.status(500).json({ error: "failed to fetch files" })
  }
})

// Replace entire file list for a room (upsert)
router.put("/:roomId/files", async (req, res) => {
  const { roomId } = req.params
  const { files } = req.body
    try {
      const room = await Room.findOneAndUpdate(
        { roomId },
        { files, updatedAt: new Date() },
        { upsert: true, new: true },
      )

      if (!room) {
        // This should not happen due to upsert: true, but handle gracefully
        return res.json({ files: [] })
      }

      return res.json({ files: room.files })
    } catch (err) {
    console.error("roomFiles PUT error", err)
    return res.status(500).json({ error: "failed to save files" })
  }
})

export default router
