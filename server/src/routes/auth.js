import { Router } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { auth } from '../middleware/auth.js'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'worksphere-secret-change-in-production'

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'employee' } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' })
    }
    if (!['admin', 'hr', 'employee'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }
    const existing = await User.findOne({ email })
    if (existing) return res.status(400).json({ message: 'Email already registered' })

    const user = await User.create({ name, email, password, role })
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    })
  } catch (err) {
    res.status(500).json({ message: err.message || 'Registration failed' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }
    const user = await User.findOne({ email }).select('+password')
    if (!user) return res.status(401).json({ message: 'Invalid email or password' })
    const valid = await user.comparePassword(password)
    if (!valid) return res.status(401).json({ message: 'Invalid email or password' })

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    })
  } catch (err) {
    res.status(500).json({ message: err.message || 'Login failed' })
  }
})

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
