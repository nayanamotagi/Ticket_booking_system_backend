import Event from '../models/event.model.js'

export const listEvents = async (req, res, next) => {
    try {
        const events = await Event.find().select('-__v')
        res.json(events)
    } catch (error) {
        next(error)
    }
}

export const getEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id).select('-__v')
        if (!event) return res.status(404).json({ message: 'Event not found' })
        res.json(event)
    } catch (error) {
        next(error)
    }
}
