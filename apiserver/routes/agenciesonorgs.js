const express = import('express');
const router = express.Router();
const { PrismaClient } = import('@prisma/client');
const prisma = new PrismaClient();

// GET /agenciesonorgs
router.get('/agenciesonorgs', async (req, res) => {
  try {
    const agenciesonorgs = await prisma.agenciesonorg.findMany();
    res.json(agenciesonorgs);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST /agenciesonorgs
router.post('/agenciesonorgs', async (req, res) => {
  const { name, email } = req.body;
  try {
    const agenciesonorg = await prisma.agenciesonorg.create({
      data: {
        name,
        email,
      },
    });
    res.json(agenciesonorg);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

export {router};
