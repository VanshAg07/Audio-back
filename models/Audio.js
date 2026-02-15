const mongoose = require('mongoose');

const audioSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    originalname: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number },
    mimetype: { type: String },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Audio', audioSchema);
