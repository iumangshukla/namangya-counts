const request = require('supertest');
const app = require('../index');
const db = require('./setup');
const Pageview = require('../models/Pageview');
const Site = require('../models/Site');
const User = require('../models/User');
const crypto = require('crypto');

// Increase timeout for memory server download if needed
jest.setTimeout(30000);

beforeAll(async () => {
  await db.connect();
});

afterEach(async () => {
  await db.clearDatabase();
});

afterAll(async () => {
  await db.closeDatabase();
});

describe('Tracking API', () => {
  let siteKey;

  beforeEach(async () => {
    // Create a mock site to track against
    const user = await User.create({
      githubId: '12345',
      username: 'testuser'
    });
    
    const site = await Site.create({
      userId: user._id,
      name: 'My Test Site'
    });
    siteKey = site.siteKey;
  });

  describe('POST /api/track/pageview', () => {
    it('should return 400 if siteKey is missing', async () => {
      const res = await request(app)
        .post('/api/track/pageview')
        .send({ path: '/about' });
        
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('error', 'siteKey is required');
    });

    it('should track a new pageview and mark as new visitor', async () => {
      const res = await request(app)
        .post('/api/track/pageview')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
        .set('X-Forwarded-For', '192.168.1.1')
        .send({
          siteKey,
          path: '/home',
          width: 1920
        });
        
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('id');
      
      const pv = await Pageview.findById(res.body.id);
      expect(pv.isNewVisitor).toBe(true);
      expect(pv.device).toBe('desktop');
      expect(pv.path).toBe('/home');
    });

    it('should mark subsequent pageviews from same visitor as NOT new', async () => {
      // First visit
      await request(app)
        .post('/api/track/pageview')
        .set('User-Agent', 'CustomBot/1.0')
        .set('X-Forwarded-For', '10.0.0.1')
        .send({ siteKey, path: '/home' });
        
      // Second visit (same day, same IP, same UA)
      const res2 = await request(app)
        .post('/api/track/pageview')
        .set('User-Agent', 'CustomBot/1.0')
        .set('X-Forwarded-For', '10.0.0.1')
        .send({ siteKey, path: '/about' });
        
      expect(res2.statusCode).toEqual(200);
      
      const pv2 = await Pageview.findById(res2.body.id);
      expect(pv2.isNewVisitor).toBe(false);
    });
  });

  describe('POST /api/track/duration', () => {
    it('should update duration of an existing pageview', async () => {
      // Create a pageview first
      const pvRes = await request(app)
        .post('/api/track/pageview')
        .send({ siteKey, path: '/blog' });
        
      const pvId = pvRes.body.id;
      
      // Send duration update
      const durRes = await request(app)
        .post('/api/track/duration')
        .send({ id: pvId, duration: 45 });
        
      expect(durRes.statusCode).toEqual(200);
      expect(durRes.body).toHaveProperty('success', true);
      
      const updatedPv = await Pageview.findById(pvId);
      expect(updatedPv.duration).toBe(45);
    });
  });
});
