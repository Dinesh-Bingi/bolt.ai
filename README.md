# Legacy.ai - Immortality as a Service

A premium digital immortality platform that allows users to create AI-powered digital versions of themselves that family can interact with forever.

## Features

### Core Functionality
- **Life Story Collection**: Multi-step wizard to capture memories, experiences, and wisdom
- **AI Personality**: GPT-4 powered chatbot trained on user's life stories
- **Voice Cloning**: ElevenLabs integration for authentic voice reproduction
- **3D Holographic Avatars**: Interactive 3D avatar viewer with rotation effects
- **Memorial Pages**: Beautiful public memorial pages for family interaction
- **Digital Guestbook**: Family can leave messages, light candles, and leave flowers

### Premium Features
- **Subscription Tiers**: Free, Premium ($15/month), and Lifetime ($299)
- **Stripe Integration**: Secure payment processing with webhook handling
- **Voice Synthesis**: Real-time voice generation for AI responses
- **Advanced Privacy**: Granular privacy controls and secure data handling

### Technical Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Framer Motion
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **AI**: OpenAI GPT-4 + LangChain + Vector embeddings
- **Voice**: ElevenLabs API for voice cloning and synthesis
- **Payments**: Stripe for subscription management
- **3D Graphics**: Custom holographic avatar components

## Setup Instructions

### 1. Environment Variables
Copy `.env.example` to `.env` and fill in your API keys:

```bash
# Supabase (Click "Connect to Supabase" button in Bolt)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# D-ID (Optional)
DID_API_KEY=your_did_api_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### 2. Database Setup
The database migrations will be automatically applied when you connect to Supabase. The schema includes:
- Users and authentication
- Memory storage with vector embeddings
- Avatar and voice clone management
- Memorial pages and guestbook
- Subscription and payment tracking

### 3. Stripe Configuration
1. Create a Stripe account at https://dashboard.stripe.com
2. Get your API keys from the Developers section
3. Set up webhook endpoint: `your-app-url/functions/v1/stripe-webhook`
4. Configure webhook events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`

### 4. Third-Party APIs
- **OpenAI**: Get API key from https://platform.openai.com
- **ElevenLabs**: Get API key from https://elevenlabs.io
- **D-ID** (Optional): Get API key from https://www.d-id.com

## Usage

### For Users
1. **Sign Up**: Create account and choose subscription plan
2. **Tell Your Story**: Complete the guided life story questionnaire
3. **Upload Media**: Add photos for avatar and voice recordings for cloning
4. **Share Memorial**: Get a public link for family to visit your memorial

### For Family Members
1. **Visit Memorial**: Access the public memorial page
2. **Chat with AI**: Have conversations with the AI personality
3. **Hear Their Voice**: Listen to responses in the cloned voice
4. **Leave Tributes**: Add messages, light candles, or leave flowers

## Architecture

### Frontend Components
- `Landing.tsx`: Marketing page with pricing and features
- `Dashboard.tsx`: User dashboard for managing legacy
- `Memorial.tsx`: Public memorial page for family interaction
- `ChatInterface.tsx`: AI chat component with voice playback
- `HolographicAvatar.tsx`: 3D avatar viewer with animations
- `StepperForm.tsx`: Multi-step life story collection form

### Backend Services
- `AuthService`: User authentication and profile management
- `MemoryService`: Life story storage and AI personality training
- `VoiceService`: Voice cloning and speech synthesis
- `AvatarService`: Avatar creation and management
- `PaymentService`: Stripe integration and subscription handling
- `GuestbookService`: Memorial tribute management

### Database Schema
- **users**: User profiles and subscription data
- **memories**: Life stories and experiences
- **memory_embeddings**: Vector embeddings for AI search
- **avatars**: Avatar images and metadata
- **voice_clones**: ElevenLabs voice clone data
- **memorials**: Public memorial page configuration
- **guestbook**: Family tributes and messages
- **subscriptions**: Payment and subscription tracking

## Security & Privacy
- Row Level Security (RLS) enabled on all tables
- Encrypted data storage with Supabase
- Secure file uploads with access controls
- GDPR compliant data handling
- Optional private memorial pages

## Deployment
The application is designed to work seamlessly with:
- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: Supabase (handles all backend infrastructure)
- **Edge Functions**: Automatically deployed to Supabase
- **Database**: Managed PostgreSQL with Supabase

## Support
For technical support or feature requests, contact the development team or refer to the documentation for each integrated service.