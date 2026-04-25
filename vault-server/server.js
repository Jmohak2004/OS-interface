require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/os-vault';

app.use(cors());
app.use(express.json({ limit: '20mb' }));

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

const imageSchema = new mongoose.Schema({
  vaultId: { type: String, required: true, index: true },
  imageData: { type: String, required: true },
  fileName: { type: String, default: 'image' },
  mimeType: { type: String, default: 'image/jpeg' },
  uploadedAt: { type: Date, default: Date.now }
});

const VaultImage = mongoose.model('VaultImage', imageSchema);

// 10 MB per image
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

// Get all images for a vault
app.post('/api/vault/images', async (req, res) => {
  const { vaultId } = req.body;
  if (!vaultId) return res.status(400).json({ error: 'vaultId required' });
  try {
    const images = await VaultImage.find({ vaultId }).sort({ uploadedAt: -1 }).select('-__v');
    res.json(images.map(img => ({
      id: img._id,
      fileName: img.fileName,
      imageData: img.imageData,
      uploadedAt: img.uploadedAt
    })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload an image to a vault
app.post('/api/vault/upload', upload.single('image'), async (req, res) => {
  const { vaultId } = req.body;
  if (!vaultId) return res.status(400).json({ error: 'vaultId required' });
  if (!req.file) return res.status(400).json({ error: 'No image provided' });
  try {
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const img = new VaultImage({
      vaultId,
      imageData: base64,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype
    });
    await img.save();
    res.json({ success: true, id: img._id, fileName: img.fileName, imageData: img.imageData, uploadedAt: img.uploadedAt });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Delete an image from a vault
app.delete('/api/vault/images/:id', async (req, res) => {
  const { vaultId } = req.body;
  if (!vaultId) return res.status(400).json({ error: 'vaultId required' });
  try {
    const result = await VaultImage.deleteOne({ _id: req.params.id, vaultId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Image not found or wrong vault' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.listen(PORT, () => console.log(`Vault server running on http://localhost:${PORT}`));
