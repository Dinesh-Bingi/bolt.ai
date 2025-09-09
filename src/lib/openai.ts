import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || 'your-openai-api-key',
  dangerouslyAllowBrowser: true // Only for demo purposes
});

export default openai;