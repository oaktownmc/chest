const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mime = require('mime');
const app = express();

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

app.use(express.static('public'));

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const logMessage = `[${new Date().toISOString()}] ${ip} uploaded "${req.file.filename}"\n`;
  console.log(logMessage);
  fs.appendFile(path.join(__dirname, 'uploads.log'), logMessage, err => {
    if (err) console.error('Error writing to log file:', err);
  });
  let fileUrl = `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(req.file.filename)}`;
  if (path.extname(req.file.filename).toLowerCase() === '.mp4') {
    fileUrl += '?v';
  }
  res.json({ url: fileUrl });
});


app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', decodeURIComponent(req.path));
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      return res.status(404).send('File not found.');
    }
    const type = mime.getType(filePath) || 'application/octet-stream';
    res.setHeader('Content-Type', type);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Accept-Ranges', 'bytes');
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

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
