const express = require('express');
const passport = require('passport');
const router = express.Router();

// @desc    Auth with GitHub
// @route   GET /api/auth/github
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// @desc    GitHub auth callback
// @route   GET /api/auth/github/callback
router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: process.env.FRONTEND_URL + '/login' }),
  (req, res) => {
    // Successful authentication, redirect to frontend dashboard.
    res.redirect(process.env.FRONTEND_URL + '/dashboard');
  }
);

// @desc    Get current user
// @route   GET /api/auth/me
router.get('/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      isAuthenticated: true,
      user: req.user,
    });
  } else {
    res.json({
      isAuthenticated: false,
      user: null,
    });
  }
});

// @desc    Logout user
// @route   GET /api/auth/logout
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.json({ success: true });
  });
});

module.exports = router;
