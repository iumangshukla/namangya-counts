import { useState, useEffect } from 'react';
import { Users, Globe, Eye, Trash2 } from 'lucide-react';

const AdminDashboard = ({ user }) => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'sites'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, usersRes, sitesRes] = await Promise.all([
          fetch('http://localhost:5000/api/admin/stats', { credentials: 'include' }),
          fetch('http://localhost:5000/api/admin/users', { credentials: 'include' }),
          fetch('http://localhost:5000/api/admin/sites', { credentials: 'include' })
        ]);

        if (statsRes.ok && usersRes.ok && sitesRes.ok) {
          setStats(await statsRes.json());
          setUsers(await usersRes.json());
          setSites(await sitesRes.json());
        } else {
          console.error("Failed to load admin data");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure? This will delete the user and ALL their sites and pageviews permanently.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== userId));
        // We'd also ideally refresh stats and sites here, but removing from local state is fine for now
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteSite = async (siteId) => {
    if (!confirm('Are you sure? This will delete the site and ALL its pageviews permanently.')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/sites/${siteId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setSites(sites.filter(s => s._id !== siteId));
      } else {
        alert('Failed to delete site');
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="container mt-8"><p>Loading admin panel...</p></div>;
  if (!user?.isAdmin) return <div className="container mt-8"><p>Access Denied.</p></div>;

  return (
    <div className="container mt-8 animate-fade-in mb-8">
      <h2 className="mb-6">Global Admin Panel</h2>
      
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="glass-card p-6 flex flex-col items-center justify-center">
            <Users size={32} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }} />
            <h3>{stats.totalUsers}</h3>
            <p className="mb-0">Total Users</p>
          </div>
          <div className="glass-card p-6 flex flex-col items-center justify-center">
            <Globe size={32} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }} />
            <h3>{stats.totalSites}</h3>
            <p className="mb-0">Total Sites</p>
          </div>
          <div className="glass-card p-6 flex flex-col items-center justify-center">
            <Eye size={32} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }} />
            <h3>{stats.totalPageviews}</h3>
            <p className="mb-0">Global Pageviews</p>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('users')} 
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Users
        </button>
        <button 
          onClick={() => setActiveTab('sites')} 
          className={`btn ${activeTab === 'sites' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Sites
        </button>
      </div>

      <div className="glass-card p-6" style={{ overflowX: 'auto' }}>
        {activeTab === 'users' ? (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="pb-2">User</th>
                <th className="pb-2">GitHub ID</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Sites Owned</th>
                <th className="pb-2">Joined</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.githubId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td className="py-3 flex items-center gap-3">
                    <img src={u.avatarUrl} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                    {u.username}
                  </td>
                  <td className="py-3 text-muted">{u.githubId}</td>
                  <td className="py-3">
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem',
                      background: u.isAdmin ? 'var(--color-primary)' : '#333' 
                    }}>
                      {u.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="py-3 font-bold">{u.siteCount}</td>
                  <td className="py-3 text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 text-right">
                    {!u.isAdmin && (
                      <button 
                        onClick={() => handleDeleteUser(u._id)} 
                        className="btn btn-secondary" 
                        style={{ color: '#ff4d4d', padding: '0.3rem 0.5rem' }}
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="pb-2">Site Name</th>
                <th className="pb-2">Site Key</th>
                <th className="pb-2">Owner</th>
                <th className="pb-2">Created</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.map(s => (
                <tr key={s._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td className="py-3">{s.name}</td>
                  <td className="py-3"><code style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>{s.siteKey}</code></td>
                  <td className="py-3">{s.userId?.username || 'Unknown'}</td>
                  <td className="py-3 text-muted">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 text-right">
                    <button 
                      onClick={() => handleDeleteSite(s._id)} 
                      className="btn btn-secondary" 
                      style={{ color: '#ff4d4d', padding: '0.3rem 0.5rem' }}
                      title="Delete Site"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
