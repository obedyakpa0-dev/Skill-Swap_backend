import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import profilesRoutes from './routes/profiles.routes.js';
import skillsRoutes from './routes/skills.routes.js';
import matchesRoutes from './routes/matches.routes.js';
import messagesRoutes from './routes/messages.routes.js';
import sessionsRoutes from './routes/sessions.routes.js';
import reviewsRoutes from './routes/reviews.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import adminRoutes from './routes/admin.routes.js';

import { errorHandler } from './middleware/error.middleware.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/profiles', profilesRoutes);
app.use('/api/v1/skills', skillsRoutes);
app.use('/api/v1/matches', matchesRoutes);
app.use('/api/v1/messages', messagesRoutes);
app.use('/api/v1/sessions', sessionsRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/admin', adminRoutes);

// Must be registered last — Express only treats a 4-arg function as an
// error handler, and only calls it once something upstream calls next(err).
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SkillSwap backend running on port ${PORT}`);
});
