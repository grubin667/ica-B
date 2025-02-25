const express = import('express');
const router = express.Router();
const { PrismaClient } = import('@prisma/client');
const prisma = new PrismaClient();

// GET /usersonorgs
router.get('/usersonorgs', async (req, res) => {
  try {
    const usersonorgs = await prisma.usersonorg.findMany();
    res.json(usersonorgs);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST /usersonorgs
router.post('/usersonorgs', async (req, res) => {
  const { name, email } = req.body;
  try {
    const usersonorg = await prisma.usersonorg.create({
      data: {
        name,
        email,
      },
    });
    res.json(usersonorg);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

export {router};

