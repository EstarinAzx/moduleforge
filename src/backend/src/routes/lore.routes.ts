import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = Router()

// All routes require authentication
router.use(authenticateToken)

// List lore articles for a world
router.get('/worlds/:worldId/lore', async (req: Request, res: Response) => {
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

        const articles = await prisma.loreArticle.findMany({
            where: { worldId, deletedAt: null },
            orderBy: [{ category: 'asc' }, { order: 'asc' }, { title: 'asc' }]
        })

        res.json({ articles })
    } catch (error) {
        console.error('List lore error:', error)
        res.status(500).json({ error: 'Failed to list lore articles' })
    }
})

// Create lore article
router.post('/worlds/:worldId/lore', async (req: Request, res: Response) => {
    try {
        const { worldId } = req.params
        const userId = req.user!.userId
        const { title, content, category } = req.body

        if (!title?.trim()) {
            return res.status(400).json({ error: 'Title is required' })
        }

        // Verify world ownership
        const world = await prisma.world.findFirst({
            where: { id: worldId, ownerId: userId, deletedAt: null }
        })
        if (!world) {
            return res.status(404).json({ error: 'World not found' })
        }

        const article = await prisma.loreArticle.create({
            data: {
                worldId,
                title: title.trim(),
                content: content || '',
                category: category || 'general',
            }
        })

        res.status(201).json(article)
    } catch (error) {
        console.error('Create lore error:', error)
        res.status(500).json({ error: 'Failed to create lore article' })
    }
})

// Get single lore article
router.get('/worlds/:worldId/lore/:id', async (req: Request, res: Response) => {
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

        const article = await prisma.loreArticle.findFirst({
            where: { id, worldId, deletedAt: null }
        })
        if (!article) {
            return res.status(404).json({ error: 'Article not found' })
        }

        res.json(article)
    } catch (error) {
        console.error('Get lore error:', error)
        res.status(500).json({ error: 'Failed to get lore article' })
    }
})

// Update lore article
router.patch('/worlds/:worldId/lore/:id', async (req: Request, res: Response) => {
    try {
        const { worldId, id } = req.params
        const userId = req.user!.userId
        const { title, content, category, order } = req.body

        // Verify world ownership
        const world = await prisma.world.findFirst({
            where: { id: worldId, ownerId: userId, deletedAt: null }
        })
        if (!world) {
            return res.status(404).json({ error: 'World not found' })
        }

        const existing = await prisma.loreArticle.findFirst({
            where: { id, worldId, deletedAt: null }
        })
        if (!existing) {
            return res.status(404).json({ error: 'Article not found' })
        }

        const article = await prisma.loreArticle.update({
            where: { id },
            data: {
                ...(title !== undefined && { title: title.trim() }),
                ...(content !== undefined && { content }),
                ...(category !== undefined && { category }),
                ...(order !== undefined && { order }),
            }
        })

        res.json(article)
    } catch (error) {
        console.error('Update lore error:', error)
        res.status(500).json({ error: 'Failed to update lore article' })
    }
})

// Delete lore article (soft delete)
router.delete('/worlds/:worldId/lore/:id', async (req: Request, res: Response) => {
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

        await prisma.loreArticle.update({
            where: { id },
            data: { deletedAt: new Date() }
        })

        res.json({ success: true })
    } catch (error) {
        console.error('Delete lore error:', error)
        res.status(500).json({ error: 'Failed to delete lore article' })
    }
})

export default router
