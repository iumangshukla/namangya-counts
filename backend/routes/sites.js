const express = require('express');
const router = express.Router();
const Site = require('../models/Site');
const Pageview = require('../models/Pageview');

// Middleware to check if user is logged in
const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// @desc    Get all sites for the logged-in user
// @route   GET /api/sites
router.get('/', ensureAuth, async (req, res) => {
  try {
    const sites = await Site.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(sites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @desc    Create a new site
// @route   POST /api/sites
router.post('/', ensureAuth, async (req, res) => {
  try {
    const { name, allowedDomains } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Site name is required' });
    }

    const newSite = new Site({
      userId: req.user._id,
      name,
      allowedDomains: allowedDomains || []
    });

    await newSite.save();
    res.status(201).json(newSite);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @desc    Delete a site
// @route   DELETE /api/sites/:id
router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    const site = await Site.findById(req.params.id);
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    // Ensure the site belongs to the user
    if (site.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Site.deleteOne({ _id: req.params.id });
    
    // Optionally: delete all related pageviews (could be slow, maybe do it asynchronously or leave it)
    Pageview.deleteMany({ siteKey: site.siteKey }).exec().catch(err => console.error(err));

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
