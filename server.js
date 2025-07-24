const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nunjucks = require('nunjucks');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'njk');

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

const uid = () => {
  const hex = Math.floor(new Date() / 1000).toString(16);
  const map = {
    '0': 'A', '1': 'B', '2': 'C', '3': 'D',
    '4': 'E', '5': 'F', '6': 'G', '7': 'H',
    '8': 'I', '9': 'J'
  };
  return [...hex].map(c => map[c] || c).join('');
};

const generateName = (filename) => {
  const ext = path.extname(filename);
  const basename = path.basename(filename, ext);

  return `${basename}_${uid()}${ext}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, generateName(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }
});

app.get('/', (req, res) => {
  res.render('pages/index');
});

app.get('/rules', (req, res) => {
  res.render('pages/rules');
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const logMessage = `[${new Date().toISOString()}] ${ip} uploaded "${req.file.filename}"\n`;
  console.log(logMessage);
  fs.appendFile('uploads.log', logMessage, err => {
    if (err) console.error('Error writing to log file:', err);
  });
  let fileUrl = `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(req.file.filename)}`;
  if (path.extname(req.file.filename).toLowerCase() === '.mp4') {
    fileUrl += '?v';
  }
  res.json({ url: fileUrl });
});

app.use('/assets', express.static('static'));
app.use('/uploads', express.static('uploads'));

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File exceeds 5 GB limit.' });
  }
  next(err);
});

if (!fs.existsSync('uploads/')) {
  fs.mkdirSync('uploads/');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`running on http://localhost:${PORT}`));
