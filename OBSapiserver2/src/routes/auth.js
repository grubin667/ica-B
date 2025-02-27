const express = import('express');
const router = express.Router();
const { PrismaClient } = import('@prisma/client');
const prisma = new PrismaClient();

// GET /auths
router.get('/auths', async (req, res) => {
  try {
    const auths = await prisma.auth.findMany();
    res.json(auths);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST /auths
router.post('/auths', async (req, res) => {
  const { name, email } = req.body;
  try {
    const auth = await prisma.auth.create({
      data: {
        name,
        email,
      },
    });
    res.json(auth);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

export {router};

