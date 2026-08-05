const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

module.exports = function (passport) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: '/api/auth/github/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ githubId: profile.id });

          if (user) {
            // Update profile info in case it changed
            user.username = profile.username;
            user.displayName = profile.displayName;
            if (profile.photos && profile.photos.length > 0) {
              user.avatarUrl = profile.photos[0].value;
            }
            user.profileUrl = profile.profileUrl;
            
            // Check admin status
            if (process.env.ADMIN_GITHUB_USERNAME && profile.username.toLowerCase() === process.env.ADMIN_GITHUB_USERNAME.toLowerCase()) {
              user.isAdmin = true;
            }
            
            await user.save();
            return done(null, user);
          } else {
            const newUser = {
              githubId: profile.id,
              username: profile.username,
              displayName: profile.displayName,
              profileUrl: profile.profileUrl,
              avatarUrl: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : ''
            };
            
            // Check admin status
            if (process.env.ADMIN_GITHUB_USERNAME && profile.username.toLowerCase() === process.env.ADMIN_GITHUB_USERNAME.toLowerCase()) {
              newUser.isAdmin = true;
            }
            
            user = await User.create(newUser);
            return done(null, user);
          }
        } catch (err) {
          console.error(err);
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
