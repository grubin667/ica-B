const express = import('express');
const router = express.Router();
const { PrismaClient } = import('@prisma/client');
const prisma = new PrismaClient();

// GET /orgs
router.get('/orgs', async (req, res) => {
  try {
    const orgs = await prisma.org.findMany();
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST /orgs
router.post('/orgs', async (req, res) => {
  const { name, email } = req.body;
  try {
    const org = await prisma.org.create({
      data: {
        name,
        email,
      },
    });
    res.json(org);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

export {router};

