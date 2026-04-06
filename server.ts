import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'enterprise_secret_key_2026';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(uploadDir));

  // --- Seed Data ---
  const seed = async () => {
    const adminEmail = 'admin@idap.ai';
    const annotatorEmail = 'annotator@idap.ai';
    
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) {
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: await bcrypt.hash('admin123', 10),
          role: 'ADMIN'
        }
      });
    }

    const annotator = await prisma.user.findUnique({ where: { email: annotatorEmail } });
    if (!annotator) {
      await prisma.user.create({
        data: {
          email: annotatorEmail,
          password: await bcrypt.hash('annotator123', 10),
          role: 'ANNOTATOR'
        }
      });
    }
  };
  await seed();

  // --- Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    next();
  };

  // --- Auth Routes ---
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, role: role || 'ANNOTATOR' },
      });
      res.json({ message: 'User created' });
    } catch (e) {
      res.status(400).json({ error: 'User already exists' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  });

  // --- Task Routes ---
  app.get('/api/tasks', authenticate, async (req: any, res) => {
    const where = req.user.role === 'ADMIN' ? {} : { annotators: { some: { id: req.user.id } } };
    const tasks = await prisma.task.findMany({
      where,
      include: {
        _count: { select: { images: true } },
        images: { include: { annotations: true } },
        annotators: { select: { id: true, email: true } }
      }
    });
    res.json(tasks);
  });

  app.post('/api/tasks', authenticate, isAdmin, upload.array('images'), async (req: any, res) => {
    const { name, labels, annotatorIds } = req.body;
    const files = req.files as Express.Multer.File[];

    const task = await prisma.task.create({
      data: {
        name,
        labels: JSON.stringify(Array.isArray(labels) ? labels : [labels]),
        createdById: req.user.id,
        annotators: { connect: (Array.isArray(annotatorIds) ? annotatorIds : [annotatorIds]).map((id: string) => ({ id })) },
        images: {
          create: files.map(file => ({ url: `/uploads/${file.filename}` }))
        }
      }
    });
    res.json(task);
  });

  app.get('/api/tasks/:id', authenticate, async (req: any, res) => {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        images: { include: { annotations: { where: { annotatorId: req.user.id } } } },
        annotators: true
      }
    });
    res.json(task);
  });

  // --- Annotation Routes ---
  app.post('/api/annotations', authenticate, async (req: any, res) => {
    const { imageId, taskId, label, prelabelUsed, isDifficult } = req.body;
    const annotation = await prisma.annotation.create({
      data: {
        imageId,
        taskId,
        label,
        annotatorId: req.user.id,
        prelabelUsed,
        isDifficult
      }
    });
    await prisma.image.update({
      where: { id: imageId },
      data: { status: 'ANNOTATED' }
    });
    res.json(annotation);
  });

  // --- Pre-label Mock ---
  app.get('/api/prelabel/:imageId', authenticate, async (req, res) => {
    const image = await prisma.image.findUnique({ where: { id: req.params.imageId }, include: { task: true } });
    if (!image) return res.status(404).json({ error: 'Image not found' });

    const labels = JSON.parse(image.task.labels);
    // Simulated AI Logic: In production, call TensorFlow Serving or HuggingFace API here
    // Example: const response = await axios.post('http://model-server/predict', { image_url: image.url });
    const mockLabel = labels[Math.floor(Math.random() * labels.length)];
    const confidence = 0.85 + Math.random() * 0.1;

    res.json({ label: mockLabel, confidence });
  });

  // --- Review Routes ---
  app.put('/api/annotations/:id/review', authenticate, isAdmin, async (req, res) => {
    const { isAccepted, rejectReason } = req.body;
    const annotation = await prisma.annotation.update({
      where: { id: req.params.id },
      data: { isAccepted, rejectReason }
    });
    await prisma.image.update({
      where: { id: annotation.imageId },
      data: { status: isAccepted ? 'APPROVED' : 'REJECTED' }
    });
    res.json(annotation);
  });

  // --- Stats ---
  app.get('/api/stats', authenticate, isAdmin, async (req, res) => {
    const totalTasks = await prisma.task.count();
    const totalImages = await prisma.image.count();
    const totalAnnotations = await prisma.annotation.count();
    const recentAnnotations = await prisma.annotation.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { image: true, annotator: { select: { email: true } } }
    });

    res.json({ totalTasks, totalImages, totalAnnotations, recentAnnotations });
  });

  app.get('/api/users/annotators', authenticate, isAdmin, async (req, res) => {
    const users = await prisma.user.findMany({ where: { role: 'ANNOTATOR' }, select: { id: true, email: true } });
    res.json(users);
  });

  // --- Vite Integration ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
