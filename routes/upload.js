const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Audio = require('../models/Audio');
const auth = require('../middleware/auth');
const router = express.Router();


// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = file.mimetype === 'audio/wav' ? '.wav' : '.webm';
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
});

const upload = multer({ storage: storage });

router.post('/upload-audio', auth, upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No audio file uploaded' });
    }

    try {
        console.log(`Received audio file: ${req.file.filename}, Size: ${req.file.size} bytes`);

        // Construct the URL to the stored file
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        // Save metadata to database
        const audio = new Audio({
            userId: req.userId,
            filename: req.file.filename,
            originalname: req.file.originalname,
            url: fileUrl,
            size: req.file.size,
            mimetype: req.file.mimetype,
        });

        await audio.save();

        res.json({
            message: 'Audio received and processed successfully',
            audioUrl: fileUrl,
            filename: req.file.filename,
            size: req.file.size,
            audioId: audio._id,
        });
    } catch (err) {
        console.error('Error saving audio metadata:', err);
        res.status(500).json({ message: 'Error processing audio upload' });
    }
});

router.get('/my-audio', auth, async (req, res) => {
    try {
        const audios = await Audio.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(audios);
    } catch (err) {
        console.error('Error fetching audios:', err);
        res.status(500).json({ message: 'Error fetching recordings' });
    }
});

router.delete('/my-audio/:id', auth, async (req, res) => {
    try {
        const audio = await Audio.findOne({ _id: req.params.id, userId: req.userId });

        if (!audio) {
            return res.status(404).json({ message: 'Audio not found' });
        }

        // Delete file from filesystem
        const filePath = path.join(__dirname, '..', 'uploads', audio.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await Audio.deleteOne({ _id: req.params.id });

        res.json({ message: 'Audio deleted successfully' });
    } catch (err) {
        console.error('Error deleting audio:', err);
        res.status(500).json({ message: 'Error deleting audio' });
    }
});

module.exports = router;
