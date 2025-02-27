const express = import("express");
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const { PrismaClient } = import('@prisma/client');
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Now we can use __dirname as in CommonJS modules.
// const dataFilePath = path.join(__dirname, '..', 'data', 'data.json');

const app = express();
app.use(express.json());

// connect to the "src/routers" directory
const routesPath = path.join(__dirname, "routes");

// read all files in the "/src/routes" directory
fs.readdirSync(routesPath).forEach(async (file) => {

  if (file.endsWith(".js")) {
    console.log(`Importing file ${file}`)

    // dynamically import the router module
    const routerModule = await import(path.join(routesPath, file));

    // get the "router" object exported by the router module
    const router = routerModule.router;

    // register the router
    app.use(router);
  }
});



// const agenciessRouter = import('./routes/agencies');
// app.use('/agencies', agenciessRouter);

// const agenciesonorgsRouter = import('./routes/agenciesonorgs');
// app.use('/agenciesonorgs', agenciesonorgsRouter);

// const audiosRouter = import('./routes/audios');
// app.use('/audios', audiosRouter);

// const audiofilesRouter = import('./routes/audiofiles');
// app.use('/audiofiles', audiofilesRouter);

// const authRouter = import('./routes/auth');
// app.use('/auth', authRouter);

// const filewatcherRouter = import('./routes/filewatcher');
// app.use('/filewatcher', filewatcherRouter);

// const helpsRouter = import('./routes/helps');
// app.use('/helps', helpsRouter);

// const modelsRouter = import('./routes/models');
// app.use('/models', modelsRouter);

// const modelsonagenciesonorgsRouter = import('./routes/modelsonagenciesonorgs');
// app.use('/modelsonagenciesonorgs', modelsonagenciesonorgsRouter);

// const resultsRouter = import('./routes/results');
// app.use('/results', resultsRouter);

// const s3Router = import('./routes/s3');
// app.use('/s3', s3Router);

// const tokensRouter = import('./routes/tokens');
// app.use('/tokens', tokensRouter);

// const uploadsRouter = import('./routes/uploads');
// app.use('/uploads', uploadsRouter);

// const usersonagenciesRouter = import('./routes/usersonagencies');
// app.use('/usersonagencies', usersonagenciesRouter);

// const usersonorgsRouter = import('./routes/usersonorgs');
// app.use('/usersonorgs', usersonorgsRouter);

// const usersRouter = import('./routes/users');
// app.use('/users', usersRouter);

// const orgsRouter = import('./routes/orgs');
// app.use('/orgs', orgsRouter);

const PORT = process.env.PORT || 3999;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
