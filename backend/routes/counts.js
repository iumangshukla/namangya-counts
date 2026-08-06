const express = require('express');
const router = express.Router();
const Pageview = require('../models/Pageview');

// @desc    Get counts and stats for a specific site
// @route   GET /api/counts/:siteKey
router.get('/:siteKey', async (req, res) => {
  try {
    const { siteKey } = req.params;
    const { days = 30 } = req.query;
    const parsedDays = parseInt(days);

    const now = new Date();
    const currentPeriodStart = new Date(now.getTime() - parsedDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - parsedDays * 24 * 60 * 60 * 1000);

    // Fetch data for the current period
    const currentMatch = { siteKey, timestamp: { $gte: currentPeriodStart, $lte: now } };
    
    // Total Views
    const totalViews = await Pageview.countDocuments(currentMatch);
    
    // Unique Visitors, Sessions, and Bounces via Aggregation
    const visitorStats = await Pageview.aggregate([
      { $match: currentMatch },
      { $group: { _id: "$visitorHash", views: { $sum: 1 } } }
    ]);
    
    const uniqueVisitors = visitorStats.length;
    const bounces = visitorStats.filter(v => v.views === 1).length;
    const bounceRate = uniqueVisitors > 0 ? Math.round((bounces / uniqueVisitors) * 100) : 0;
    const pagesPerSession = uniqueVisitors > 0 ? (totalViews / uniqueVisitors).toFixed(1) : 0;

    // Average Duration
    const durationAggr = await Pageview.aggregate([
      { $match: currentMatch },
      { $group: { _id: null, avgDuration: { $avg: "$duration" } } }
    ]);
    const avgDuration = durationAggr.length > 0 ? Math.round(durationAggr[0].avgDuration) : 0;

    // PREVIOUS PERIOD COMPARISONS
    const prevMatch = { siteKey, timestamp: { $gte: previousPeriodStart, $lt: currentPeriodStart } };
    const prevTotalViews = await Pageview.countDocuments(prevMatch);
    const prevVisitorStats = await Pageview.aggregate([
      { $match: prevMatch },
      { $group: { _id: "$visitorHash", views: { $sum: 1 } } }
    ]);
    const prevUniqueVisitors = prevVisitorStats.length;
    const prevBounces = prevVisitorStats.filter(v => v.views === 1).length;
    const prevBounceRate = prevUniqueVisitors > 0 ? Math.round((prevBounces / prevUniqueVisitors) * 100) : 0;
    
    const prevDurationAggr = await Pageview.aggregate([
      { $match: prevMatch },
      { $group: { _id: null, avgDuration: { $avg: "$duration" } } }
    ]);
    const prevAvgDuration = prevDurationAggr.length > 0 ? Math.round(prevDurationAggr[0].avgDuration) : 0;



    // Lists (Top Pages, Referrers, Devices, Countries, Browsers)
    const getTopList = async (groupField) => {
      return Pageview.aggregate([
        { $match: { ...currentMatch, [groupField]: { $ne: '' }, [groupField]: { $ne: null } } },
        { $group: { _id: `$${groupField}`, views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: 10 }
      ]);
    };

    const topPages = await getTopList('path');
    const topReferrers = await getTopList('referrer');
    const devices = await getTopList('device');
    const countries = await getTopList('country');
    const browsers = await getTopList('browser');

    // Time Series (Group by Date and Visitor first)
    const dailyStats = await Pageview.aggregate([
      { $match: currentMatch },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            visitor: "$visitorHash"
          },
          views: { $sum: 1 },
          duration: { $avg: "$duration" }
        }
      },
      {
        $group: {
          _id: "$_id.date",
          views: { $sum: "$views" },
          visitors: { $sum: 1 },
          bounces: { $sum: { $cond: [{ $eq: ["$views", 1] }, 1, 0] } },
          avgDuration: { $avg: "$duration" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format timeseries for frontend
    const timeSeries = dailyStats.map(d => ({
      _id: d._id,
      views: d.views,
      visitors: d.visitors,
      sessions: d.visitors, // 1 session = 1 unique visitor per day
      bounceRate: d.visitors > 0 ? Math.round((d.bounces / d.visitors) * 100) : 0,
      duration: Math.round(d.avgDuration || 0)
    }));

    // Calculate Totals from the daily stats for consistency
    const totalSessions = timeSeries.reduce((acc, curr) => acc + curr.sessions, 0);

    // PREVIOUS PERIOD Time Series for trend comparison (Sessions)
    const prevDailyStats = await Pageview.aggregate([
      { $match: prevMatch },
      { $group: { _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, visitor: "$visitorHash" } } },
      { $group: { _id: "$_id.date", visitors: { $sum: 1 } } }
    ]);
    const prevTotalSessions = prevDailyStats.reduce((acc, curr) => acc + curr.visitors, 0);

    // Calculate percentage changes
    const calcChange = (curr, prev) => {
      if (prev === 0 && curr > 0) return 100;
      if (prev === 0 && curr === 0) return 0;
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    };

    const trends = {
      views: calcChange(totalViews, prevTotalViews),
      visitors: calcChange(uniqueVisitors, prevUniqueVisitors),
      sessions: calcChange(totalSessions, prevTotalSessions),
      bounceRate: prevBounceRate > 0 ? (bounceRate - prevBounceRate) : 0,
      duration: calcChange(avgDuration, prevAvgDuration)
    };

    res.json({
      siteKey,
      current: {
        totalViews,
        uniqueVisitors,
        totalSessions,
        bounceRate,
        pagesPerSession: uniqueVisitors > 0 ? (totalViews / totalSessions).toFixed(1) : 0,
        avgDuration
      },
      trends,
      topPages,
      topReferrers,
      devices,
      countries,
      browsers,
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
