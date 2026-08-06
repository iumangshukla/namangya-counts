import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Sun, Moon } from 'lucide-react';

const Navbar = ({ user, setUser }) => {
  const location = useLocation();
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    // Check local storage for theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsLightMode(true);
      document.body.classList.add('light-theme');
    }
  }, []);

  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
    if (!isLightMode) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5001/api/auth/logout', { credentials: 'include' });
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
          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary" 
            style={{ padding: '0.4rem', borderRadius: '50%' }}
            title="Toggle Theme"
          >
            {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          {user ? (
            <>
              {user.isAdmin && (
                <Link 
                  to="/admin" 
                  className={`btn ${location.pathname === '/admin' ? 'btn-primary' : 'btn-secondary'}`} 
                >
                  Admin
                </Link>
              )}
              <Link 
                to="/dashboard" 
                className={`btn ${location.pathname === '/dashboard' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-2 ml-4">
                <img src={user.avatarUrl} alt="Avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Logout</button>
              </div>
            </>
          ) : (
            <a href="http://localhost:5001/api/auth/github" className="btn btn-primary">
              Sign in with GitHub
            </a>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
