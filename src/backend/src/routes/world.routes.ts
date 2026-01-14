import { Router, Request, Response } from 'express';
import sanitizeHtml from 'sanitize-html';
import { prisma } from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// HTML sanitization config - shared with entries
export const sanitizeConfig: sanitizeHtml.IOptions = {
    allowedTags: ['p', 'h1', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'blockquote', 'br', 'hr'],
    allowedAttributes: {
        'a': ['href', 'target', 'rel', 'data-entry-link'],
    },
    transformTags: {
        'a': (tagName, attribs) => ({
            tagName,
            attribs: {
                ...attribs,
                target: '_blank',
                rel: 'noopener noreferrer',
            },
        }),
    },
};

// POST /api/worlds - Create world
router.post('/', async (req: Request, res: Response) => {
    try {
        const { title, description, coverImageUrl } = req.body;

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

        const world = await prisma.world.create({
            data: {
                title: trimmedTitle,
                description: description?.trim() || null,
                content: '',
                metadata: undefined,
                coverImageUrl: coverImageUrl?.trim() || null,
                visibility: 'private',
                ownerId: req.user!.userId,
            },
        });

        res.status(201).json(world);
    } catch (error) {
        console.error('Create world error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/worlds - List user's worlds
router.get('/', async (req: Request, res: Response) => {
    try {
        const search = req.query.search as string | undefined;
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
        const skip = (page - 1) * limit;

        // Build where clause
        const where = {
            ownerId: req.user!.userId,
            deletedAt: null,
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' as const } },
                    { description: { contains: search, mode: 'insensitive' as const } },
                ],
            }),
        };

        // Get worlds and count in parallel
        const [worlds, total] = await Promise.all([
            prisma.world.findMany({
                where,
                orderBy: { updatedAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    description: true,
                    coverImageUrl: true,
                    visibility: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: {
                        select: { entries: { where: { deletedAt: null } } }
                    }
                },
            }),
            prisma.world.count({ where }),
        ]);

        res.json({
            worlds: worlds.map(w => ({
                ...w,
                entryCount: w._count.entries,
                _count: undefined
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('List worlds error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/worlds/:id - Get single world with entry counts by type
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const world = await prisma.world.findUnique({
            where: { id: req.params.id },
        });

        if (!world || world.deletedAt) {
            res.status(404).json({ error: 'World not found.' });
            return;
        }

        if (world.ownerId !== req.user!.userId) {
            res.status(403).json({ error: 'Access denied.' });
            return;
        }

        // Get entry counts by type
        const entryCounts = await prisma.entry.groupBy({
            by: ['type'],
            where: {
                worldId: world.id,
                deletedAt: null,
            },
            _count: true,
        });

        const entryCountsByType: Record<string, number> = {};
        entryCounts.forEach(e => {
            entryCountsByType[e.type] = e._count;
        });

        res.json({
            ...world,
            entryCounts: entryCountsByType,
        });
    } catch (error) {
        console.error('Get world error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// PATCH /api/worlds/:id - Update world
router.patch('/:id', async (req: Request, res: Response) => {
    try {
        // Find world and verify ownership
        const existingWorld = await prisma.world.findUnique({
            where: { id: req.params.id },
        });

        if (!existingWorld || existingWorld.deletedAt) {
            res.status(404).json({ error: 'World not found.' });
            return;
        }

        if (existingWorld.ownerId !== req.user!.userId) {
            res.status(403).json({ error: 'Access denied.' });
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

        const updatedWorld = await prisma.world.update({
            where: { id: req.params.id },
            data: updateData,
        });

        res.json(updatedWorld);
    } catch (error) {
        console.error('Update world error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// DELETE /api/worlds/:id - Soft delete world (entries cascade automatically)
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const world = await prisma.world.findUnique({
            where: { id: req.params.id },
        });

        if (!world || world.deletedAt) {
            res.status(404).json({ error: 'World not found.' });
            return;
        }

        if (world.ownerId !== req.user!.userId) {
            res.status(403).json({ error: 'Access denied.' });
            return;
        }

        // Soft delete world and all its entries
        await prisma.$transaction([
            prisma.entry.updateMany({
                where: { worldId: world.id },
                data: { deletedAt: new Date() },
            }),
            prisma.world.update({
                where: { id: req.params.id },
                data: { deletedAt: new Date() },
            }),
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error('Delete world error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;
