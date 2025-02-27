const express = import('express');
const router = express.Router();
const { PrismaClient } = import('@prisma/client');
const prisma = new PrismaClient();

// GET /helps
router.get('/helps', async (req, res) => {
  try {
    const helps = await prisma.help.findMany();
    res.json(helps);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST /helps
router.post('/helps', async (req, res) => {
  const { name, email } = req.body;
  try {
    const help = await prisma.help.create({
      data: {
        name,
        email,
      },
    });
    res.json(help);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

export {router};

