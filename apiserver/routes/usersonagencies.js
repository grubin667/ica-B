const express = import('express');
const router = express.Router();
const { PrismaClient } = import('@prisma/client');
const prisma = new PrismaClient();

// GET /usersonagencies
router.get('/usersonagencies', async (req, res) => {
  try {
    const usersonagencies = await prisma.usersonagencies.findMany();
    res.json(usersonagencies);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST /usersonagencies
router.post('/usersonagencies', async (req, res) => {
  const { name, email } = req.body;
  try {
    const usersonagencies = await prisma.usersonagencies.create({
      data: {
        name,
        email,
      },
    });
    res.json(usersonagencies);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

export {router};

