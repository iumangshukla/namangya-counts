require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Site = require('./models/Site');
const Pageview = require('./models/Pageview');
const crypto = require('crypto');

const seedDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB Connected. Generating massive mock data...');

  // 1. Get the REAL Admin user so we don't delete them
  const realAdmin = await User.findOne({ githubId: '284030225' }) || 
                    await User.findOne({ username: 'iumangshukla' });

  // Clear existing Sites and Pageviews
  await Site.deleteMany({});
  await Pageview.deleteMany({});
  // Only delete users that are not the real admin
  if (realAdmin) {
    await User.deleteMany({ _id: { $ne: realAdmin._id } });
  } else {
    await User.deleteMany({});
  }

  const adminId = realAdmin ? realAdmin._id : new mongoose.Types.ObjectId();

  // Create 50 fake users
  const fakeUsers = [];
  for (let i = 0; i < 50; i++) {
    fakeUsers.push({
      githubId: `mock_${i}_${Date.now()}`,
      username: `mockuser_${i}`,
      displayName: `Mock User ${i}`,
      avatarUrl: `https://avatars.githubusercontent.com/u/${1000 + i}?v=4`,
      isAdmin: false
    });
  }
  const insertedUsers = await User.insertMany(fakeUsers);

  // Create sites
  const sites = [];
  
  // Give the real admin 5 high-traffic sites
  for (let i = 0; i < 5; i++) {
    sites.push({ userId: adminId, name: `Admin Core Project ${i + 1}`, siteKey: crypto.randomUUID() });
  }

  // Give fake users sites
  for (let u of insertedUsers) {
    const numSites = Math.floor(Math.random() * 4); // 0 to 3 sites per user
    for (let i = 0; i < numSites; i++) {
      sites.push({ userId: u._id, name: `Mock Project ${u.username} ${i}`, siteKey: crypto.randomUUID() });
    }
  }

  const insertedSites = await Site.insertMany(sites);
  console.log(`Created ${insertedSites.length} sites.`);

  // Create massive pageviews
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
  const devices = ['desktop', 'mobile', 'tablet'];
  const countries = ['US', 'IN', 'UK', 'CA', 'DE', 'FR', 'JP', 'BR', 'AU'];

  console.log('Generating pageviews... this might take a moment.');
  
  const pageviewsBatch = [];
  
  for (let s of insertedSites) {
    // Determine if this is an Admin site (give it massive traffic)
    const isAdminSite = s.userId.toString() === adminId.toString();
    const numViews = isAdminSite 
      ? Math.floor(Math.random() * 2000) + 1000 // 1000-3000 views for admin sites
      : Math.floor(Math.random() * 100) + 5;    // 5-105 views for others

    for (let i = 0; i < numViews; i++) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 30));
      
      pageviewsBatch.push({
        siteKey: s.siteKey,
        path: Math.random() > 0.3 ? '/' : (Math.random() > 0.5 ? '/about' : '/pricing'),
        referrer: Math.random() > 0.4 ? 'google.com' : (Math.random() > 0.5 ? 'twitter.com' : 'direct'),
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        device: devices[Math.floor(Math.random() * devices.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        duration: Math.floor(Math.random() * 300), // 0-300 seconds
        visitorHash: crypto.randomBytes(16).toString('hex'),
        isNewVisitor: Math.random() > 0.3,
        timestamp: pastDate
      });
      
      // Insert in batches to prevent memory overflow
      if (pageviewsBatch.length >= 5000) {
        await Pageview.insertMany(pageviewsBatch);
        pageviewsBatch.length = 0;
      }
    }
  }
  
  if (pageviewsBatch.length > 0) {
    await Pageview.insertMany(pageviewsBatch);
  }

  const count = await Pageview.countDocuments();
  console.log(`Successfully seeded ${insertedUsers.length} users and ${count} total pageviews!`);
  process.exit(0);
};

seedDB().catch(console.error);
