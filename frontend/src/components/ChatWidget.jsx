import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Send, Bot, UserIcon, Sparkles, CheckCircle, AlertCircle,
  User, Building2, Briefcase, FileText, Factory, TrendingUp, UserCircle, BadgeCheck,
  RotateCcw,
} from 'lucide-react';

const FIELD_META = {
  name:             { label: 'Name',       icon: User },
  pronouns:         { label: 'Pronouns',   icon: UserCircle },
  email:            { label: 'Email',       icon: null },
  company:          { label: 'Company',     icon: Building2 },
  role:             { label: 'Role',        icon: Briefcase },
  bio:              { label: 'Bio',         icon: FileText },
  industry:         { label: 'Industry',    icon: Factory },
  experience_level: { label: 'Experience',  icon: TrendingUp },
};

function ProfileTracker({ user }) {
  if (!user) return null;

  const fields = Object.entries(FIELD_META).map(([key, meta]) => ({
    key,
    ...meta,
    filled: !!user[key],
  }));

  const filledCount = fields.filter((f) => f.filled).length;
  const pct = Math.round((filledCount / fields.length) * 100);

  return (
    <div className="chat-profile-tracker">
      <div className="tracker-header">
        <span className="tracker-title">Profile Progress</span>
        <span className="tracker-pct">{pct}%</span>
      </div>
      <div className="tracker-bar">
        <div className="tracker-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="tracker-fields">
        {fields.map((f) => (
          <span key={f.key} className={`tracker-field ${f.filled ? 'filled' : ''}`}>
            {f.filled ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
            {f.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function FieldUpdatedBadge({ fields }) {
  if (!fields || fields.length === 0) return null;
  const labels = fields.map((f) => FIELD_META[f]?.label || f);
  return (
    <div className="field-updated-badge">
      <BadgeCheck size={14} />
      <span>Updated: {labels.join(', ')}</span>
    </div>
  );
}

export default function ChatWidget() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [lastUpdatedFields, setLastUpdatedFields] = useState([]);
  const messagesEndRef = useRef(null);
  const greetingSent = useRef(false);
  const inputRef = useRef(null);
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    chatAPI
      .getHistory()
      .then((res) => {
        setMessages(res.data);
        if (res.data.length === 0 && !greetingSent.current) {
          greetingSent.current = true;
          sendInitialGreeting();
        }
      })
      .catch(() => toast.error('Failed to load chat history'))
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendInitialGreeting = async () => {
    setSending(true);
    try {
      const res = await chatAPI.sendMessage("Hi! I just signed up and I'd like help completing my profile.");
      setMessages(res.data.messages);
      if (res.data.profile_updated) {
        setLastUpdatedFields(res.data.updated_fields);
      }
      await refreshUser();
    } catch {
      toast.error('Failed to start conversation. Please try sending a message.');
    } finally {
      setSending(false);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || sending) return;

    setInput('');
    setSending(true);
    setLastUpdatedFields([]);

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: 'user', content: text, created_at: new Date().toISOString() },
    ]);

    try {
      const res = await chatAPI.sendMessage(text);
      setMessages(res.data.messages);

      if (res.data.profile_updated) {
        setLastUpdatedFields(res.data.updated_fields);
        toast.success(`Profile updated: ${res.data.updated_fields.map(f => FIELD_META[f]?.label || f).join(', ')}`);
      }

      await refreshUser();
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handlePromptClick = (prompt) => {
    setInput(prompt);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleNewChat = async () => {
    if (sending) return;
    try {
      await chatAPI.clearHistory();
      setMessages([]);
      setLastUpdatedFields([]);
      greetingSent.current = false;
      toast.success('Chat cleared');
    } catch {
      toast.error('Failed to clear chat');
    }
  };

  const suggestedPrompts = [
    "Help me complete my profile",
    "What information do I still need?",
    "Can you suggest a good bio for me?",
    "What industry should I choose?",
  ];

  return (
    <div className="chat-widget">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-bot-avatar">
            <Sparkles size={20} />
          </div>
          <div>
            <h3>AI Profile Assistant</h3>
            <span className="chat-status">
              {sending ? 'Thinking...' : 'Ready to help'}
            </span>
          </div>
        </div>
        {messages.length > 0 && (
          <button className="btn-new-chat" onClick={handleNewChat} title="New conversation">
            <RotateCcw size={16} />
            <span>New Chat</span>
          </button>
        )}
      </div>

      <ProfileTracker user={user} />

      <div className="chat-messages">
        {loadingHistory ? (
          <div className="chat-loading">
            <div className="chat-loading-dots">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
            <span>Loading conversation...</span>
          </div>
        ) : messages.length === 0 && !sending ? (
          <div className="chat-empty">
            <Bot size={48} />
            <h4>Start a conversation</h4>
            <p>Ask the AI assistant to help you complete your profile</p>
            <div className="suggested-prompts">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  className="suggested-prompt"
                  onClick={() => handlePromptClick(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isLastAssistant =
                msg.role === 'assistant' && idx === messages.length - 1;
              return (
                <div key={msg.id} className={`chat-message ${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === 'assistant' ? <Bot size={16} /> : <UserIcon size={16} />}
                  </div>
                  <div className="message-content">
                    <div className="message-bubble">
                      {msg.role === 'assistant' ? (
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p>{children}</p>,
                            strong: ({ children }) => <strong>{children}</strong>,
                            ul: ({ children }) => <ul>{children}</ul>,
                            ol: ({ children }) => <ol>{children}</ol>,
                            li: ({ children }) => <li>{children}</li>,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                    {isLastAssistant && lastUpdatedFields.length > 0 && (
                      <FieldUpdatedBadge fields={lastUpdatedFields} />
                    )}
                    <span className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="chat-message assistant">
                <div className="message-avatar">
                  <Bot size={16} />
                </div>
                <div className="message-content">
                  <div className="message-bubble typing">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length > 0 && !sending && (
        <div className="suggested-prompts-inline">
          {suggestedPrompts.slice(0, 2).map((prompt, i) => (
            <button
              key={i}
              className="suggested-prompt small"
              onClick={() => handlePromptClick(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
