const express = import('express');
const router = express.Router();
const { PrismaClient } = import('@prisma/client');
const prisma = new PrismaClient();

// GET /models
router.get('/models', async (req, res) => {
  try {
    const models = await prisma.model.findMany();
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST /models
router.post('/models', async (req, res) => {
  const { name, email } = req.body;
  try {
    const model = await prisma.model.create({
      data: {
        name,
        email,
      },
    });
    res.json(model);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

export {router};

