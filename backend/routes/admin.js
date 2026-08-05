const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Site = require('../models/Site');
const Pageview = require('../models/Pageview');

// Middleware to ensure user is an admin
const ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ error: 'Access denied: Admins only' });
};

// Apply middleware to all admin routes
router.use(ensureAdmin);

// @desc    Get global stats
// @route   GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSites = await Site.countDocuments();
    const totalPageviews = await Pageview.countDocuments();

    res.json({
      totalUsers,
      totalSites,
      totalPageviews
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @desc    Get all users with their site counts
// @route   GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'sites', // MongoDB collection name for Site model is typically pluralized lowercase
          localField: '_id',
          foreignField: 'userId',
          as: 'sites'
        }
      },
      {
        $project: {
          githubId: 1,
          username: 1,
          displayName: 1,
          avatarUrl: 1,
          createdAt: 1,
          isAdmin: 1,
          siteCount: { $size: '$sites' }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);
    
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @desc    Get all sites
// @route   GET /api/admin/sites
router.get('/sites', async (req, res) => {
  try {
    const sites = await Site.find().populate('userId', 'username displayName').sort({ createdAt: -1 });
    res.json(sites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @desc    Delete a user and all their data
// @route   DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    // Don't allow admin to delete themselves to prevent locking out
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: "Cannot delete your own admin account." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Find all sites owned by this user to delete their pageviews
    const userSites = await Site.find({ userId });
    for (const site of userSites) {
      await Pageview.deleteMany({ siteKey: site.siteKey });
    }

    // Delete the sites
    await Site.deleteMany({ userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ success: true, message: 'User and associated data deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @desc    Delete a site and its pageviews
// @route   DELETE /api/admin/sites/:id
router.delete('/sites/:id', async (req, res) => {
  try {
    const siteId = req.params.id;
    const site = await Site.findById(siteId);
    
    if (!site) return res.status(404).json({ error: 'Site not found' });

    // Delete pageviews
    await Pageview.deleteMany({ siteKey: site.siteKey });
    
    // Delete site
    await Site.findByIdAndDelete(siteId);

    res.json({ success: true, message: 'Site and associated data deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
