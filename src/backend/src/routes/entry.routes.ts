import { Router, Request, Response } from 'express';
import sanitizeHtml from 'sanitize-html';
import { prisma } from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { sanitizeConfig } from './world.routes.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Valid entry types
const VALID_ENTRY_TYPES = ['character', 'location', 'item', 'faction', 'custom'];

// Helper to validate world ownership
async function validateWorldOwnership(worldId: string, userId: string): Promise<{ valid: boolean; error?: string; status?: number }> {
    const world = await prisma.world.findUnique({
        where: { id: worldId },
        select: { ownerId: true, deletedAt: true }
    });

    if (!world || world.deletedAt) {
        return { valid: false, error: 'World not found.', status: 404 };
    }

    if (world.ownerId !== userId) {
        return { valid: false, error: 'Access denied.', status: 403 };
    }

    return { valid: true };
}

// Default metadata fields by entry type
const DEFAULT_METADATA: Record<string, unknown[]> = {
    character: [
        { id: 'age', name: 'Age', type: 'number', value: '' },
        { id: 'species', name: 'Species', type: 'text', value: '' },
        { id: 'status', name: 'Status', type: 'dropdown', value: '', options: ['Alive', 'Dead', 'Unknown'] }
    ],
    location: [
        { id: 'region', name: 'Region', type: 'text', value: '' },
        { id: 'climate', name: 'Climate', type: 'dropdown', value: '', options: ['Tropical', 'Arid', 'Temperate', 'Cold', 'Polar'] },
        { id: 'population', name: 'Population', type: 'text', value: '' }
    ],
    item: [
        { id: 'rarity', name: 'Rarity', type: 'dropdown', value: '', options: ['Common', 'Uncommon', 'Rare', 'Legendary'] },
        { id: 'origin', name: 'Origin', type: 'text', value: '' }
    ],
    faction: [
        { id: 'alignment', name: 'Alignment', type: 'dropdown', value: '', options: ['Good', 'Neutral', 'Evil'] },
        { id: 'leader', name: 'Leader', type: 'text', value: '' }
    ],
    custom: [
        { id: 'notes', name: 'Notes', type: 'text', value: '' }
    ]
};

// POST /api/worlds/:worldId/entries - Create entry
router.post('/:worldId/entries', async (req: Request, res: Response) => {
    try {
        const { worldId } = req.params;
        const { type, title, description } = req.body;

        // Validate world ownership
        const ownershipCheck = await validateWorldOwnership(worldId, req.user!.userId);
        if (!ownershipCheck.valid) {
            res.status(ownershipCheck.status!).json({ error: ownershipCheck.error });
            return;
        }

        // Validate type
        if (!type || !VALID_ENTRY_TYPES.includes(type)) {
            res.status(400).json({ error: `Type must be one of: ${VALID_ENTRY_TYPES.join(', ')}` });
            return;
        }

        // Validate title
        if (!title || typeof title !== 'string') {
            res.status(400).json({ error: 'Title is required.' });
            return;
        }

        const trimmedTitle = title.trim();
        if (trimmedTitle.length === 0 || trimmedTitle.length > 100) {
            res.status(400).json({ error: 'Title must be 1-100 characters.' });
            return;
        }

        // Validate description if provided
        if (description && description.length > 500) {
            res.status(400).json({ error: 'Description must be 500 characters or less.' });
            return;
        }

        const entry = await prisma.entry.create({
            data: {
                worldId,
                type,
                title: trimmedTitle,
                description: description?.trim() || null,
                content: '',
                metadata: JSON.parse(JSON.stringify(DEFAULT_METADATA[type] || [])),
            },
        });

        res.status(201).json(entry);
    } catch (error) {
        console.error('Create entry error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/worlds/:worldId/entries - List entries in world
router.get('/:worldId/entries', async (req: Request, res: Response) => {
    try {
        const { worldId } = req.params;

        // Validate world ownership
        const ownershipCheck = await validateWorldOwnership(worldId, req.user!.userId);
        if (!ownershipCheck.valid) {
            res.status(ownershipCheck.status!).json({ error: ownershipCheck.error });
            return;
        }

        const type = req.query.type as string | undefined;
        const search = req.query.search as string | undefined;
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
        const skip = (page - 1) * limit;

        // Build where clause
        const where = {
            worldId,
            deletedAt: null,
            ...(type && VALID_ENTRY_TYPES.includes(type) && { type }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' as const } },
                    { description: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
        };

        // Get entries and count in parallel
        const [entries, total] = await Promise.all([
            prisma.entry.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    type: true,
                    title: true,
                    description: true,
                    coverImageUrl: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
            prisma.entry.count({ where }),
        ]);

        res.json({
            entries,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('List entries error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/worlds/:worldId/entries/search - Quick search for entry linking
router.get('/:worldId/entries/search', async (req: Request, res: Response) => {
    try {
        const { worldId } = req.params;
        const q = req.query.q as string;

        // Validate world ownership
        const ownershipCheck = await validateWorldOwnership(worldId, req.user!.userId);
        if (!ownershipCheck.valid) {
            res.status(ownershipCheck.status!).json({ error: ownershipCheck.error });
            return;
        }

        if (!q || q.length < 1) {
            res.json({ entries: [] });
            return;
        }

        const entries = await prisma.entry.findMany({
            where: {
                worldId,
                deletedAt: null,
                title: { contains: q, mode: 'insensitive' },
            },
            take: 10,
            select: {
                id: true,
                title: true,
                type: true,
            },
            orderBy: { title: 'asc' },
        });

        res.json({ entries });
    } catch (error) {
        console.error('Search entries error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/worlds/:worldId/entries/:entryId - Get single entry
router.get('/:worldId/entries/:entryId', async (req: Request, res: Response) => {
    try {
        const { worldId, entryId } = req.params;

        // Validate world ownership
        const ownershipCheck = await validateWorldOwnership(worldId, req.user!.userId);
        if (!ownershipCheck.valid) {
            res.status(ownershipCheck.status!).json({ error: ownershipCheck.error });
            return;
        }

        const entry = await prisma.entry.findFirst({
            where: {
                id: entryId,
                worldId,
                deletedAt: null,
            },
        });

        if (!entry) {
            res.status(404).json({ error: 'Entry not found.' });
            return;
        }

        res.json(entry);
    } catch (error) {
        console.error('Get entry error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// PATCH /api/worlds/:worldId/entries/:entryId - Update entry
router.patch('/:worldId/entries/:entryId', async (req: Request, res: Response) => {
    try {
        const { worldId, entryId } = req.params;

        // Validate world ownership
        const ownershipCheck = await validateWorldOwnership(worldId, req.user!.userId);
        if (!ownershipCheck.valid) {
            res.status(ownershipCheck.status!).json({ error: ownershipCheck.error });
            return;
        }

        // Find entry
        const existingEntry = await prisma.entry.findFirst({
            where: {
                id: entryId,
                worldId,
                deletedAt: null,
            },
        });

        if (!existingEntry) {
            res.status(404).json({ error: 'Entry not found.' });
            return;
        }

        const { title, description, content, metadata, coverImageUrl } = req.body;
        const updateData: Record<string, unknown> = {};

        // Validate and set title
        if (title !== undefined) {
            if (typeof title !== 'string') {
                res.status(400).json({ error: 'Invalid title.' });
                return;
            }
            const trimmedTitle = title.trim();
            if (trimmedTitle.length === 0 || trimmedTitle.length > 100) {
                res.status(400).json({ error: 'Title must be 1-100 characters.' });
                return;
            }
            updateData.title = trimmedTitle;
        }

        // Validate and set description
        if (description !== undefined) {
            if (description && description.length > 500) {
                res.status(400).json({ error: 'Description must be 500 characters or less.' });
                return;
            }
            updateData.description = description?.trim() || null;
        }

        // Sanitize and set content
        if (content !== undefined) {
            updateData.content = sanitizeHtml(content, sanitizeConfig);
        }

        // Set metadata (JSON validation handled by Prisma)
        if (metadata !== undefined) {
            updateData.metadata = metadata;
        }

        // Set cover image URL
        if (coverImageUrl !== undefined) {
            updateData.coverImageUrl = coverImageUrl?.trim() || null;
        }

        const updatedEntry = await prisma.entry.update({
            where: { id: entryId },
            data: updateData,
        });

        res.json(updatedEntry);
    } catch (error) {
        console.error('Update entry error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// DELETE /api/worlds/:worldId/entries/:entryId - Soft delete entry
router.delete('/:worldId/entries/:entryId', async (req: Request, res: Response) => {
    try {
        const { worldId, entryId } = req.params;

        // Validate world ownership
        const ownershipCheck = await validateWorldOwnership(worldId, req.user!.userId);
        if (!ownershipCheck.valid) {
            res.status(ownershipCheck.status!).json({ error: ownershipCheck.error });
            return;
        }

        // Find entry
        const entry = await prisma.entry.findFirst({
            where: {
                id: entryId,
                worldId,
                deletedAt: null,
            },
        });

        if (!entry) {
            res.status(404).json({ error: 'Entry not found.' });
            return;
        }

        // Soft delete
        await prisma.entry.update({
            where: { id: entryId },
            data: { deletedAt: new Date() },
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Delete entry error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;
