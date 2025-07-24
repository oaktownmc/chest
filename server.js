const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const app = express();

const generateName = () => {
  const hex = Math.floor(new Date() / 1000).toString(16);
  const map = {
    '0': 'A', '1': 'B', '2': 'C', '3': 'D',
    '4': 'E', '5': 'F', '6': 'G', '7': 'H',
    '8': 'I', '9': 'J'
  };
  return [...hex].map(c => map[c] || c).join('');
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const parts = file.originalname.split('.');

    if (parts.length < 2) {
      return cb(null, file.originalname + generateName());
    }

    const first = parts.shift();
    const rest = parts.join('.');
    const name = `${first}_${generateName()}.${rest}`;
    cb(null, name);
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
  console.log(`[${ip}] uploaded [${req.file.filename}]`);
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
