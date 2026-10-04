const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

// Enable standard middleware (logger, static, cors, no-cache)
server.use(middlewares);
server.use(jsonServer.bodyParser);

// Custom endpoint for active user session if needed
server.get('/api/v1/profile', (req, res) => {
  const db = router.db;
  const user = db.get('users').first().value();
  res.status(200).json(user);
});

// Mount router under /api/v1 and root
server.use('/api/v1', router);
server.use(router);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(` JouleTracker Fake API Server is running at http://localhost:${PORT}`);
  console.log(`======================================================`);
  console.log(` Available endpoints:`);
  console.log(`   GET http://localhost:${PORT}/api/v1/consumption-summaries`);
  console.log(`   GET http://localhost:${PORT}/api/v1/energy-readings`);
  console.log(`   GET http://localhost:${PORT}/api/v1/device-distributions`);
  console.log(`   GET http://localhost:${PORT}/api/v1/comparative-consumptions`);
  console.log(`   GET http://localhost:${PORT}/api/v1/consumption-histories`);
  console.log(`   GET http://localhost:${PORT}/api/v1/alerts`);
  console.log(`   GET http://localhost:${PORT}/api/v1/recommendations`);
  console.log(`   GET http://localhost:${PORT}/api/v1/users`);
  console.log(`======================================================\n`);
});
