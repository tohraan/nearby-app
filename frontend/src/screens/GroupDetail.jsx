/**
 * GroupDetail.jsx — Hangout group thread and details
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Send, Calendar, MapPin, ChevronLeft } from 'lucide-react';
import { api } from '../lib/api.js';
import { getCachedPlaceById } from '../lib/db.js';
import { queueAction } from '../lib/offlineSync.js';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { getDeviceId } from '../lib/deviceId.js';

export default function GroupDetail({ groupId, onBack }) {
  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [place, setPlace] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const isOnline = useOnlineStatus();
  const endRef = useRef(null);
  const deviceId = getDeviceId();

  const loadData = useCallback(async () => {
    try {
      const g = await api.getGroup(groupId);
      setGroup(g);
      setHasJoined(g.members?.some(m => m.device_id === deviceId));

      if (g.place_id) {
        const p = await getCachedPlaceById(g.place_id);
        setPlace(p);
      }

      const p = await api.getGroupPosts(groupId);
      setPosts(p);
    } catch (err) {
      console.error('Failed to load group:', err);
    } finally {
      setLoading(false);
    }
  }, [groupId, deviceId]);

  useEffect(() => {
    if (isOnline) loadData();
    else setLoading(false); // Can't load fresh data offline
  }, [isOnline, loadData]);

  // Auto-scroll posts
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts]);

  const handleJoin = async () => {
    setHasJoined(true);
    setGroup(prev => ({
      ...prev,
      members: [...(prev.members || []), { device_id: deviceId, display_name: 'You' }]
    }));
    
    if (isOnline) {
      try { await api.joinGroup(groupId); }
      catch { queueAction({ type: 'join-group', groupId }); }
    } else {
      queueAction({ type: 'join-group', groupId });
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    // Optimistic UI update
    const optimisticPost = {
      id: `temp-${Date.now()}`,
      device_id: deviceId,
      display_name: 'You',
      text,
      created_at: new Date().toISOString()
    };
    
    setPosts(prev => [...prev, optimisticPost]);
    setInput('');

    if (isOnline) {
      try { await api.createGroupPost(groupId, text); }
      catch { queueAction({ type: 'group-post', groupId, text }); }
    } else {
      queueAction({ type: 'group-post', groupId, text });
    }
  };

  if (loading) {
    return (
      <div className="app-shell__content">
        <div className="skeleton" style={{ width: '100px', height: '24px', marginBottom: '24px' }} />
        <div className="skeleton" style={{ width: '80%', height: '48px', marginBottom: '16px' }} />
        <div className="skeleton" style={{ width: '60%', height: '24px', marginBottom: '32px' }} />
        <div className="skeleton skeleton--card" />
      </div>
    );
  }

  if (!group && !isOnline) {
    return (
      <div className="app-shell__content empty-state">
        <div className="empty-state__icon">📡</div>
        <div className="empty-state__title">NO CONNECTION</div>
        <div className="empty-state__desc">Groups require an internet connection to view.</div>
        <button className="neo-btn neo-btn--primary" onClick={onBack}>GO BACK</button>
      </div>
    );
  }

  if (!group) return <div className="app-shell__content">Group not found</div>;

  return (
    <div className="app-shell__content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 80px)' }}>
      {/* ─── Header ─── */}
      <div className="group-detail__header">
        <button 
          onClick={onBack}
          className="neo-btn neo-btn--ghost neo-btn--xs" 
          style={{ marginBottom: 'var(--space-4)', padding: 0 }}
        >
          <ChevronLeft size={16} /> Back to Nearby
        </button>
        
        <h1 style={{ fontSize: '32px', marginBottom: 'var(--space-2)' }}>{group.name}</h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>{group.description}</p>
        
        <div className="group-detail__meta">
          <div className="neo-badge neo-badge--lavender">
            <Users size={12} /> {group.members?.length || 0} / {group.max_people || 'Unlimited'} spots
          </div>
          <div className="neo-badge neo-badge--pink">
            {CATEGORY_EMOJI[group.category || 'outdoor']} {group.activity_type || 'Activity'}
          </div>
          {group.cost > 0 && (
            <div className="neo-badge neo-badge--yellow">
              💰 {group.cost} AED
            </div>
          )}
          {group.starts_at && (
            <div className="neo-badge neo-badge--mint">
              <Calendar size={12} /> {new Date(group.starts_at).toLocaleDateString()}
            </div>
          )}
          {place && (
            <div className="neo-badge neo-badge--blue">
              <MapPin size={12} /> {place.name}
            </div>
          )}
        </div>
      </div>

      {/* ─── Join Prompt ─── */}
      {!hasJoined && (
        <div className="neo-card neo-card--pink" style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>Join the group</h3>
            <p style={{ fontSize: '13px' }}>Chat and coordinate with others!</p>
          </div>
          <button className="neo-btn neo-btn--primary" onClick={handleJoin}>
            JOIN NOW
          </button>
        </div>
      )}

      {/* ─── Thread ─── */}
      <div className="group-detail__thread" style={{ flex: 1, overflowY: 'auto', paddingBottom: 'var(--space-4)' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--text-muted)' }}>
            No posts yet. Say hi!
          </div>
        ) : (
          posts.map(post => {
            const isMe = post.device_id === deviceId;
            return (
              <div key={post.id} className="group-detail__post" style={isMe ? { background: 'var(--color-cream)', borderColor: 'var(--border-default)' } : {}}>
                <div className="group-detail__post-author">{isMe ? 'You' : post.display_name}</div>
                <div className="group-detail__post-text">{post.text}</div>
                <div className="group-detail__post-time">
                  {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* ─── Input ─── */}
      {hasJoined && (
        <form className="group-detail__input-area" onSubmit={handlePost}>
          <input
            type="text"
            className="neo-input"
            style={{ flex: 1 }}
            placeholder="Write a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <button 
            type="submit" 
            className="neo-btn neo-btn--primary neo-btn--icon"
            disabled={!input.trim()}
          >
            <Send size={20} />
          </button>
        </form>
      )}
    </div>
  );
}
