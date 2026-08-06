import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
          fetch('http://localhost:5001/api/admin/stats', { credentials: 'include' }),
          fetch('http://localhost:5001/api/admin/users', { credentials: 'include' }),
          fetch('http://localhost:5001/api/admin/sites', { credentials: 'include' })
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

  const [userToDelete, setUserToDelete] = useState(null);
  const [siteToDelete, setSiteToDelete] = useState(null);

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`http://localhost:5001/api/admin/users/${userToDelete._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== userToDelete._id));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUserToDelete(null);
    }
  };

  const confirmDeleteSite = async () => {
    if (!siteToDelete) return;
    try {
      const res = await fetch(`http://localhost:5001/api/admin/sites/${siteToDelete._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setSites(sites.filter(s => s._id !== siteToDelete._id));
      } else {
        alert('Failed to delete site');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSiteToDelete(null);
    }
  };

  const handleDeleteUser = (user) => setUserToDelete(user);
  const handleDeleteSite = (site) => setSiteToDelete(site);

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
                        onClick={() => handleDeleteUser(u)} 
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
                      onClick={() => handleDeleteSite(s)} 
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

      {/* Delete User Modal */}
      {userToDelete && createPortal(
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
            <h2 className="mb-2">Delete User?</h2>
            <p className="mb-6">Are you absolutely sure you want to delete the user <strong>{userToDelete.username}</strong>? All of their registered sites and analytics data will be permanently lost.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setUserToDelete(null)} className="btn btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={confirmDeleteUser} className="btn btn-primary flex-1" style={{ background: '#ef4444', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Site Modal */}
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
              <button onClick={confirmDeleteSite} className="btn btn-primary flex-1" style={{ background: '#ef4444', boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminDashboard;
