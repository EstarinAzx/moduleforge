import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { generateToken } from '../utils/jwt.js';
import { hashPassword, comparePassword } from '../utils/crypto.js';
import { isValidEmail, isValidPassword, isValidDisplayName, normalizeEmail } from '../utils/validation.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// ========================================
// PUBLIC ROUTES
// ========================================

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, displayName } = req.body;

        // Validate inputs
        if (!email || !password || !displayName) {
            res.status(400).json({ error: 'Email, password, and display name are required.' });
            return;
        }

        const normalizedEmail = normalizeEmail(email);

        if (!isValidEmail(normalizedEmail)) {
            res.status(400).json({ error: 'Invalid email format.' });
            return;
        }

        if (!isValidPassword(password)) {
            res.status(400).json({ error: 'Password must be at least 8 characters.' });
            return;
        }

        if (!isValidDisplayName(displayName)) {
            res.status(400).json({ error: 'Display name must be 1-50 characters.' });
            return;
        }

        // Check for existing user
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (existingUser) {
            res.status(400).json({ error: 'Email already registered.' });
            return;
        }

        // Create user
        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                passwordHash,
                displayName: displayName.trim(),
            },
        });

        // Generate token
        const token = generateToken({ userId: user.id, email: user.email });

        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required.' });
            return;
        }

        const normalizedEmail = normalizeEmail(email);

        // Find user (case-insensitive)
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            res.status(401).json({ error: 'Invalid email or password.' });
            return;
        }

        // Compare password
        const isMatch = await comparePassword(password, user.passwordHash);

        if (!isMatch) {
            res.status(401).json({ error: 'Invalid email or password.' });
            return;
        }

        // Generate token
        const token = generateToken({ userId: user.id, email: user.email });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ error: 'Email is required.' });
            return;
        }

        const normalizedEmail = normalizeEmail(email);
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        // Always return success (prevent email enumeration)
        const successMessage = { message: 'If that email exists, a reset link has been sent.' };

        if (!user) {
            res.json(successMessage);
            return;
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = await hashPassword(resetToken);
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: resetTokenHash,
                resetTokenExpiry,
            },
        });

        // Log reset link for MVP (no email sending)
        console.log('\n========================================');
        console.log('PASSWORD RESET LINK (MVP - Console Only)');
        console.log(`http://localhost:5173/reset-password?token=${resetToken}`);
        console.log('========================================\n');

        res.json(successMessage);
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            res.status(400).json({ error: 'Token and new password are required.' });
            return;
        }

        if (!isValidPassword(newPassword)) {
            res.status(400).json({ error: 'Password must be at least 8 characters.' });
            return;
        }

        // Find users with reset tokens (we need to compare hashed tokens)
        const usersWithTokens = await prisma.user.findMany({
            where: {
                resetToken: { not: null },
                resetTokenExpiry: { gt: new Date() },
            },
        });

        // Find matching token
        let matchedUser = null;
        for (const user of usersWithTokens) {
            if (user.resetToken) {
                const isMatch = await comparePassword(token, user.resetToken);
                if (isMatch) {
                    matchedUser = user;
                    break;
                }
            }
        }

        if (!matchedUser) {
            res.status(400).json({ error: 'Invalid or expired reset token.' });
            return;
        }

        // Update password and clear reset token
        const passwordHash = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: matchedUser.id },
            data: {
                passwordHash,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        res.json({ message: 'Password reset successful. Please log in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// ========================================
// PROTECTED ROUTES
// ========================================

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            select: {
                id: true,
                email: true,
                displayName: true,
                createdAt: true,
            },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found.' });
            return;
        }

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// PATCH /api/auth/profile
router.patch('/profile', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { displayName } = req.body;

        if (!displayName || !isValidDisplayName(displayName)) {
            res.status(400).json({ error: 'Display name must be 1-50 characters.' });
            return;
        }

        const user = await prisma.user.update({
            where: { id: req.user!.userId },
            data: { displayName: displayName.trim() },
            select: {
                id: true,
                email: true,
                displayName: true,
                createdAt: true,
            },
        });

        res.json(user);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            res.status(400).json({ error: 'Current and new passwords are required.' });
            return;
        }

        if (!isValidPassword(newPassword)) {
            res.status(400).json({ error: 'New password must be at least 8 characters.' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found.' });
            return;
        }

        const isMatch = await comparePassword(currentPassword, user.passwordHash);

        if (!isMatch) {
            res.status(401).json({ error: 'Current password is incorrect.' });
            return;
        }

        const passwordHash = await hashPassword(newPassword);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash },
        });

        res.json({ message: 'Password changed successfully.' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;
