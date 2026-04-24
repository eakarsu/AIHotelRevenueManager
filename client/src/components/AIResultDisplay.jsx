import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star,
  Lightbulb,
  Target,
  BarChart3,
} from 'lucide-react';

function getScoreClass(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'average';
  return 'poor';
}

function StarRating({ rating, max = 5 }) {
  return (
    <div className="ai-stars">
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={18}
          className={`ai-star${i < Math.round(rating) ? '' : ' empty'}`}
          fill={i < Math.round(rating) ? '#f59e0b' : 'none'}
        />
      ))}
      <span style={{ marginLeft: 8, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        {rating?.toFixed?.(1) || rating}
      </span>
    </div>
  );
}

function MetricsSection({ metrics }) {
  if (!metrics || (!Array.isArray(metrics) && typeof metrics !== 'object')) return null;

  const items = Array.isArray(metrics)
    ? metrics
    : Object.entries(metrics).map(([key, value]) => ({
        label: key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim(),
        value: value,
      }));

  const colors = ['blue', 'green', 'purple', 'yellow', 'red'];

  return (
    <div className="ai-metrics">
      {items.slice(0, 5).map((item, i) => (
        <div key={i} className={`ai-metric ${colors[i % colors.length]}`}>
          <div className="ai-metric-value">
            {typeof item.value === 'number'
              ? item.value % 1 !== 0
                ? item.value.toFixed(1)
                : item.value
              : item.value}
          </div>
          <div className="ai-metric-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function RecommendationsSection({ recommendations }) {
  if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) return null;

  return (
    <div className="ai-recommendations">
      <h4>
        <Lightbulb size={16} />
        Recommendations
      </h4>
      {recommendations.map((rec, i) => (
        <div key={i} className="ai-recommendation-item">
          <div className="ai-recommendation-number">{i + 1}</div>
          <div className="ai-recommendation-text">
            <p>{typeof rec === 'string' ? rec : rec.text || rec.recommendation || rec.message || JSON.stringify(rec)}</p>
            {rec.impact && <span>Impact: {rec.impact}</span>}
            {rec.priority && <span> | Priority: {rec.priority}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScoresSection({ scores }) {
  if (!scores || typeof scores !== 'object') return null;

  const items = Array.isArray(scores)
    ? scores
    : Object.entries(scores).map(([key, value]) => ({
        label: key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim(),
        score: typeof value === 'number' ? value : parseFloat(value) || 0,
      }));

  return (
    <div className="ai-scores">
      {items.map((item, i) => {
        const score = typeof item.score === 'number' ? item.score : (typeof item.value === 'number' ? item.value : 0);
        const displayScore = score > 1 ? score : Math.round(score * 100);
        return (
          <div key={i} className="ai-score-item">
            <div className="ai-score-label">
              <span>{item.label || item.name}</span>
              <span>{displayScore}%</span>
            </div>
            <div className="ai-score-bar">
              <div
                className={`ai-score-fill ${getScoreClass(displayScore)}`}
                style={{ width: `${Math.min(displayScore, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SentimentSections({ sentiment }) {
  if (!sentiment) return null;

  const sections = [];

  if (sentiment.positive || sentiment.strengths || sentiment.pros) {
    const items = sentiment.positive || sentiment.strengths || sentiment.pros;
    sections.push(
      <div key="pos" className="ai-section positive">
        <h4>
          <CheckCircle size={16} />
          Strengths
        </h4>
        {Array.isArray(items) ? (
          <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
        ) : (
          <p>{items}</p>
        )}
      </div>
    );
  }

  if (sentiment.warnings || sentiment.concerns || sentiment.neutral) {
    const items = sentiment.warnings || sentiment.concerns || sentiment.neutral;
    sections.push(
      <div key="warn" className="ai-section warning">
        <h4>
          <AlertTriangle size={16} />
          Areas of Concern
        </h4>
        {Array.isArray(items) ? (
          <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
        ) : (
          <p>{items}</p>
        )}
      </div>
    );
  }

  if (sentiment.negative || sentiment.weaknesses || sentiment.cons) {
    const items = sentiment.negative || sentiment.weaknesses || sentiment.cons;
    sections.push(
      <div key="neg" className="ai-section negative">
        <h4>
          <XCircle size={16} />
          Weaknesses
        </h4>
        {Array.isArray(items) ? (
          <ul>{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
        ) : (
          <p>{items}</p>
        )}
      </div>
    );
  }

  return sections.length > 0 ? <>{sections}</> : null;
}

const typeConfig = {
  pricing: { icon: TrendingUp, title: 'Pricing Analysis', subtitle: 'AI-powered pricing recommendations' },
  channels: { icon: BarChart3, title: 'Channel Optimization', subtitle: 'Distribution channel insights' },
  personalization: { icon: Target, title: 'Guest Personalization', subtitle: 'Tailored guest experience suggestions' },
  upsells: { icon: Sparkles, title: 'Upsell Recommendations', subtitle: 'Revenue maximization opportunities' },
  sentiment: { icon: Star, title: 'Sentiment Analysis', subtitle: 'Review sentiment breakdown' },
};

export default function AIResultDisplay({ data, type = 'pricing' }) {
  if (!data) return null;

  const config = typeConfig[type] || typeConfig.pricing;
  const IconComponent = config.icon;

  // Try to extract structured data from various response shapes
  const analysis = data.analysis || data.result || data.data || data;
  const metrics = analysis.metrics || analysis.summary || analysis.keyMetrics || analysis.stats;
  const recommendations = analysis.recommendations || analysis.suggestions || analysis.actions || analysis.tips;
  const scores = analysis.scores || analysis.ratings || analysis.breakdown;
  const sentiment = analysis.sentiment || analysis.sections || analysis.analysis;
  const rating = analysis.rating || analysis.score || analysis.overallScore || analysis.overall_score;
  const summary = analysis.summary_text || analysis.overview || analysis.description;

  return (
    <div className="ai-result">
      <div className="ai-result-header">
        <div className="ai-result-header-icon">
          <IconComponent size={20} />
        </div>
        <div>
          <h3>{config.title}</h3>
          <p>{config.subtitle}</p>
        </div>
      </div>

      {typeof rating === 'number' && (
        <div style={{ marginBottom: 20 }}>
          <StarRating rating={rating > 5 ? rating / 20 : rating} />
        </div>
      )}

      {typeof summary === 'string' && (
        <div className="ai-section neutral" style={{ marginBottom: 16 }}>
          <p>{summary}</p>
        </div>
      )}

      <MetricsSection metrics={metrics} />
      <ScoresSection scores={scores} />
      <RecommendationsSection recommendations={recommendations} />
      <SentimentSections sentiment={typeof sentiment === 'object' && !Array.isArray(sentiment) ? sentiment : null} />

      {/* Fallback: render any remaining string or simple data */}
      {typeof analysis === 'string' && (
        <div className="ai-section neutral">
          <p>{analysis}</p>
        </div>
      )}
    </div>
  );
}
