import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  Save, Monitor, Code, HeartPulse, Landmark, GraduationCap, ShoppingBag,
  Film, Factory, Lightbulb, Building, MoreHorizontal, ChevronDown,
  User, UserRound, Users, UserX,
} from 'lucide-react';

function CompanyLogo({ name, domain }) {
  const [status, setStatus] = useState('loading');
  const initial = (name || domain || '?').charAt(0).toUpperCase();
  const hue = initial.charCodeAt(0) * 7 % 360;

  if (status === 'fallback') {
    return (
      <span className="company-logo-letter" style={{ background: `hsl(${hue}, 55%, 45%)` }}>
        {initial}
      </span>
    );
  }

  return (
    <img
      className="company-logo-img"
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
      alt={name}
      onLoad={() => setStatus('loaded')}
      onError={() => setStatus('fallback')}
      style={status === 'loading' ? { opacity: 0 } : undefined}
    />
  );
}

export default function ProfileForm() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    company: user?.company || '',
    role: user?.role || '',
    bio: user?.bio || '',
    industry: user?.industry || '',
    experience_level: user?.experience_level || '',
    pronouns: user?.pronouns || '',
  });
  const [saving, setSaving] = useState(false);
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [companyDomain, setCompanyDomain] = useState(null);
  const companyDebounceRef = useRef(null);
  const companyCacheRef = useRef({});

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        company: user.company || '',
        role: user.role || '',
        bio: user.bio || '',
        industry: user.industry || '',
        experience_level: user.experience_level || '',
        pronouns: user.pronouns || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (user?.company && !companyDomain) {
      fetch(
        `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(user.company)}`
      )
        .then((r) => r.json())
        .then((data) => {
          const match = data.find(
            (c) => c.name.toLowerCase() === user.company.toLowerCase()
          );
          if (match) setCompanyDomain(match.domain);
          if (data.length > 0) companyCacheRef.current[user.company.toLowerCase()] = data;
        })
        .catch(() => {});
    }
    return () => clearTimeout(companyDebounceRef.current);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCompanyChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, company: value });
    setCompanyDomain(null);

    clearTimeout(companyDebounceRef.current);
    if (value.length < 1) {
      setCompanySuggestions([]);
      setShowCompanyDropdown(false);
      return;
    }

    const key = value.toLowerCase();
    if (companyCacheRef.current[key]) {
      setCompanySuggestions(companyCacheRef.current[key]);
      setShowCompanyDropdown(true);
      return;
    }

    const prefixKeys = Object.keys(companyCacheRef.current)
      .filter((k) => key.startsWith(k))
      .sort((a, b) => b.length - a.length);
    if (prefixKeys.length > 0) {
      const cached = companyCacheRef.current[prefixKeys[0]];
      const filtered = cached.filter((c) =>
        c.name.toLowerCase().includes(key)
      );
      if (filtered.length > 0) {
        setCompanySuggestions(filtered);
        setShowCompanyDropdown(true);
      }
    }

    companyDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(value)}`
        );
        const data = await res.json();
        companyCacheRef.current[key] = data;
        setCompanySuggestions(data);
        setShowCompanyDropdown(data.length > 0);
      } catch {
        setCompanySuggestions([]);
        setShowCompanyDropdown(false);
      }
    }, 150);
  };

  const selectCompany = (company) => {
    setForm({ ...form, company: company.name });
    setCompanyDomain(company.domain);
    setCompanySuggestions([]);
    setShowCompanyDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = {};
      for (const [key, value] of Object.entries(form)) {
        if (value && value !== (user?.[key] || '')) {
          updates[key] = value;
        }
      }
      if (Object.keys(updates).length === 0) {
        toast('No changes to save');
        setSaving(false);
        return;
      }
      await userAPI.updateProfile(updates);
      await refreshUser();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);

  const industries = [
    { value: 'Technology', icon: Monitor, color: '#6366f1' },
    { value: 'Software Development', icon: Code, color: '#3b82f6' },
    { value: 'Healthcare', icon: HeartPulse, color: '#ef4444' },
    { value: 'Finance', icon: Landmark, color: '#22c55e' },
    { value: 'Education', icon: GraduationCap, color: '#f59e0b' },
    { value: 'Retail', icon: ShoppingBag, color: '#ec4899' },
    { value: 'Media', icon: Film, color: '#8b5cf6' },
    { value: 'Manufacturing', icon: Factory, color: '#f97316' },
    { value: 'Consulting', icon: Lightbulb, color: '#14b8a6' },
    { value: 'Government', icon: Building, color: '#64748b' },
    { value: 'Other', icon: MoreHorizontal, color: '#94a3b8' },
  ];

  const selectedIndustry = industries.find((i) => i.value === form.industry);

  const levels = [
    { value: 'junior', label: 'Junior (0-2 years)' },
    { value: 'mid', label: 'Mid-Level (2-5 years)' },
    { value: 'senior', label: 'Senior (5-10 years)' },
    { value: 'lead', label: 'Lead / Staff (10+ years)' },
    { value: 'executive', label: 'Executive / C-Level' },
  ];

  const [showPronounDropdown, setShowPronounDropdown] = useState(false);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const selectedLevel = levels.find((l) => l.value === form.experience_level);

  const pronounOptions = [
    { value: 'he/him',     label: 'He/Him',            icon: User,      color: '#6366f1' },
    { value: 'she/her',    label: 'She/Her',           icon: UserRound, color: '#ec4899' },
    { value: 'other',      label: 'Other',             icon: Users,     color: '#10b981' },
    { value: 'prefer-not', label: 'Prefer not to say', icon: UserX,     color: '#94a3b8' },
  ];

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <h3>Edit Profile</h3>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" />
        </div>

        <div className="form-group pronoun-select">
          <label>Pronouns</label>
          <button
            type="button"
            className="pronoun-trigger"
            onClick={() => setShowPronounDropdown(!showPronounDropdown)}
            onBlur={() => setTimeout(() => setShowPronounDropdown(false), 200)}
          >
            {(() => {
              const selected = pronounOptions.find((p) => p.value === form.pronouns);
              return selected ? (
                <>
                  <selected.icon size={16} style={{ color: selected.color, flexShrink: 0 }} />
                  <span>{selected.label}</span>
                </>
              ) : (
                <span className="pronoun-placeholder">Select pronouns</span>
              );
            })()}
            <ChevronDown size={16} className="pronoun-chevron" />
          </button>
          {showPronounDropdown && (
            <ul className="pronoun-dropdown">
              {pronounOptions.map((opt) => (
                <li
                  key={opt.value}
                  className={form.pronouns === opt.value ? 'active' : ''}
                  onMouseDown={() => {
                    setForm({ ...form, pronouns: opt.value });
                    setShowPronounDropdown(false);
                  }}
                >
                  <opt.icon size={16} style={{ color: opt.color }} />
                  <span>{opt.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-group company-autocomplete">
          <label htmlFor="company">Company</label>
          <div className="company-input-wrapper">
            {companyDomain && (
              <span className="company-input-logo">
                <CompanyLogo name={form.company} domain={companyDomain} />
              </span>
            )}
            <input
              id="company"
              name="company"
              value={form.company}
              onChange={handleCompanyChange}
              onFocus={() => companySuggestions.length > 0 && setShowCompanyDropdown(true)}
              onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
              placeholder="Acme Inc."
              autoComplete="off"
              style={companyDomain ? { paddingLeft: 40 } : undefined}
            />
          </div>
          {showCompanyDropdown && (
            <ul className="company-dropdown">
              {companySuggestions.map((c) => (
                <li key={c.domain} onMouseDown={() => selectCompany(c)}>
                  <CompanyLogo name={c.name} domain={c.domain} />
                  <span className="company-name">{c.name}</span>
                  <span className="company-domain">{c.domain}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="role">Job Title</label>
          <input id="role" name="role" value={form.role} onChange={handleChange} placeholder="Software Engineer" />
        </div>

        <div className="form-group industry-select">
          <label>Industry</label>
          <button
            type="button"
            className="industry-trigger"
            onClick={() => setShowIndustryDropdown(!showIndustryDropdown)}
            onBlur={() => setTimeout(() => setShowIndustryDropdown(false), 200)}
          >
            {selectedIndustry ? (
              <>
                <selectedIndustry.icon size={16} style={{ color: selectedIndustry.color, flexShrink: 0 }} />
                <span>{selectedIndustry.value}</span>
              </>
            ) : (
              <span className="industry-placeholder">Select industry</span>
            )}
            <ChevronDown size={16} className="industry-chevron" />
          </button>
          {showIndustryDropdown && (
            <ul className="industry-dropdown">
              {industries.map((ind) => (
                <li
                  key={ind.value}
                  className={form.industry === ind.value ? 'active' : ''}
                  onMouseDown={() => {
                    setForm({ ...form, industry: ind.value });
                    setShowIndustryDropdown(false);
                  }}
                >
                  <ind.icon size={16} style={{ color: ind.color }} />
                  <span>{ind.value}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-group level-select">
          <label>Experience Level</label>
          <button
            type="button"
            className="level-trigger"
            onClick={() => setShowLevelDropdown(!showLevelDropdown)}
            onBlur={() => setTimeout(() => setShowLevelDropdown(false), 200)}
          >
            {selectedLevel ? (
              <span>{selectedLevel.label}</span>
            ) : (
              <span className="level-placeholder">Select level</span>
            )}
            <ChevronDown size={16} className="level-chevron" />
          </button>
          {showLevelDropdown && (
            <ul className="level-dropdown">
              {levels.map((lvl) => (
                <li
                  key={lvl.value}
                  className={form.experience_level === lvl.value ? 'active' : ''}
                  onMouseDown={() => {
                    setForm({ ...form, experience_level: lvl.value });
                    setShowLevelDropdown(false);
                  }}
                >
                  <span>{lvl.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>

      <div className="form-group full-width">
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          name="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Tell us a bit about yourself, your expertise, and what you're looking for..."
          rows={3}
        />
      </div>

      <button className="btn-primary" type="submit" disabled={saving}>
        <Save size={18} />
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}
