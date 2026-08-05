import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Users, Eye, Monitor, Smartphone, Globe } from 'lucide-react';

const SiteAnalytics = () => {
  const { siteKey } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/counts/${siteKey}?days=30`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [siteKey]);

  if (loading) return <div className="container mt-8"><p>Loading analytics...</p></div>;
  if (!data) return <div className="container mt-8"><p>Error loading analytics.</p></div>;

  const scriptSnippet = `<script async defer src="http://localhost:5173/analytics.js" data-site-key="${siteKey}"></script>`;
  const badgeSnippet = `[![Namangya Counts](http://localhost:5000/api/counts/badge/${siteKey})](https://your-website.com)`;

  return (
    <div className="container mt-8 animate-fade-in mb-8">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
          <ArrowLeft size={20} />
        </Link>
        <h2>Site Analytics</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <Eye size={32} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }} />
          <h3>{data.totalViews || 0}</h3>
          <p className="mb-0">Total Pageviews</p>
        </div>
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <Users size={32} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }} />
          <h3>{data.uniqueVisitors || 0}</h3>
          <p className="mb-0">Unique Visitors (30d)</p>
        </div>
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <Clock size={32} style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }} />
          <h3>{data.avgDuration || 0}s</h3>
          <p className="mb-0">Avg. Time on Page</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className="glass-card p-6">
          <h3 className="mb-4 border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>Top Pages</h3>
          {data.topPages && data.topPages.length > 0 ? (
            <ul style={{ listStyle: 'none' }}>
              {data.topPages.map((page, idx) => (
                <li key={idx} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="truncate">{page._id}</span>
                  <span className="font-bold">{page.views}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No page data yet.</p>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="mb-4 border-b pb-2" style={{ borderColor: 'var(--color-border)' }}>Top Referrers</h3>
          {data.topReferrers && data.topReferrers.length > 0 ? (
            <ul style={{ listStyle: 'none' }}>
              {data.topReferrers.map((ref, idx) => (
                <li key={idx} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <span className="truncate">{ref._id}</span>
                  <span className="font-bold">{ref.views}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No referrer data yet.</p>
          )}
        </div>
      </div>

      <div className="glass-card p-6 mb-8">
        <h3 className="mb-4">Embed Tracking</h3>
        <p>To start tracking, add this script tag to the <code>&lt;head&gt;</code> of your website:</p>
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <pre style={{ background: '#0d1117', padding: '1rem', borderRadius: '8px', overflowX: 'auto', border: '1px solid var(--color-border)' }}>
            <code>{scriptSnippet}</code>
          </pre>
        </div>
        
        <p>Or display a badge in your Markdown (e.g. GitHub README):</p>
        <div style={{ position: 'relative' }}>
          <pre style={{ background: '#0d1117', padding: '1rem', borderRadius: '8px', overflowX: 'auto', border: '1px solid var(--color-border)' }}>
            <code>{badgeSnippet}</code>
          </pre>
        </div>
      </div>

    </div>
  );
};

export default SiteAnalytics;
