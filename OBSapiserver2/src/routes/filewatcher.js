const express = import('express');
const router = express.Router();
const { PrismaClient } = import('@prisma/client');
const prisma = new PrismaClient();

// GET /filewatchers
router.get('/filewatchers', async (req, res) => {
  try {
    const filewatchers = await prisma.filewatcher.findMany();
    res.json(filewatchers);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST /filewatchers
router.post('/filewatchers', async (req, res) => {
  const { name, email } = req.body;
  try {
    const filewatcher = await prisma.filewatcher.create({
      data: {
        name,
        email,
      },
    });
    res.json(filewatcher);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

export {router};

