const express = import('express');
const router = express.Router();
const { PrismaClient } = import('@prisma/client');
const prisma = new PrismaClient();

// GET /audiofiles
router.get('/audiofiles', async (req, res) => {
  try {
    const audiofiles = await prisma.audiofile.findMany();
    res.json(audiofiles);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST /audiofiles
router.post('/audiofiles', async (req, res) => {
  const { name, email } = req.body;
  try {
    const audiofile = await prisma.audiofile.create({
      data: {
        name,
        email,
      },
    });
    res.json(audiofile);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

export {router};

