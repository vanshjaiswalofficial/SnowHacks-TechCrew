const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const DB_FILE = path.join(__dirname, 'ews.sqlite');
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ews_dev_secret';

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));

// init sqlite with clearer error handling
console.log('Using DB file:', DB_FILE);
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Failed to open sqlite database:', err.message || err);
    process.exit(1);
  }
  console.log('SQLite DB opened. Initializing schema...');
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password_hash TEXT,
      role TEXT
    )`, (err2) => { if (err2) console.error('Error creating users table:', err2); });

    // insert sample users if none exist
    db.get(`SELECT COUNT(1) as cnt FROM users`, (err3, row) => {
      if (err3) { console.error('Count users error:', err3); return; }
      if (row && row.cnt === 0) {
        try {
          const salt = bcrypt.genSaltSync(8);
          const adminHash = bcrypt.hashSync('admin123', salt);
          const devHash = bcrypt.hashSync('amit123', salt);
          db.run("INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)", ['Administrator','admin@example.com',adminHash,'Admin']);
          db.run("INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)", ['Amit Sharma','amit@example.com',devHash,'Employee']);
          console.log('Inserted sample users: admin@example.com / amit@example.com');
        } catch (e) { console.error('Error inserting sample users', e); }
      }
    });
  });
});

// POST /api/login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  db.get('SELECT id,name,email,password_hash,role FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });
});

// health check
app.get('/api/health', (req,res)=> res.json({ ok: true, ts: new Date().toISOString() }));

// DEBUG: list users (development only)
app.get('/api/debug/users', (req,res)=>{
  db.all('SELECT id,name,email,role FROM users ORDER BY id LIMIT 200', (err, rows)=>{
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ users: rows });
  });
});

// Protected helper
function authenticate(req, res, next){
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Unauthorized' });
  try{
    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.user = payload; next();
  }catch(e){ return res.status(401).json({ error: 'Invalid token' }); }
}

app.get('/api/profile', authenticate, (req,res)=>{
  res.json({ user: req.user });
});

app.listen(PORT, ()=>{
  console.log(`EWS auth server listening on http://localhost:${PORT}`);
});
