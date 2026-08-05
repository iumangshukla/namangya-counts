const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const Pageview = require('../models/Pageview');
const Site = require('../models/Site');

// Helper to get client IP
const getClientIp = (req) => {
  return req.headers['x-forwarded-for'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.ip;
};

// Generate a visitor hash. 
// Uses a monthly rotating salt to balance unique visitor tracking with privacy.
const getVisitorHash = (ip, userAgent, siteKey) => {
  const date = new Date();
  const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`;
  const salt = process.env.SESSION_SECRET || 'secret';
  
  const data = `${ip}-${userAgent}-${siteKey}-${yearMonth}-${salt}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

// @desc    Track a pageview
// @route   POST /api/track/pageview
router.post('/pageview', async (req, res) => {
  try {
    const { siteKey, path, referrer, width } = req.body;

    if (!siteKey) {
      return res.status(400).json({ error: 'siteKey is required' });
    }

    // Optional: Validate if site exists
    // const site = await Site.findOne({ siteKey });
    // if (!site) return res.status(404).json({ error: 'Site not found' });

    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    
    // Parse User Agent
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name || 'unknown';
    
    // Determine device from width or UA
    let device = 'unknown';
    if (width) {
      if (width < 768) device = 'mobile';
      else if (width < 1024) device = 'tablet';
      else device = 'desktop';
    } else {
      const deviceType = parser.getDevice().type;
      if (deviceType === 'mobile') device = 'mobile';
      else if (deviceType === 'tablet') device = 'tablet';
      else device = 'desktop'; // default assumption
    }

    // Get Country from IP
    let country = 'unknown';
    const geo = geoip.lookup(ip);
    if (geo && geo.country) {
      country = geo.country;
    }

    const visitorHash = getVisitorHash(ip, userAgent, siteKey);

    // Check if this visitor has visited this site this month
    const existingVisit = await Pageview.findOne({
      siteKey,
      visitorHash
    });

    const isNewVisitor = !existingVisit;

    const newPageview = new Pageview({
      siteKey,
      path: path || '/',
      visitorHash,
      isNewVisitor,
      referrer: referrer || '',
      device,
      browser,
      country,
      duration: 0
    });

    await newPageview.save();

    // Return the ID so the frontend can send a beacon to update duration
    res.json({ success: true, id: newPageview._id });
  } catch (err) {
    console.error('Tracking Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @desc    Update pageview duration
// @route   POST /api/track/duration
router.post('/duration', async (req, res) => {
  try {
    const { id, duration } = req.body;
    
    if (!id || duration === undefined) {
      return res.status(400).json({ error: 'id and duration required' });
    }

    await Pageview.findByIdAndUpdate(id, { $set: { duration } });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Duration Update Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
