const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const crypto  = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'benekeup2026';

app.use(express.json());
app.use(express.static(__dirname));

// Routes HTML explicites
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/',      (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ── Dossiers ────────────────────────────────────────────────────────────────
const DATA_DIR    = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
[DATA_DIR, UPLOADS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

const FILES = {
  services : path.join(DATA_DIR, 'services.json'),
  gallery  : path.join(DATA_DIR, 'gallery.json'),
  reviews  : path.join(DATA_DIR, 'reviews.json'),
  tokens   : path.join(DATA_DIR, 'tokens.json'),
};

function read(file, def = []) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return def; }
}
function write(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Initialise les fichiers JSON s'ils n'existent pas
if (!fs.existsSync(FILES.services)) write(FILES.services, require('./data/services-default.json'));
if (!fs.existsSync(FILES.gallery))  write(FILES.gallery,  require('./data/gallery-default.json'));
if (!fs.existsSync(FILES.reviews))  write(FILES.reviews,  require('./data/reviews-default.json'));

// ── Upload Multer ─────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

// ── Auth ─────────────────────────────────────────────────────────────────
const activeTokens = new Set(read(FILES.tokens, []));

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!activeTokens.has(token)) return res.status(401).json({ error: 'Non autorisé' });
  next();
}

app.post('/api/auth/login', (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  const token = crypto.randomBytes(32).toString('hex');
  activeTokens.add(token);
  write(FILES.tokens, [...activeTokens]);
  res.json({ token });
});

app.post('/api/auth/logout', auth, (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  activeTokens.delete(token);
  write(FILES.tokens, [...activeTokens]);
  res.json({ ok: true });
});

// ── Services ──────────────────────────────────────────────────────────────
app.get('/api/services', (_, res) => res.json(read(FILES.services)));

app.post('/api/services', auth, (req, res) => {
  const list = read(FILES.services);
  const item = { id: Date.now().toString(), ...req.body };
  list.push(item);
  write(FILES.services, list);
  res.json(item);
});

app.put('/api/services/:id', auth, (req, res) => {
  const list = read(FILES.services);
  const i = list.findIndex(s => s.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Introuvable' });
  list[i] = { ...list[i], ...req.body };
  write(FILES.services, list);
  res.json(list[i]);
});

app.delete('/api/services/:id', auth, (req, res) => {
  write(FILES.services, read(FILES.services).filter(s => s.id !== req.params.id));
  res.json({ ok: true });
});

// ── Galerie ───────────────────────────────────────────────────────────────
app.get('/api/gallery', (_, res) => res.json(read(FILES.gallery)));

app.post('/api/gallery', auth, upload.single('image'), (req, res) => {
  const list = read(FILES.gallery);
  const item = {
    id: Date.now().toString(),
    filename: req.file ? `/uploads/${req.file.filename}` : (req.body.filename || ''),
    label_fr: req.body.label_fr || '',
    label_en: req.body.label_en || '',
  };
  list.push(item);
  write(FILES.gallery, list);
  res.json(item);
});

app.delete('/api/gallery/:id', auth, (req, res) => {
  const list  = read(FILES.gallery);
  const item  = list.find(g => g.id === req.params.id);
  if (item?.filename?.startsWith('/uploads/')) {
    try { fs.unlinkSync(path.join(__dirname, item.filename)); } catch {}
  }
  write(FILES.gallery, list.filter(g => g.id !== req.params.id));
  res.json({ ok: true });
});

// ── Avis ─────────────────────────────────────────────────────────────────
app.get('/api/reviews', (_, res) =>
  res.json(read(FILES.reviews).filter(r => r.approved)));

app.post('/api/reviews', (req, res) => {
  const list = read(FILES.reviews);
  const item = {
    id:       Date.now().toString(),
    name:     (req.body.name     || '').slice(0, 60),
    location: (req.body.location || '').slice(0, 80),
    text:     (req.body.text     || '').slice(0, 500),
    rating:   Math.min(5, Math.max(1, parseInt(req.body.rating) || 5)),
    approved: false,
    date:     new Date().toISOString().split('T')[0],
  };
  list.push(item);
  write(FILES.reviews, list);
  res.json({ ok: true });
});

app.get('/api/admin/reviews', auth, (_, res) => res.json(read(FILES.reviews)));

app.put('/api/reviews/:id/approve', auth, (req, res) => {
  const list = read(FILES.reviews);
  const i    = list.findIndex(r => r.id === req.params.id);
  if (i < 0) return res.status(404).json({ error: 'Introuvable' });
  list[i].approved = !list[i].approved;
  write(FILES.reviews, list);
  res.json(list[i]);
});

app.delete('/api/reviews/:id', auth, (req, res) => {
  write(FILES.reviews, read(FILES.reviews).filter(r => r.id !== req.params.id));
  res.json({ ok: true });
});

app.use('/uploads', express.static(UPLOADS_DIR));

app.listen(PORT, () => console.log(`Benekeup running on :${PORT}`));
