(function() {
  // Config
  const API_URL = 'http://localhost:5000/api/track'; // In production, this would point to the deployed backend
  
  // Extract site_key from the script tag's data attribute
  const scriptTag = document.currentScript || document.querySelector('script[data-site-key]');
  if (!scriptTag) return;
  const siteKey = scriptTag.getAttribute('data-site-key');
  if (!siteKey) return;

  let pageviewId = null;
  let startTime = Date.now();

  // Send pageview
  const trackPageview = () => {
    const payload = {
      siteKey,
      path: window.location.pathname,
      referrer: document.referrer,
      width: window.innerWidth
    };

    fetch(`${API_URL}/pageview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.id) {
        pageviewId = data.id;
        setupDurationTracking();
      }
    })
    .catch(err => console.error('Analytics error:', err));
  };

  const updateDuration = () => {
    if (!pageviewId) return;
    const duration = Math.round((Date.now() - startTime) / 1000);
    const payload = JSON.stringify({ id: pageviewId, duration });

    // Use sendBeacon for unload events if available
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(`${API_URL}/duration`, blob);
    } else {
      fetch(`${API_URL}/duration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      });
    }
  };

  const setupDurationTracking = () => {
    // Heartbeat every 10 seconds to keep duration updated
    setInterval(() => {
      if (!document.hidden) {
        updateDuration();
      }
    }, 10000);

    // Update on tab close or navigation
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        updateDuration();
      }
    });
    
    window.addEventListener('beforeunload', updateDuration);
  };

  // Only track when DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    trackPageview();
  } else {
    document.addEventListener('DOMContentLoaded', trackPageview);
  }
})();
