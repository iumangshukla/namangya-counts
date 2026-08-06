import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ExternalLink } from 'lucide-react';

const Dashboard = ({ user }) => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSiteName, setNewSiteName] = useState('');
  const [newlyAddedSite, setNewlyAddedSite] = useState(null);

  const fetchSites = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/sites', { credentials: 'include' });
      const data = await res.json();
      setSites(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newSiteName.trim()) return;

    try {
      const res = await fetch('http://localhost:5001/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSiteName }),
        credentials: 'include'
      });
      if (res.ok) {
        const newSite = await res.json();
        setNewSiteName('');
        setSites([newSite, ...sites]);
        setNewlyAddedSite(newSite);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [siteToDelete, setSiteToDelete] = useState(null);

  const confirmDelete = async () => {
    if (!siteToDelete) return;
    try {
      const res = await fetch(`http://localhost:5001/api/sites/${siteToDelete._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) fetchSites();
    } catch (err) {
      console.error(err);
    } finally {
      setSiteToDelete(null);
    }
  };

  const handleDelete = (site) => {
    setSiteToDelete(site);
  };

  if (loading) return <div className="container mt-8"><p>Loading dashboard...</p></div>;

  return (
    <div className="container mt-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <h2>Your Sites</h2>
        <form onSubmit={handleCreate} className="flex gap-2" style={{ maxWidth: '400px' }}>
          <input 
            type="text" 
            placeholder="New site name..." 
            value={newSiteName}
            onChange={(e) => setNewSiteName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary"><Plus size={18} /> Add</button>
        </form>
      </div>

      {sites.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p>You haven't added any sites yet. Add one above to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {sites.map(site => (
            <div key={site._id} className="glass-card p-6 flex flex-col justify-between">
              <div>
                <h3 className="mb-2">{site.name}</h3>
                <p style={{ fontSize: '0.85rem' }}>Site Key: <code style={{ color: 'var(--color-primary)' }}>{site.siteKey}</code></p>
                <div className="mt-4 mb-4" style={{ display: 'flex', gap: '1rem' }}>
                  <img src={`http://localhost:5001/api/counts/badge/${site.siteKey}`} alt="Hits Badge" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                <Link to={`/site/${site.siteKey}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                  <ExternalLink size={16} /> View Analytics
                </Link>
                <button onClick={() => handleDelete(site)} className="btn btn-secondary" style={{ color: '#ff4d4d', padding: '0.5rem' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {siteToDelete && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div className="glass-card p-8 animate-fade-in text-center" style={{ maxWidth: '400px', width: '90%' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', color: '#ef4444', marginBottom: '1rem' }}>
              <Trash2 size={32} />
            </div>
            <h2 className="mb-2">Delete Site?</h2>
            <p className="mb-6">Are you absolutely sure you want to delete <strong>{siteToDelete.name}</strong>? All analytics data will be permanently lost.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setSiteToDelete(null)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn btn-primary flex-1" style={{ background: '#ef4444', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Site Registration Modal */}
      {newlyAddedSite && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(5px)'
        }}>
          <div className="glass-card p-8 animate-fade-in" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="mb-4">🎉 Site Registered!</h2>
            <p className="mb-6">Your site <strong>{newlyAddedSite.name}</strong> is ready. Add one of the following snippets to your website to start tracking.</p>
            
            <div className="mb-6">
              <h4>Option 1: Lightweight Tracker</h4>
              <p style={{ fontSize: '0.9rem' }}>Ultra-fast, privacy-focused tracking (raw hits only). Add this before the closing <code>&lt;/head&gt;</code> tag.</p>
              <pre className="p-4 rounded mt-2" style={{ background: '#0d1117', overflowX: 'auto', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
{`<script src="http://localhost:5173/analytics.js" data-site-key="${newlyAddedSite.siteKey}" defer></script>`}
              </pre>
            </div>

            <div className="mb-6">
              <h4>Option 2: Advanced Tracker (Recommended)</h4>
              <p style={{ fontSize: '0.9rem' }}>Monitors session durations, accurate bounce rates, and React/SPA route changes.</p>
              <pre className="p-4 rounded mt-2" style={{ background: '#0d1117', overflowX: 'auto', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
{`<script src="http://localhost:5173/analytics.advanced.js" data-site-key="${newlyAddedSite.siteKey}" defer></script>`}
              </pre>
            </div>

            <div className="mb-6">
              <h4>Option 3: Visible Badge</h4>
              <p style={{ fontSize: '0.9rem' }}>Great for GitHub READMEs or simple footers.</p>
              <pre className="p-4 rounded mt-2" style={{ background: '#0d1117', overflowX: 'auto', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
{`[![Namangya Counts](http://localhost:5001/api/counts/badge/${newlyAddedSite.siteKey})](https://your-website.com)`}
              </pre>
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setNewlyAddedSite(null)} className="btn btn-secondary">
                Close
              </button>
              <Link to={`/site/${newlyAddedSite.siteKey}`} className="btn btn-primary">
                View Analytics
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Dashboard;
