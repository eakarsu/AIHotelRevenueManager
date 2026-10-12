import FormattedAIReport from './FormattedAIReport';

const titles = {
  pricing: 'Pricing Analysis',
  channels: 'Channel Optimization',
  personalization: 'Guest Personalization',
  upsells: 'Upsell Recommendations',
  sentiment: 'Sentiment Analysis',
};

export default function AIResultDisplay({ data, result, type = 'pricing' }) {
  const response = data ?? result;
  if (response === null || response === undefined) return null;
  return <FormattedAIReport response={response} title={titles[type] || 'AI analysis'} />;
}
