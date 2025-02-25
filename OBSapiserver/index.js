const express = import("express");
const { PrismaClient } = import("@prisma/client");
const apiRouter = import("./routes");

const app = express();
const prisma = new PrismaClient();
const PORT = process.send.PORT || 3999;

app.use(express.json());
app.use('/api', usersRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
});
