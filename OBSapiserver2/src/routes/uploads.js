const express = import('express');
const router = express.Router();
const { PrismaClient } = import('@prisma/client');
const prisma = new PrismaClient();

// GET /uploads
router.get('/uploads', async (req, res) => {
  try {
    const uploads = await prisma.upload.findMany();
    res.json(uploads);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST /uploads
router.post('/uploads', async (req, res) => {
  const { name, email } = req.body;
  try {
    const upload = await prisma.upload.create({
      data: {
        name,
        email,
      },
    });
    res.json(upload);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

export {router};

