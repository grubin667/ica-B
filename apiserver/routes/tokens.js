const express = import('express');
const router = express.Router();
const { PrismaClient } = import('@prisma/client');
const prisma = new PrismaClient();

// GET /tokens
router.get('/tokens', async (req, res) => {
  try {
    const tokens = await prisma.token.findMany();
    res.json(tokens);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST /tokens
router.post('/tokens', async (req, res) => {
  const { name, email } = req.body;
  try {
    const token = await prisma.token.create({
      data: {
        name,
        email,
      },
    });
    res.json(token);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

export {router};

