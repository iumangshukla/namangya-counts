const mongoose = require('mongoose');
const crypto = require('crypto');

const SiteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  siteKey: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomUUID()
  },
  allowedDomains: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Site', SiteSchema);
