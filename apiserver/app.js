const express = import("express");
const { PrismaClient } = import('@prisma/client');
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3999;

app.use(express.json());

const agenciessRouter = import('./routes/agencies');
app.use('/agencies', agenciessRouter);

const agenciesonorgsRouter = import('./routes/agenciesonorgs');
app.use('/agenciesonorgs', agenciesonorgsRouter);

const audiosRouter = import('./routes/audios');
app.use('/audios', audiosRouter);

const audiofilesRouter = import('./routes/audiofiles');
app.use('/audiofiles', audiofilesRouter);

const authRouter = import('./routes/auth');
app.use('/auth', authRouter);

const filewatcherRouter = import('./routes/filewatcher');
app.use('/filewatcher', filewatcherRouter);

const helpsRouter = import('./routes/helps');
app.use('/helps', helpsRouter);

const modelsRouter = import('./routes/models');
app.use('/models', modelsRouter);

const modelsonagenciesonorgsRouter = import('./routes/modelsonagenciesonorgs');
app.use('/modelsonagenciesonorgs', modelsonagenciesonorgsRouter);

const resultsRouter = import('./routes/results');
app.use('/results', resultsRouter);

const s3Router = import('./routes/s3');
app.use('/s3', s3Router);

const tokensRouter = import('./routes/tokens');
app.use('/tokens', tokensRouter);

const uploadsRouter = import('./routes/uploads');
app.use('/uploads', uploadsRouter);

const usersonagenciesRouter = import('./routes/usersonagencies');
app.use('/usersonagencies', usersonagenciesRouter);

const usersonorgsRouter = import('./routes/usersonorgs');
app.use('/usersonorgs', usersonorgsRouter);

const usersRouter = import('./routes/users');
app.use('/users', usersRouter);

const orgsRouter = import('./routes/orgs');
app.use('/orgs', orgsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
