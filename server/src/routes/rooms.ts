import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: any;
}

// Middleware to authenticate JWT
function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Get all rooms for the logged-in user
router.get('/my-rooms', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userDoc = await User.findById(req.user.id);
    if (!userDoc) return res.status(404).json({ message: 'User not found' });
    res.json({ rooms: (userDoc.rooms as string[]) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a room to the user's rooms list (idempotent)
router.post('/add-room', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ message: 'Room ID required' });
  try {
    const userDoc = await User.findById(req.user.id);
    if (!userDoc) return res.status(404).json({ message: 'User not found' });
    if (!(userDoc.rooms as string[]).includes(roomId)) {
      (userDoc.rooms as string[]).push(roomId);
      await userDoc.save();
    }
    res.json({ rooms: (userDoc.rooms as string[]) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
