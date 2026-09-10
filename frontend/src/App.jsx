import { useState, useEffect } from 'react';
import { Map, Heart, MessageSquare, User } from 'lucide-react';
import NearbyFeed from './screens/NearbyFeed.jsx';
import SavedList from './screens/SavedList.jsx';
import Chat from './screens/Chat.jsx';
import GroupDetail from './screens/GroupDetail.jsx';
import PlaceDetail from './screens/PlaceDetail.jsx';
import Profile from './screens/Profile.jsx';
import MeetupDetail from './screens/MeetupDetail.jsx';
import MovieDetail from './screens/MovieDetail.jsx';
import CreateMeetup from './screens/CreateMeetup.jsx';
import { initOfflineSync } from './lib/offlineSync.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState('nearby');
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [activePlaceId, setActivePlaceId] = useState(null);
  const [activeMeetupId, setActiveMeetupId] = useState(null);
  const [activeMovieId, setActiveMovieId] = useState(null);
  const [showCreateMeetup, setShowCreateMeetup] = useState(false);
  const [booting, setBooting] = useState(true);

  // App boot sequence
  useEffect(() => {
    async function boot() {
      try {
        // Init sync listeners
        initOfflineSync();
      } catch (err) {
        console.error('App boot warning:', err);
      } finally {
        setBooting(false);
      }
    }
    boot();
  }, []);

  if (booting) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-yellow)' }}>
        <h1 style={{ fontSize: '48px', animation: 'pulse 1.5s infinite' }}>NEARBY</h1>
      </div>
    );
  }

  // Handle routing internally for this demo
  const renderScreen = () => {
    if (showCreateMeetup) {
      return (
        <CreateMeetup 
          onBack={() => setShowCreateMeetup(false)}
          onCreateSuccess={(newMeetup) => {
            setShowCreateMeetup(false);
            setActiveMeetupId(newMeetup.id);
          }}
        />
      );
    }
    if (activeMeetupId) {
      return (
        <MeetupDetail 
          meetupId={activeMeetupId} 
          onBack={() => setActiveMeetupId(null)} 
          onNavigateToPlace={(id) => {
            setActiveMeetupId(null);
            setActivePlaceId(id);
          }} 
        />
      );
    }
    if (activeMovieId) {
      return (
        <MovieDetail 
          movieId={activeMovieId} 
          onBack={() => setActiveMovieId(null)} 
          onNavigateToPlace={(id) => {
            setActiveMovieId(null);
            setActivePlaceId(id);
          }} 
        />
      );
    }
    if (activePlaceId) {
      return (
        <PlaceDetail 
          placeId={activePlaceId} 
          onBack={() => setActivePlaceId(null)} 
          onNavigateToPlace={setActivePlaceId} 
          onNavigateToMeetup={setActiveMeetupId}
          onNavigateToMovie={setActiveMovieId}
        />
      );
    }
    if (activeGroupId) {
      return <GroupDetail groupId={activeGroupId} onBack={() => setActiveGroupId(null)} />;
    }

    switch (currentTab) {
      case 'nearby': 
        return (
          <NearbyFeed 
            onNavigateToGroup={setActiveGroupId} 
            onNavigateToPlace={setActivePlaceId} 
            onNavigateToMeetup={setActiveMeetupId}
            onNavigateToMovie={setActiveMovieId}
            onHostMeetup={() => setShowCreateMeetup(true)}
          />
        );
      case 'saved': return <SavedList onNavigateToPlace={setActivePlaceId} />;
      case 'chat': return <Chat onNavigateToPlace={setActivePlaceId} />;
      case 'profile': return <Profile />;
      default: 
        return (
          <NearbyFeed 
            onNavigateToGroup={setActiveGroupId} 
            onNavigateToPlace={setActivePlaceId}
            onNavigateToMeetup={setActiveMeetupId}
            onNavigateToMovie={setActiveMovieId}
            onHostMeetup={() => setShowCreateMeetup(true)}
          />
        );
    }
  };

  return (
    <div className="app-shell">
      {renderScreen()}

      {!activeGroupId && !activePlaceId && (
        <nav className="bottom-nav">
          <div className="bottom-nav__inner">
            <button 
              className={`bottom-nav__item ${currentTab === 'nearby' ? 'bottom-nav__item--active' : ''}`}
              onClick={() => setCurrentTab('nearby')}
            >
              <Map size={22} strokeWidth={2.5} />
              <span>Nearby</span>
            </button>
            
            <button 
              className={`bottom-nav__item ${currentTab === 'saved' ? 'bottom-nav__item--active' : ''}`}
              onClick={() => setCurrentTab('saved')}
            >
              <Heart size={22} strokeWidth={2.5} />
              <span>Saved</span>
            </button>
            
            <button 
              className={`bottom-nav__item ${currentTab === 'chat' ? 'bottom-nav__item--active' : ''}`}
              onClick={() => setCurrentTab('chat')}
            >
              <MessageSquare size={22} strokeWidth={2.5} />
              <span>AI Guide</span>
            </button>
            
            <button 
              className={`bottom-nav__item ${currentTab === 'profile' ? 'bottom-nav__item--active' : ''}`}
              onClick={() => setCurrentTab('profile')}
            >
              <User size={22} strokeWidth={2.5} />
              <span>Profile</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
