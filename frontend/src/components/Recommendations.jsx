import { useState, useEffect } from 'react';
import { recommendAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BookOpen, ExternalLink, Tag, RefreshCw, Lightbulb, AlertTriangle } from 'lucide-react';

export default function Recommendations() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await recommendAPI.get();
      setData(res.data);
    } catch {
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="recommendations loading">
        <div className="spinner" />
        <p>Finding articles for you...</p>
      </div>
    );
  }

  const profileIncomplete = !user?.role && !user?.industry;

  return (
    <div className="recommendations">
      <div className="rec-header">
        <div>
          <h2>
            <BookOpen size={24} />
            Recommended for You
          </h2>
          {data?.reasoning && (
            <p className="rec-reasoning">
              <Lightbulb size={16} />
              {data.reasoning}
            </p>
          )}
        </div>
        <button className="btn-ghost" onClick={fetchRecommendations}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {profileIncomplete && (
        <div className="rec-warning">
          <AlertTriangle size={18} />
          <span>
            Complete your profile (role, industry) for better recommendations.
            Try the <strong>AI Assistant</strong> tab for help!
          </span>
        </div>
      )}

      {data?.articles?.length === 0 ? (
        <div className="rec-empty">
          <BookOpen size={48} />
          <h3>No recommendations yet</h3>
          <p>Complete your profile to get personalized article suggestions.</p>
        </div>
      ) : (
        <div className="rec-grid">
          {data?.articles?.map((article) => (
            <article key={article.id} className="rec-card">
              <div className="rec-card-category">{article.category}</div>
              <h3>{article.title}</h3>
              <p>{article.summary}</p>
              <div className="rec-card-tags">
                {article.tags.map((tag) => (
                  <span key={tag.id} className="tag">
                    <Tag size={12} />
                    {tag.name}
                  </span>
                ))}
              </div>
              <div className="rec-card-footer">
                {article.author && <span className="rec-author">By {article.author}</span>}
                {article.url && (
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="rec-link">
                    Read more <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
