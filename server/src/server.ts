process.on('uncaughtException', (err) => {
  console.error('Uncaught:', JSON.stringify(err, null, 2));
  process.exit(1);
});

import app from './app.js';

const PORT = process.env.PORT || 5050;

app.get("/", (req, res) => {
  res.send("Backend running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});