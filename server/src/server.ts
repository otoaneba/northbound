process.on('uncaughtException', (err) => {
  console.error('Uncaught:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Keep-alive: tsx (or Node) sometimes treats event loop as empty despite Express server
process.on('beforeExit', (code) => {
  if (code === 0) {
    setInterval(() => {}, 1000 * 60 * 60); // prevent exit
  }
});

import app from './app.js';

const PORT = process.env.PORT || 5050;

app.get("/", (req, res) => {
  res.send("Backend running");
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});