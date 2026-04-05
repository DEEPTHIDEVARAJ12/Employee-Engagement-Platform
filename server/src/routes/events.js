import { Router } from 'express'
import Event from '../models/Event.js'
import { auth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const { from, to } = req.query
    const filter = {}
    if (from) filter.startDate = { ...filter.startDate, $gte: new Date(from) }
    if (to) filter.startDate = { ...filter.startDate, $lte: new Date(to) }
    const events = await Event.find(filter)
      .populate('createdBy', 'name')
      .sort({ startDate: 1 })
    res.json(events)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const { title, description, startDate, endDate, location, allDay = false } = req.body
    if (!title?.trim() || !startDate) return res.status(400).json({ message: 'Title and start date required' })
    const event = await Event.create({
      title: title.trim(),
      description: description || '',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      location: location || '',
      createdBy: req.userId,
      allDay: !!allDay,
    })
    const populated = await Event.findById(event._id).populate('createdBy', 'name')
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/:id', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const { title, description, startDate, endDate, location, allDay } = req.body
    const event = await Event.findById(req.params.id)
    if (!event) return res.status(404).json({ message: 'Not found' })
    if (title != null) event.title = title.trim()
    if (description != null) event.description = description
    if (startDate != null) event.startDate = new Date(startDate)
    if (endDate != null) event.endDate = endDate ? new Date(endDate) : null
    if (location != null) event.location = location
    if (allDay != null) event.allDay = !!allDay
    await event.save()
    const populated = await Event.findById(event._id).populate('createdBy', 'name')
    res.json(populated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/:id', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id)
    if (!event) return res.status(404).json({ message: 'Not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
