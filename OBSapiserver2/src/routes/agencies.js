const express = import('express');
const router = express.Router();
const { PrismaClient } = import('@prisma/client');
const prisma = new PrismaClient();

// GET /agencies
router.get('/agencies', async (req, res) => {
  try {
    const agencies = await prisma.agency.findMany();
    res.json(agencies);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST /agencies
router.post('/agencies', async (req, res) => {
  const { name, email } = req.body;
  try {
    const agency = await prisma.agency.create({
      data: {
        name,
        email,
      },
    });
    res.json(agency);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

export {router};

