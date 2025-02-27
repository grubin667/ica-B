const express = import('express');
const router = express.Router();
const { PrismaClient } = import('@prisma/client');
const prisma = new PrismaClient();

// GET /results
router.get('/results', async (req, res) => {
  try {
    const results = await prisma.result.findMany();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST /results
router.post('/results', async (req, res) => {
  const { name, email } = req.body;
  try {
    const result = await prisma.result.create({
      data: {
        name,
        email,
      },
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

export {router};

