import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { authenticateToken } from '../middleware/auth.middleware.js'

const router = Router()

// Valid relationship types
const VALID_TYPES = ['related', 'parent', 'child', 'allies', 'enemies', 'located_in', 'belongs_to', 'owns', 'created', 'member_of']

// Helper to verify world ownership
async function verifyWorldOwnership(worldId: string, userId: string) {
    const world = await prisma.world.findFirst({
        where: { id: worldId, ownerId: userId, deletedAt: null },
    })
    return world
}

// GET /api/worlds/:worldId/relationships - List all relationships
router.get('/worlds/:worldId/relationships', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { worldId } = req.params
        const userId = req.user!.userId

        const world = await verifyWorldOwnership(worldId, userId)
        if (!world) {
            res.status(404).json({ error: 'World not found' })
            return
        }

        const relationships = await prisma.entryRelationship.findMany({
            where: { worldId },
            include: {
                source: { select: { id: true, title: true, type: true } },
                target: { select: { id: true, title: true, type: true } },
            },
            orderBy: { createdAt: 'desc' },
        })

        res.json({ relationships })
    } catch (error) {
        console.error('Error fetching relationships:', error)
        res.status(500).json({ error: 'Failed to fetch relationships' })
    }
})

// POST /api/worlds/:worldId/relationships - Create relationship
router.post('/worlds/:worldId/relationships', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { worldId } = req.params
        const userId = req.user!.userId

        const world = await verifyWorldOwnership(worldId, userId)
        if (!world) {
            res.status(404).json({ error: 'World not found' })
            return
        }

        const { sourceId, targetId, label, type = 'related' } = req.body

        if (!sourceId || !targetId) {
            res.status(400).json({ error: 'Source and target entry IDs are required' })
            return
        }

        if (!VALID_TYPES.includes(type)) {
            res.status(400).json({ error: 'Invalid relationship type' })
            return
        }

        // Verify both entries exist in this world
        const [source, target] = await Promise.all([
            prisma.entry.findFirst({ where: { id: sourceId, worldId, deletedAt: null } }),
            prisma.entry.findFirst({ where: { id: targetId, worldId, deletedAt: null } }),
        ])

        if (!source || !target) {
            res.status(400).json({ error: 'Source or target entry not found' })
            return
        }

        // Check for existing relationship
        const existing = await prisma.entryRelationship.findUnique({
            where: { sourceId_targetId: { sourceId, targetId } },
        })

        if (existing) {
            res.status(400).json({ error: 'Relationship already exists' })
            return
        }

        const relationship = await prisma.entryRelationship.create({
            data: { sourceId, targetId, worldId, label: label || null, type },
            include: {
                source: { select: { id: true, title: true, type: true } },
                target: { select: { id: true, title: true, type: true } },
            },
        })

        res.status(201).json(relationship)
    } catch (error) {
        console.error('Error creating relationship:', error)
        res.status(500).json({ error: 'Failed to create relationship' })
    }
})

// Bulk relationship type for type safety
interface BulkRelationship {
    id?: string
    sourceId: string
    targetId: string
    label?: string | null
    type: string
}

// POST /api/worlds/:worldId/relationships/bulk - Bulk save (create/update/delete)
router.post('/worlds/:worldId/relationships/bulk', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { worldId } = req.params
        const userId = req.user!.userId

        const world = await verifyWorldOwnership(worldId, userId)
        if (!world) {
            res.status(404).json({ error: 'World not found' })
            return
        }

        const { relationships, deletedIds } = req.body as {
            relationships: BulkRelationship[]
            deletedIds?: string[]
        }

        if (!Array.isArray(relationships)) {
            res.status(400).json({ error: 'Relationships must be an array' })
            return
        }

        // Delete removed relationships
        if (deletedIds && deletedIds.length > 0) {
            await prisma.entryRelationship.deleteMany({
                where: { id: { in: deletedIds }, worldId },
            })
        }

        // Upsert relationships
        const results = await Promise.all(
            relationships.map(async (rel: BulkRelationship) => {
                if (rel.id) {
                    // Update existing
                    return prisma.entryRelationship.update({
                        where: { id: rel.id },
                        data: { label: rel.label, type: rel.type || 'related' },
                    })
                } else {
                    // Create new (use upsert to handle race conditions)
                    return prisma.entryRelationship.upsert({
                        where: { sourceId_targetId: { sourceId: rel.sourceId, targetId: rel.targetId } },
                        create: {
                            sourceId: rel.sourceId,
                            targetId: rel.targetId,
                            worldId,
                            label: rel.label,
                            type: rel.type || 'related',
                        },
                        update: { label: rel.label, type: rel.type || 'related' },
                    })
                }
            })
        )

        res.json({ saved: results.length, deleted: deletedIds?.length || 0 })
    } catch (error) {
        console.error('Error bulk saving relationships:', error)
        res.status(500).json({ error: 'Failed to save relationships' })
    }
})

// PATCH /api/worlds/:worldId/relationships/:relationshipId - Update relationship
router.patch('/worlds/:worldId/relationships/:relationshipId', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { worldId, relationshipId } = req.params
        const userId = req.user!.userId

        const world = await verifyWorldOwnership(worldId, userId)
        if (!world) {
            res.status(404).json({ error: 'World not found' })
            return
        }

        const relationship = await prisma.entryRelationship.findFirst({
            where: { id: relationshipId, worldId },
        })

        if (!relationship) {
            res.status(404).json({ error: 'Relationship not found' })
            return
        }

        const { label, type } = req.body
        const updateData: { label?: string; type?: string } = {}

        if (label !== undefined) updateData.label = label
        if (type !== undefined) {
            if (!VALID_TYPES.includes(type)) {
                res.status(400).json({ error: 'Invalid relationship type' })
                return
            }
            updateData.type = type
        }

        const updated = await prisma.entryRelationship.update({
            where: { id: relationshipId },
            data: updateData,
            include: {
                source: { select: { id: true, title: true, type: true } },
                target: { select: { id: true, title: true, type: true } },
            },
        })

        res.json(updated)
    } catch (error) {
        console.error('Error updating relationship:', error)
        res.status(500).json({ error: 'Failed to update relationship' })
    }
})

// DELETE /api/worlds/:worldId/relationships/:relationshipId - Delete relationship
router.delete('/worlds/:worldId/relationships/:relationshipId', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { worldId, relationshipId } = req.params
        const userId = req.user!.userId

        const world = await verifyWorldOwnership(worldId, userId)
        if (!world) {
            res.status(404).json({ error: 'World not found' })
            return
        }

        const relationship = await prisma.entryRelationship.findFirst({
            where: { id: relationshipId, worldId },
        })

        if (!relationship) {
            res.status(404).json({ error: 'Relationship not found' })
            return
        }

        await prisma.entryRelationship.delete({
            where: { id: relationshipId },
        })

        res.json({ message: 'Relationship deleted' })
    } catch (error) {
        console.error('Error deleting relationship:', error)
        res.status(500).json({ error: 'Failed to delete relationship' })
    }
})

export default router
