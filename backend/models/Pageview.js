const mongoose = require('mongoose');

const PageviewSchema = new mongoose.Schema({
  siteKey: {
    type: String,
    required: true,
    index: true
  },
  path: {
    type: String,
    default: '/'
  },
  visitorHash: {
    type: String,
    required: true,
    index: true
  },
  isNewVisitor: {
    type: Boolean,
    default: true
  },
  referrer: {
    type: String,
    default: ''
  },
  device: {
    type: String,
    enum: ['desktop', 'tablet', 'mobile', 'unknown'],
    default: 'unknown'
  },
  browser: {
    type: String,
    default: 'unknown'
  },
  country: {
    type: String,
    default: 'unknown'
  },
  duration: {
    type: Number,
    default: 0 // in seconds
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index to quickly find stats for a specific site on a specific day
PageviewSchema.index({ siteKey: 1, timestamp: -1 });

module.exports = mongoose.model('Pageview', PageviewSchema);
