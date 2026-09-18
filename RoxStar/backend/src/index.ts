import 'dotenv/config';
import express from 'express';
import http from 'http';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import draftRoutes from './routes/drafts.js';
import spinRoutes from './routes/spins.js';
import userRoutes from './routes/users.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { initializeSocket } from './socket/index.js';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '25mb' }));
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/spins', spinRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
initializeSocket(server);

const startServer = async () => {
  await connectDatabase();
  server.listen(port, () => {
    console.log(`RoxStar backend listening on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
