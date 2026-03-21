import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ProfileCard from '../components/ProfileCard';
import ProfileForm from '../components/ProfileForm';
import ChatWidget from '../components/ChatWidget';
import Recommendations from '../components/Recommendations';
import { LogOut, Sparkles, User, MessageSquare, BookOpen } from 'lucide-react';
import SettingsDropdown from '../components/SettingsDropdown';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (user?.profile_completed) {
      setActiveTab('recommendations');
    }
  }, []);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
    { id: 'recommendations', label: 'For You', icon: BookOpen },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-brand">
          <Sparkles size={24} />
          <span>ProConnect</span>
        </div>
        <div className="header-right">
          <span className="header-greeting">
            Hello, {user?.name || user?.email?.split('@')[0]}
          </span>
          <SettingsDropdown />
          <button className="btn-ghost" onClick={logout}>
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="dashboard-content">
        {activeTab === 'profile' && (
          <div className="profile-section">
            <ProfileCard user={user} />
            <ProfileForm />
          </div>
        )}
        {activeTab === 'chat' && <ChatWidget />}
        {activeTab === 'recommendations' && <Recommendations />}
      </main>
    </div>
  );
}
