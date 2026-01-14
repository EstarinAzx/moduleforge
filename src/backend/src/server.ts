import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import worldRoutes from './routes/world.routes.js';
import entryRoutes from './routes/entry.routes.js';
import relationshipRoutes from './routes/relationship.routes.js';
import loreRoutes from './routes/lore.routes.js';
import timelineRoutes from './routes/timeline.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/worlds', worldRoutes);
app.use('/api/worlds', entryRoutes);
app.use('/api', relationshipRoutes);
app.use('/api', loreRoutes);
app.use('/api', timelineRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
