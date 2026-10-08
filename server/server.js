const jsonServer = require('json-server');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

// Enable standard middleware (logger, static, cors, no-cache)
server.use(middlewares);
server.use(jsonServer.bodyParser);

// ── Auth Endpoints ──────────────────────────────────────────────

/**
 * POST /api/v1/auth/login
 * Validates credentials and returns user + token.
 */
server.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son requeridos.' });
  }

  const db = router.db;
  const user = db.get('users').find({ email: email.toLowerCase().trim() }).value();

  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
  }

  if (user.password !== password) {
    return res.status(401).json({ message: 'Credenciales inválidas. Verifica tu correo y contraseña.' });
  }

  if (!user.verified) {
    return res.status(403).json({ message: 'Tu cuenta no ha sido verificada. Revisa tu correo.' });
  }

  const { password: _, verificationCode: __, ...userWithoutPassword } = user;

  res.status(200).json({
    user: userWithoutPassword,
    token: `fake-jwt-token-${user.id}-${Date.now()}`
  });
});

/**
 * POST /api/v1/auth/register
 * Creates a new pending registration and returns a verification code.
 */
server.post('/api/v1/auth/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  const db = router.db;

  // Check if user already exists
  const existingUser = db.get('users').find({ email: email.toLowerCase().trim() }).value();
  if (existingUser) {
    return res.status(409).json({ message: 'Ya existe una cuenta con este correo electrónico.' });
  }

  // Check pending registrations
  const existingPending = db.get('pending-registrations').find({ email: email.toLowerCase().trim() }).value();
  if (existingPending) {
    return res.status(409).json({ message: 'Ya existe un registro pendiente con este correo.' });
  }

  // Generate a 6-digit verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Store pending registration
  const pending = {
    id: Date.now(),
    name,
    email: email.toLowerCase().trim(),
    password,
    verificationCode,
    createdAt: new Date().toISOString()
  };

  db.get('pending-registrations').push(pending).write();

  // In a real app, the code would be sent via email. For demo, we log it.
  console.log(`\n📧 Verification code for ${email}: ${verificationCode}\n`);

  res.status(201).json({
    message: 'Registro creado. Verifica tu correo.',
    email: pending.email,
    // For demo purposes only - in production this would NOT be returned
    _demoCode: verificationCode
  });
});

/**
 * POST /api/v1/auth/verify-email
 * Verifies the email with the 6-digit code and creates the user.
 */
server.post('/api/v1/auth/verify-email', (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Correo y código son requeridos.' });
  }

  const db = router.db;
  const pending = db.get('pending-registrations')
    .find({ email: email.toLowerCase().trim(), verificationCode: code })
    .value();

  if (!pending) {
    return res.status(400).json({ message: 'Código inválido. Verifica e inténtalo de nuevo.' });
  }

  // Check if user already exists (edge case)
  const existingUser = db.get('users').find({ email: pending.email }).value();
  if (existingUser) {
    // Clean up pending and return existing user
    db.get('pending-registrations').remove({ id: pending.id }).write();
    const { password: _, verificationCode: __, ...userWithoutPassword } = existingUser;
    return res.status(200).json({
      user: userWithoutPassword,
      token: `fake-jwt-token-${existingUser.id}-${Date.now()}`
    });
  }

  // Create the verified user
  const newUser = {
    id: Date.now(),
    name: pending.name,
    email: pending.email,
    password: pending.password,
    role: 'homeowner',
    verified: true,
    verificationCode: null
  };

  db.get('users').push(newUser).write();

  // Remove the pending registration
  db.get('pending-registrations').remove({ id: pending.id }).write();

  const { password: _, verificationCode: __, ...userWithoutPassword } = newUser;

  res.status(200).json({
    user: userWithoutPassword,
    token: `fake-jwt-token-${newUser.id}-${Date.now()}`
  });
});

/**
 * POST /api/v1/auth/resend-code
 * Resends the verification code for a pending registration.
 */
server.post('/api/v1/auth/resend-code', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Correo es requerido.' });
  }

  const db = router.db;
  const pending = db.get('pending-registrations')
    .find({ email: email.toLowerCase().trim() })
    .value();

  if (!pending) {
    return res.status(404).json({ message: 'No hay un registro pendiente para este correo.' });
  }

  // Generate a new code
  const newCode = Math.floor(100000 + Math.random() * 900000).toString();
  db.get('pending-registrations')
    .find({ id: pending.id })
    .assign({ verificationCode: newCode, createdAt: new Date().toISOString() })
    .write();

  console.log(`\n📧 New verification code for ${email}: ${newCode}\n`);

  res.status(200).json({
    message: 'Código reenviado. Revisa tu correo.',
    _demoCode: newCode
  });
});

/**
 * POST /api/v1/auth/forgot-password
 * Sends a password recovery link (simulated).
 */
server.post('/api/v1/auth/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Correo es requerido.' });
  }

  const db = router.db;
  const user = db.get('users').find({ email: email.toLowerCase().trim() }).value();

  // Always return success to prevent email enumeration
  if (!user) {
    return res.status(200).json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' });
  }

  console.log(`\n🔑 Password reset requested for ${email}\n`);

  res.status(200).json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' });
});

// ── Existing custom endpoint ────────────────────────────────────

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
  console.log(`   GET  http://localhost:${PORT}/api/v1/consumption-summaries`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/energy-readings`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/device-distributions`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/comparative-consumptions`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/consumption-histories`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/alerts`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/recommendations`);
  console.log(`   GET  http://localhost:${PORT}/api/v1/users`);
  console.log(`   POST http://localhost:${PORT}/api/v1/auth/login`);
  console.log(`   POST http://localhost:${PORT}/api/v1/auth/register`);
  console.log(`   POST http://localhost:${PORT}/api/v1/auth/verify-email`);
  console.log(`   POST http://localhost:${PORT}/api/v1/auth/resend-code`);
  console.log(`   POST http://localhost:${PORT}/api/v1/auth/forgot-password`);
  console.log(`======================================================`);
  console.log(` Demo credentials:`);
  console.log(`   Email: alex.rivera@gmail.com  Password: 123456`);
  console.log(`   Email: demo@jouletracker.com  Password: demo123`);
  console.log(`======================================================\n`);
});
