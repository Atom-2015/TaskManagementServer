const cluster = require('cluster');
const os = require('os');
const express = require('express');
// const jwt = require('jsonwebtoken');
const db = require('./config/mongoose');
// const helmet = require('helmet');
const cors = require('cors');

const numCPUs = os.cpus().length; // Get the number of CPU cores

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);
  console.log('cpu number' , numCPUs);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Listen for worker exits and restart them if needed
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else { 
  const app = express();
  const PORT = process.env.PORT || 9001;

  // Middleware
  app.use(express.json({ limit: '20mb' }));
  app.use(cors({ origin: '*' }));

  // Routes
  app.use('/api', require('./Route/index'));

  // Server setup
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Worker ${process.pid} running at http://localhost:${PORT}`);
  });
}
