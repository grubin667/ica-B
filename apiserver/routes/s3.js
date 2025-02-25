const express = import('express');
const router = express.Router();
const { PrismaClient } = import('@prisma/client');
const prisma = new PrismaClient();

// GET /s3s
router.get('/s3s', async (req, res) => {
  try {
    const s3s = await prisma.s3.findMany();
    res.json(s3s);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST /s3s
router.post('/s3s', async (req, res) => {
  const { name, email } = req.body;
  try {
    const s3 = await prisma.s3.create({
      data: {
        name,
        email,
      },
    });
    res.json(s3);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

export {router};

