const express = import('express');
const router = express.Router();
const { PrismaClient } = import('@prisma/client');
const prisma = new PrismaClient();

// GET /modelsonagenciesonorgss
router.get('/modelsonagenciesonorgss', async (req, res) => {
  try {
    const modelsonagenciesonorgss = await prisma.modelsonagenciesonorgs.findMany();
    res.json(modelsonagenciesonorgss);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// POST /modelsonagenciesonorgss
router.post('/modelsonagenciesonorgss', async (req, res) => {
  const { name, email } = req.body;
  try {
    const modelsonagenciesonorgs = await prisma.modelsonagenciesonorgs.create({
      data: {
        name,
        email,
      },
    });
    res.json(modelsonagenciesonorgs);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

export {router};

