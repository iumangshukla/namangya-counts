import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ExternalLink } from 'lucide-react';

const Dashboard = ({ user }) => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSiteName, setNewSiteName] = useState('');

  const fetchSites = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/sites', { credentials: 'include' });
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
      const res = await fetch('http://localhost:5000/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSiteName }),
        credentials: 'include'
      });
      if (res.ok) {
        setNewSiteName('');
        fetchSites();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this site? All analytics will be lost.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/sites/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) fetchSites();
    } catch (err) {
      console.error(err);
    }
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
                  <img src={`http://localhost:5000/api/counts/badge/${site.siteKey}`} alt="Hits Badge" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                <Link to={`/site/${site.siteKey}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                  <ExternalLink size={16} /> View Analytics
                </Link>
                <button onClick={() => handleDelete(site._id)} className="btn btn-secondary" style={{ color: '#ff4d4d', padding: '0.5rem' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
