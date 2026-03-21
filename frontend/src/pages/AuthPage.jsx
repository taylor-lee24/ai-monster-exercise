import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Building2, Briefcase, Lock, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';

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

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '', company: '', role: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const companyDebounceRef = useRef(null);
  const companyCacheRef = useRef({});
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => clearTimeout(companyDebounceRef.current);
  }, []);

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const passwordRules = [
    { key: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
    { key: 'uppercase', label: 'One uppercase letter (A-Z)', test: (pw) => /[A-Z]/.test(pw) },
    { key: 'lowercase', label: 'One lowercase letter (a-z)', test: (pw) => /[a-z]/.test(pw) },
    { key: 'number', label: 'One number (0-9)', test: (pw) => /[0-9]/.test(pw) },
    { key: 'symbol', label: 'One symbol (!@#$%...)', test: (pw) => /[^a-zA-Z0-9]/.test(pw) },
  ];

  const validatePassword = (password) => passwordRules.every((rule) => rule.test(password));

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    }
  };

  const handleBlur = (e) => {
    if (e.target.name === 'email' && form.email && !validateEmail(form.email)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email address (e.g., name@gmail.com)' }));
    }
    if (e.target.name === 'password' && !isLogin && form.password && !validatePassword(form.password)) {
      setErrors((prev) => ({ ...prev, password: 'Password does not meet all requirements' }));
    }
  };

  const handleCompanyChange = (e) => {
    const value = e.target.value;
    setForm({ ...form, company: value });

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
    setCompanySuggestions([]);
    setShowCompanyDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!validateEmail(form.email)) {
      setErrors({ email: 'Please enter a valid email address (e.g., name@gmail.com)' });
      return;
    }

    if (!isLogin && !validatePassword(form.password)) {
      setErrors({ password: 'Password does not meet all requirements' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : { ...form };
      const res = isLogin
        ? await authAPI.login(payload)
        : await authAPI.signup(payload);

      login(res.data.access_token, res.data.user);
      toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.detail || 'Something went wrong';
      toast.error(message);
      if (isLogin) {
        setErrors({ login: message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="brand-icon">
            <Sparkles size={32} />
          </div>
          <h1>ProConnect</h1>
          <p>Your AI-powered professional networking platform</p>
        </div>
        <div className="auth-features">
          <div className="feature">
            <div className="feature-dot" />
            <span>AI assistant to complete your profile</span>
          </div>
          <div className="feature">
            <div className="feature-dot" />
            <span>Smart content recommendations</span>
          </div>
          <div className="feature">
            <div className="feature-dot" />
            <span>Personalized professional resources</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p className="auth-subtitle">
            {isLogin
              ? 'Sign in to access your dashboard'
              : 'Join the platform and let AI guide your journey'}
          </p>

          {!isLogin && (
            <>
              <div className="input-group">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group company-autocomplete">
                <Building2 size={18} className="input-icon" />
                <input
                  type="text"
                  name="company"
                  placeholder="Company"
                  value={form.company}
                  onChange={handleCompanyChange}
                  onFocus={() => companySuggestions.length > 0 && setShowCompanyDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
                  autoComplete="off"
                />
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
              <div className="input-group">
                <Briefcase size={18} className="input-icon" />
                <input
                  type="text"
                  name="role"
                  placeholder="Job title"
                  value={form.role}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="input-group">
            <Mail size={18} className="input-icon" />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="input-group">
            <Lock size={18} className="input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder={isLogin ? 'Password' : 'Create a strong password'}
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              minLength={isLogin ? 1 : 8}
              className={errors.password ? 'input-error' : ''}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          {!isLogin && form.password && (
            <ul className="password-rules">
              {passwordRules.map((rule) => (
                <li key={rule.key} className={rule.test(form.password) ? 'rule-pass' : 'rule-fail'}>
                  <span className="rule-icon">{rule.test(form.password) ? '✓' : '✗'}</span>
                  {rule.label}
                </li>
              ))}
            </ul>
          )}

          {errors.login && (
            <div className="login-error">
              <span className="login-error-icon">!</span>
              {errors.login}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            {!submitting && <ArrowRight size={18} />}
          </button>

          <p className="auth-switch">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" onClick={() => {
              setIsLogin(!isLogin);
              setForm({ email: '', password: '', name: '', company: '', role: '' });
              setErrors({});
              setCompanySuggestions([]);
              setShowCompanyDropdown(false);
              setShowPassword(false);
            }}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
