const express = require('express');
const router = express.Router();
const Pageview = require('../models/Pageview');

// @desc    Get counts and stats for a specific site
// @route   GET /api/counts/:siteKey
router.get('/:siteKey', async (req, res) => {
  try {
    const { siteKey } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Base query for the given date range
    const matchQuery = {
      siteKey,
      timestamp: { $gte: startDate }
    };

    // 1. Total Views and Unique Visitors
    const totalViews = await Pageview.countDocuments(matchQuery);
    
    // For unique visitors within this period, count documents where isNewVisitor is true
    // Note: this depends on the salt rotation period. If we use a monthly salt,
    // this counts new visitors for the month.
    const uniqueVisitors = await Pageview.countDocuments({
      ...matchQuery,
      isNewVisitor: true
    });

    // 2. Average Duration
    const durationAggr = await Pageview.aggregate([
      { $match: matchQuery },
      { $group: { _id: null, avgDuration: { $avg: "$duration" } } }
    ]);
    const avgDuration = durationAggr.length > 0 ? Math.round(durationAggr[0].avgDuration) : 0;

    // 3. Top Pages
    const topPages = await Pageview.aggregate([
      { $match: matchQuery },
      { $group: { _id: "$path", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 }
    ]);

    // 4. Top Referrers
    const topReferrers = await Pageview.aggregate([
      { $match: { ...matchQuery, referrer: { $ne: '' } } },
      { $group: { _id: "$referrer", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 10 }
    ]);

    // 5. Device Stats
    const devices = await Pageview.aggregate([
      { $match: matchQuery },
      { $group: { _id: "$device", count: { $sum: 1 } } }
    ]);

    // 6. Time Series (Views per day)
    const timeSeries = await Pageview.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          views: { $sum: 1 },
          uniques: { $sum: { $cond: ["$isNewVisitor", 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      siteKey,
      totalViews,
      uniqueVisitors,
      avgDuration,
      topPages,
      topReferrers,
      devices,
      timeSeries
    });
  } catch (err) {
    console.error('Counts Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});

// @desc    Get SVG badge for a specific site
// @route   GET /badge/:siteKey
router.get('/badge/:siteKey', async (req, res) => {
  try {
    const { siteKey } = req.params;
    const totalViews = await Pageview.countDocuments({ siteKey });
    
    // Generate a simple SVG
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="120" height="20">
        <linearGradient id="b" x2="0" y2="100%">
          <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
          <stop offset="1" stop-opacity=".1"/>
        </linearGradient>
        <mask id="a">
          <rect width="120" height="20" rx="3" fill="#fff"/>
        </mask>
        <g mask="url(#a)">
          <path fill="#555" d="M0 0h55v20H0z"/>
          <path fill="#ff7f50" d="M55 0h65v20H55z"/> <!-- Orangish color -->
          <path fill="url(#b)" d="M0 0h120v20H0z"/>
        </g>
        <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,sans-serif" font-size="11">
          <text x="27.5" y="15" fill="#010101" fill-opacity=".3">views</text>
          <text x="27.5" y="14">views</text>
          <text x="86.5" y="15" fill="#010101" fill-opacity=".3">${totalViews}</text>
          <text x="86.5" y="14">${totalViews}</text>
        </g>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
    res.send(svg.trim());
  } catch (err) {
    console.error('Badge Error:', err);
    res.status(500).send('Error');
  }
});

module.exports = router;
