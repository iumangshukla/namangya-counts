import { Link } from 'react-router-dom';
import { Activity, Github } from 'lucide-react';

const Navbar = ({ user, setUser }) => {
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', { credentials: 'include' });
      setUser(null);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  return (
    <nav className="navbar glass">
      <div className="container">
        <Link to="/" className="logo">
          <Activity className="logo-icon" size={28} />
          <span>Namangya <span className="text-gradient">Counts</span></span>
        </Link>
        
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
              <div className="flex items-center gap-2 ml-4">
                <img src={user.avatarUrl} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Logout</button>
              </div>
            </>
          ) : (
            <a href="http://localhost:5000/api/auth/github" className="btn btn-primary">
              <Github size={20} />
              Sign in with GitHub
            </a>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
