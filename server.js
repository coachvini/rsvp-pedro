const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');

const PORT = process.env.PORT || 3000;
const CONFIG_PATH = path.join(__dirname, 'config.json');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'responses.json');

let config = {};
try {
  config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
} catch {
  console.error('config.json nao encontrado. Copie config.example.json para config.json');
  process.exit(1);
}

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]');
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const sessions = new Map();
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function readResponses() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeResponses(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const entry = sessions.get(token);
  if (!entry || Date.now() > entry.expiresAt) {
    if (entry) sessions.delete(token);
    return res.status(401).json({ error: 'Nao autenticado' });
  }
  req.token = token;
  next();
}

app.get('/api/config', (req, res) => {
  res.json(config.party);
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (password && password === config.admin.password) {
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, { expiresAt: Date.now() + SESSION_TTL_MS });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Senha incorreta' });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  sessions.delete(req.token);
  res.json({ ok: true });
});

app.get('/api/responses', requireAdmin, (req, res) => {
  res.json(readResponses());
});

app.delete('/api/responses/:id', requireAdmin, (req, res) => {
  const list = readResponses();
  const filtered = list.filter((r) => r.id !== req.params.id);
  if (filtered.length === list.length) {
    return res.status(404).json({ error: 'Registro nao encontrado' });
  }
  writeResponses(filtered);
  res.json({ ok: true });
});

app.post('/api/rsvp', (req, res) => {
  const { firstName, lastName, email, phone } = req.body || {};
  const cleanName = (v) => (v || '').trim();
  const cleanEmail = (v) => (v || '').trim().toLowerCase();
  const cleanPhone = (v) => (v || '').replace(/\D/g, '');

  const first = cleanName(firstName);
  const last = cleanName(lastName);
  const mail = cleanEmail(email);
  const tel = cleanPhone(phone);

  const errors = [];
  if (!first) errors.push('nome');
  if (!last) errors.push('sobrenome');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) errors.push('email');
  if (tel.length < 10 || tel.length > 11) errors.push('celular');

  if (errors.length) {
    return res.status(400).json({ error: `Campo(s) invalido(s): ${errors.join(', ')}` });
  }

  const list = readResponses();
  const entry = {
    id: crypto.randomUUID(),
    firstName: first,
    lastName: last,
    email: mail,
    phone: tel,
    createdAt: new Date().toISOString()
  };

  const existing = list.find(
    (r) => r.email === mail && r.firstName.toLowerCase() === first.toLowerCase()
  );
  if (existing) {
    existing.lastName = last;
    existing.phone = tel;
    existing.createdAt = entry.createdAt;
    writeResponses(list);
    return res.json({ ok: true, updated: true });
  }

  list.push(entry);
  writeResponses(list);
  res.json({ ok: true, updated: false });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Painel admin: http://localhost:${PORT}/admin.html`);
});
