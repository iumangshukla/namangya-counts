(function() {
  const currentScript = document.currentScript;
  const siteKey = currentScript.getAttribute('data-site-key');
  const apiEndpoint = currentScript.getAttribute('data-api-endpoint') || 'http://localhost:5001/api/track';

  if (!siteKey) {
    console.error('Namangya Counts Advanced: No site key provided.');
    return;
  }

  const getVisitorHash = () => {
    let hash = localStorage.getItem('namangya_vhash');
    if (!hash) {
      hash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('namangya_vhash', hash);
    }
    return hash;
  };

  const getDevice = () => {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  const getBrowser = () => {
    const ua = navigator.userAgent;
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    if (ua.indexOf('Trident') > -1) return 'IE';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    return 'Unknown';
  };

  const getOS = () => {
    const ua = navigator.userAgent;
    if (ua.indexOf('Win') > -1) return 'Windows';
    if (ua.indexOf('Mac') > -1) return 'MacOS';
    if (ua.indexOf('X11') > -1) return 'UNIX';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('like Mac') > -1) return 'iOS';
    return 'Unknown';
  };

  let pageviewId = null;
  let pageLoadTime = Date.now();
  let currentPath = window.location.pathname;

  const sendHit = async () => {
    const payload = {
      siteKey,
      path: currentPath,
      referrer: document.referrer || '',
      width: window.innerWidth
    };

    try {
      const res = await fetch(`${apiEndpoint}/pageview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.id) {
        pageviewId = data.id;
      }
    } catch (e) {
      // Silent fail
    }
  };

  const updateDuration = () => {
    if (!pageviewId) return;
    const duration = Math.floor((Date.now() - pageLoadTime) / 1000);
    const payload = JSON.stringify({ id: pageviewId, duration });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(`${apiEndpoint}/duration`, blob);
    } else {
      fetch(`${apiEndpoint}/duration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  };

  // Initial page load hit
  sendHit();

  // Handle SPA Routing
  let lastUrl = location.href; 
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      updateDuration(); // Save duration for old page
      
      // Update state for new page
      lastUrl = url;
      currentPath = window.location.pathname;
      pageLoadTime = Date.now();
      pageviewId = null;
      
      // Send entry hit for new page
      sendHit();
    }
  }).observe(document, {subtree: true, childList: true});

  // Handle page exit/unload
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      updateDuration();
    } else if (document.visibilityState === 'visible') {
      pageLoadTime = Date.now(); // Resume
    }
  });

})();
