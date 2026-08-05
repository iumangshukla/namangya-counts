import { Link } from 'react-router-dom';
import { BarChart2, Shield, Zap } from 'lucide-react';

const Landing = ({ user }) => {
  return (
    <div className="container mt-8 animate-fade-in">
      <div className="flex flex-col items-center justify-center text-center mt-8 mb-8">
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', maxWidth: '800px' }}>
          Universal, privacy-friendly <br/>
          <span className="text-gradient">website analytics</span>
        </h1>
        <p style={{ fontSize: '1.25rem', maxWidth: '600px', marginBottom: '2rem' }}>
          Drop a small script or badge into any website to track raw hits and unique visitors.
          Open-source, self-hostable, and GDPR compliant.
        </p>
        
        {user ? (
          <Link to="/dashboard" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            Go to Dashboard
          </Link>
        ) : (
          <a href="http://localhost:5000/api/auth/github" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            Get Started with GitHub
          </a>
        )}
      </div>

      <div className="flex gap-6 mt-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="glass-card p-6 flex-col gap-4">
          <div style={{ color: 'var(--color-primary)' }}><Shield size={40} /></div>
          <h3 className="mt-4">Privacy First</h3>
          <p>We use a daily rotating salt to hash IP addresses. No personally identifiable information or cross-site tracking cookies are ever stored.</p>
        </div>
        <div className="glass-card p-6 flex-col gap-4">
          <div style={{ color: 'var(--color-primary)' }}><BarChart2 size={40} /></div>
          <h3 className="mt-4">Advanced Insights</h3>
          <p>Get Vercel/GA-style analytics including top pages, referrers, device breakdowns, and average time spent on page.</p>
        </div>
        <div className="glass-card p-6 flex-col gap-4">
          <div style={{ color: 'var(--color-primary)' }}><Zap size={40} /></div>
          <h3 className="mt-4">Lightning Fast</h3>
          <p>Minimal footprint script that loads asynchronously without slowing down your website. Self-host it anywhere.</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
