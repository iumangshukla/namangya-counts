import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, FileText, Link as LinkIcon, Globe, Monitor, Compass } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { LineChart, Line } from 'recharts'; // Added LineChart for sparklines

const TrendIndicator = ({ value }) => {
  if (value === 0) return <span className="text-muted" style={{ fontSize: '0.8rem' }}>0%</span>;
  const isPositive = value > 0;
  return (
    <span style={{ color: isPositive ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
      {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {Math.abs(value)}%
    </span>
  );
};

const StatCard = ({ title, value, trend, suffix = '', chartData = [], dataKey }) => (
  <div className="glass-card p-6" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
    <h4 style={{ fontSize: '0.9rem', color: 'var(--color-muted)', marginBottom: '1rem', fontWeight: 500, zIndex: 2 }}>{title}</h4>
    
    {chartData && chartData.length > 0 && dataKey && (
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', opacity: 0.3, zIndex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line type="monotone" dataKey={dataKey} stroke="var(--color-primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 2 }}>
      <h2 style={{ fontSize: '2rem', margin: 0, lineHeight: 1 }}>{value}{suffix}</h2>
      <TrendIndicator value={trend} />
    </div>
  </div>
);

const capitalize = (str) => {
  if (!str) return 'Unknown';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode === 'unknown' || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const getFavicon = (domain) => {
  if (!domain || domain === 'direct' || domain === 'unknown') return null;
  let url = domain;
  if (!url.startsWith('http')) url = 'http://' + url;
  try {
    const hostname = new URL(url).hostname;
    return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
  } catch (e) {
    return null;
  }
};

const ProgressBarList = ({ items, type }) => {
  if (!items || items.length === 0) return <p className="text-muted" style={{ fontSize: '0.9rem' }}>No data</p>;
  const max = Math.max(...items.map(i => i.views));
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((item, idx) => {
        const percent = (item.views / max) * 100;
        let name = item._id || 'Unknown';
        
        let icon = null;
        if (type === 'country') {
          icon = <span style={{ marginRight: '8px', fontSize: '1.1rem' }}>{getCountryFlag(name)}</span>;
        } else if (type === 'source') {
          const favicon = getFavicon(name);
          if (favicon) {
            icon = <img src={favicon} alt="" style={{ width: '16px', height: '16px', marginRight: '8px', borderRadius: '2px' }} onError={(e) => e.target.style.display='none'} />;
          } else {
            icon = <span style={{ marginRight: '8px', width: '16px', display: 'inline-block' }}></span>;
          }
        } else if (type === 'device') {
          name = capitalize(name); // Format mobile, desktop, tablet
        }

        return (
          <li key={idx} style={{ position: 'relative', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', zIndex: 1 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${percent}%`, backgroundColor: 'rgba(255, 127, 80, 0.15)', borderRadius: '6px', zIndex: -1 }} />
            <span className="truncate flex items-center" style={{ fontSize: '0.95rem', maxWidth: '75%' }}>
              {icon}
              {name}
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{item.views}</span>
          </li>
        );
      })}
    </ul>
  );
};

const SiteAnalytics = () => {
  const { siteKey } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [daysFilter, setDaysFilter] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5001/api/counts/${siteKey}?days=${daysFilter}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [siteKey, daysFilter]);

  if (!data && loading) return <div className="container mt-8"><p>Loading analytics...</p></div>;
  if (!data) return <div className="container mt-8"><p>Error loading analytics.</p></div>;

  return (
    <div className="container mt-8 animate-fade-in mb-12">
      {/* Header & Filters */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4" style={{ marginBottom: '3rem' }}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Back to Dashboard">
            <ArrowLeft size={20} />
          </Link>
          <h2 style={{ margin: 0 }}>Analytics</h2>
        </div>
        
        <div className="glass-card" style={{ padding: '0.3rem', display: 'flex', gap: '0.2rem', borderRadius: '8px' }}>
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDaysFilter(d)}
              className={`btn ${daysFilter === d ? 'btn-primary' : ''}`}
              style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', border: 'none', background: daysFilter === d ? 'var(--color-primary)' : 'transparent', color: daysFilter === d ? '#fff' : 'var(--color-text)' }}
            >
              Last {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Hero Stats */}
      <div style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <StatCard title="Unique Visitors" value={data.current.uniqueVisitors} trend={data.trends.visitors} chartData={data.timeSeries} dataKey="visitors" />
          <StatCard title="Total Sessions" value={data.current.totalSessions || 0} trend={data.trends.sessions || 0} chartData={data.timeSeries} dataKey="sessions" />
          <StatCard title="Total Page Views" value={data.current.totalViews} trend={data.trends.views} chartData={data.timeSeries} dataKey="views" />
          <StatCard title="Bounce Rate" value={data.current.bounceRate} trend={data.trends.bounceRate} suffix="%" chartData={data.timeSeries} dataKey="bounceRate" />
          <StatCard title="Avg Session Duration" value={data.current.avgDuration} trend={data.trends.duration} suffix="s" chartData={data.timeSeries} dataKey="duration" />
        </div>

        {/* Main Chart */}
        <div className="glass-card p-6 mb-8">
          <h3 className="mb-6" style={{ fontSize: '1.1rem' }}>Traffic Overview</h3>
          <div style={{ height: '320px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="_id" stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis stroke="var(--color-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  labelStyle={{ color: 'var(--color-muted)', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="views" name="Page Views" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" activeDot={{ r: 6, fill: 'var(--color-primary)', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grid Panels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          <div className="glass-card p-6">
            <h3 className="mb-4 flex items-center gap-2" style={{ fontSize: '1.05rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
              <FileText size={18} style={{ color: 'var(--color-primary)' }} /> Top Pages
            </h3>
            <ProgressBarList items={data.topPages} />
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-4 flex items-center gap-2" style={{ fontSize: '1.05rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
              <LinkIcon size={18} style={{ color: 'var(--color-primary)' }} /> Top Sources
            </h3>
            <ProgressBarList items={data.topReferrers} type="source" />
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-4 flex items-center gap-2" style={{ fontSize: '1.05rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
              <Globe size={18} style={{ color: 'var(--color-primary)' }} /> Countries
            </h3>
            <ProgressBarList items={data.countries} type="country" />
          </div>

          <div className="glass-card p-6">
            <h3 className="mb-4 flex items-center gap-2" style={{ fontSize: '1.05rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem' }}>
              <Monitor size={18} style={{ color: 'var(--color-primary)' }} /> Devices & Browsers
            </h3>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                <h5 className="flex items-center gap-2 text-muted mb-3" style={{ fontSize: '0.85rem' }}>
                  <Monitor size={14} /> Devices
                </h5>
                <ProgressBarList items={data.devices} type="device" />
              </div>
              <div style={{ flex: 1 }}>
                <h5 className="flex items-center gap-2 text-muted mb-3" style={{ fontSize: '0.85rem' }}>
                  <Compass size={14} /> Browsers
                </h5>
                <ProgressBarList items={data.browsers} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteAnalytics;
