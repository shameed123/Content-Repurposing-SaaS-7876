import axios from 'axios';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || 'your-openrouter-key';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export const AVAILABLE_MODELS = {
  'gpt-4': {
    name: 'GPT-4',
    provider: 'OpenAI',
    costPer1k: 0.03,
    description: 'Most capable model, best for complex repurposing'
  },
  'claude-3-sonnet': {
    name: 'Claude 3 Sonnet',
    provider: 'Anthropic',
    costPer1k: 0.015,
    description: 'Great balance of capability and cost'
  },
  'mistral-large': {
    name: 'Mistral Large',
    provider: 'Mistral',
    costPer1k: 0.008,
    description: 'Fast and cost-effective for most tasks'
  }
};

export const OUTPUT_FORMATS = {
  'twitter-thread': {
    name: 'Twitter Thread',
    description: 'Engaging thread with hooks and CTAs',
    icon: 'twitter',
    maxLength: '280 chars per tweet'
  },
  'linkedin-post': {
    name: 'LinkedIn Post',
    description: 'Professional post with engagement hooks',
    icon: 'linkedin',
    maxLength: '3000 characters'
  },
  'instagram-caption': {
    name: 'Instagram Caption',
    description: 'Visual-focused caption with hashtags',
    icon: 'instagram',
    maxLength: '2200 characters'
  },
  'email-newsletter': {
    name: 'Email Newsletter',
    description: 'Structured newsletter with sections',
    icon: 'mail',
    maxLength: 'No limit'
  },
  'youtube-script': {
    name: 'YouTube Script',
    description: 'Engaging video script with timestamps',
    icon: 'youtube',
    maxLength: 'No limit'
  },
  'blog-summary': {
    name: 'Blog Summary',
    description: 'Concise summary with key points',
    icon: 'file-text',
    maxLength: '500 words'
  }
};

export const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-appropriate' },
  { value: 'casual', label: 'Casual', description: 'Friendly and conversational' },
  { value: 'engaging', label: 'Engaging', description: 'Attention-grabbing and dynamic' },
  { value: 'educational', label: 'Educational', description: 'Informative and instructional' },
  { value: 'humorous', label: 'Humorous', description: 'Light-hearted and entertaining' },
  { value: 'inspirational', label: 'Inspirational', description: 'Motivating and uplifting' }
];

class OpenRouterAPI {
  constructor() {
    this.apiKey = OPENROUTER_API_KEY;
    this.baseUrl = OPENROUTER_BASE_URL;
  }

  async generateContent(originalContent, format, tone, model = 'claude-3-sonnet') {
    try {
      const prompt = this.buildPrompt(originalContent, format, tone);
      
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert content repurposing assistant. Create engaging, high-quality content that maintains the core message while adapting it perfectly for the target format and tone.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Content Repurposing Engine'
          }
        }
      );

      return {
        content: response.data.choices[0].message.content,
        tokensUsed: response.data.usage?.total_tokens || 0,
        model: model
      };
    } catch (error) {
      console.error('OpenRouter API Error:', error);
      throw new Error('Failed to generate content. Please try again.');
    }
  }

  buildPrompt(originalContent, format, tone) {
    const formatInfo = OUTPUT_FORMATS[format];
    const basePrompt = `
Please repurpose the following content into a ${formatInfo.name.toLowerCase()}.

Original Content:
${originalContent}

Requirements:
- Format: ${formatInfo.description}
- Tone: ${tone}
- Max Length: ${formatInfo.maxLength}
- Maintain the core message and key insights
- Make it engaging and platform-appropriate
- Include relevant calls-to-action where appropriate

Additional Guidelines:
${this.getFormatSpecificGuidelines(format)}

Please provide only the repurposed content, ready to use.
`;

    return basePrompt.trim();
  }

  getFormatSpecificGuidelines(format) {
    const guidelines = {
      'twitter-thread': `
- Start with a compelling hook
- Use numbered tweets (1/n format)
- Keep each tweet under 280 characters
- End with a call-to-action
- Use relevant hashtags sparingly`,
      
      'linkedin-post': `
- Start with a professional hook
- Use line breaks for readability
- Include 3-5 relevant hashtags at the end
- Add a call-to-action for engagement`,
      
      'instagram-caption': `
- Start with an engaging hook
- Use emojis strategically
- Include 10-15 relevant hashtags
- Add a clear call-to-action`,
      
      'email-newsletter': `
- Include a compelling subject line
- Use clear sections with headers
- Add a personal touch
- Include actionable takeaways`,
      
      'youtube-script': `
- Include intro, main content, and outro
- Add timestamps for key sections
- Include engagement prompts
- End with subscribe CTA`,
      
      'blog-summary': `
- Start with a compelling introduction
- Use bullet points for key insights
- Include actionable takeaways
- End with a conclusion`
    };

    return guidelines[format] || '';
  }
}

export const openRouterAPI = new OpenRouterAPI();