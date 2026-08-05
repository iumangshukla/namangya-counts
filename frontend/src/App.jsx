import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import SiteAnalytics from './pages/SiteAnalytics';

import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check auth status
    fetch('http://localhost:5000/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.isAuthenticated) {
          setUser(data.user);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading...</p></div>;
  }

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <main>
        <Routes>
          <Route path="/" element={<Landing user={user} />} />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard user={user} /> : <Navigate to="/" />} 
          />
          <Route 
            path="/site/:siteKey" 
            element={user ? <SiteAnalytics /> : <Navigate to="/" />} 
          />
          <Route 
            path="/admin" 
            element={user?.isAdmin ? <AdminDashboard user={user} /> : <Navigate to="/" />} 
          />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
