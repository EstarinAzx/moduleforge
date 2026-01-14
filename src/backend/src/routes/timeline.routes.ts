import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = Router()

// All routes require authentication
router.use(authenticateToken)

// List timeline events for a world
router.get('/worlds/:worldId/timeline', async (req: Request, res: Response) => {
    try {
        const { worldId } = req.params
        const userId = req.user!.userId

        // Verify world ownership
        const world = await prisma.world.findFirst({
            where: { id: worldId, ownerId: userId, deletedAt: null }
        })
        if (!world) {
            return res.status(404).json({ error: 'World not found' })
        }

        const events = await prisma.timelineEvent.findMany({
            where: { worldId, deletedAt: null },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
        })

        res.json({ events })
    } catch (error) {
        console.error('List timeline error:', error)
        res.status(500).json({ error: 'Failed to list timeline events' })
    }
})

// Create timeline event
router.post('/worlds/:worldId/timeline', async (req: Request, res: Response) => {
    try {
        const { worldId } = req.params
        const userId = req.user!.userId
        const { title, description, content, date, sortOrder, importance } = req.body

        if (!title?.trim()) {
            return res.status(400).json({ error: 'Title is required' })
        }
        if (!date?.trim()) {
            return res.status(400).json({ error: 'Date is required' })
        }

        // Verify world ownership
        const world = await prisma.world.findFirst({
            where: { id: worldId, ownerId: userId, deletedAt: null }
        })
        if (!world) {
            return res.status(404).json({ error: 'World not found' })
        }

        const event = await prisma.timelineEvent.create({
            data: {
                worldId,
                title: title.trim(),
                description: description || null,
                content: content || '',
                date: date.trim(),
                sortOrder: sortOrder || 0,
                importance: importance || 'normal',
            }
        })

        res.status(201).json(event)
    } catch (error) {
        console.error('Create timeline error:', error)
        res.status(500).json({ error: 'Failed to create timeline event' })
    }
})

// Get single timeline event
router.get('/worlds/:worldId/timeline/:id', async (req: Request, res: Response) => {
    try {
        const { worldId, id } = req.params
        const userId = req.user!.userId

        // Verify world ownership
        const world = await prisma.world.findFirst({
            where: { id: worldId, ownerId: userId, deletedAt: null }
        })
        if (!world) {
            return res.status(404).json({ error: 'World not found' })
        }

        const event = await prisma.timelineEvent.findFirst({
            where: { id, worldId, deletedAt: null }
        })
        if (!event) {
            return res.status(404).json({ error: 'Event not found' })
        }

        res.json(event)
    } catch (error) {
        console.error('Get timeline error:', error)
        res.status(500).json({ error: 'Failed to get timeline event' })
    }
})

// Update timeline event
router.patch('/worlds/:worldId/timeline/:id', async (req: Request, res: Response) => {
    try {
        const { worldId, id } = req.params
        const userId = req.user!.userId
        const { title, description, content, date, sortOrder, importance } = req.body

        // Verify world ownership
        const world = await prisma.world.findFirst({
            where: { id: worldId, ownerId: userId, deletedAt: null }
        })
        if (!world) {
            return res.status(404).json({ error: 'World not found' })
        }

        const existing = await prisma.timelineEvent.findFirst({
            where: { id, worldId, deletedAt: null }
        })
        if (!existing) {
            return res.status(404).json({ error: 'Event not found' })
        }

        const event = await prisma.timelineEvent.update({
            where: { id },
            data: {
                ...(title !== undefined && { title: title.trim() }),
                ...(description !== undefined && { description }),
                ...(content !== undefined && { content }),
                ...(date !== undefined && { date: date.trim() }),
                ...(sortOrder !== undefined && { sortOrder }),
                ...(importance !== undefined && { importance }),
            }
        })

        res.json(event)
    } catch (error) {
        console.error('Update timeline error:', error)
        res.status(500).json({ error: 'Failed to update timeline event' })
    }
})

// Delete timeline event (soft delete)
router.delete('/worlds/:worldId/timeline/:id', async (req: Request, res: Response) => {
    try {
        const { worldId, id } = req.params
        const userId = req.user!.userId

        // Verify world ownership
        const world = await prisma.world.findFirst({
            where: { id: worldId, ownerId: userId, deletedAt: null }
        })
        if (!world) {
            return res.status(404).json({ error: 'World not found' })
        }

        await prisma.timelineEvent.update({
            where: { id },
            data: { deletedAt: new Date() }
        })

        res.json({ success: true })
    } catch (error) {
        console.error('Delete timeline error:', error)
        res.status(500).json({ error: 'Failed to delete timeline event' })
    }
})

export default router
