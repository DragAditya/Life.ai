# Life.AI - Your Memories, Your Life, Fully Yours

<div align="center">
  <img src="https://via.placeholder.com/150x150/3B82F6/ffffff?text=Life.AI" alt="Life.AI Logo" width="150" height="150">
  
  <h3>A smart, open-source personal memory system</h3>
  
  <p>
    <strong>Privacy-first • AI-powered • Open Source • Fully Yours</strong>
  </p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg)](https://vitejs.dev/)
  [![Supabase](https://img.shields.io/badge/Supabase-Ready-green.svg)](https://supabase.com/)
</div>

---

## 🌟 What is Life.AI?

Life.AI is a smart, **open-source personal memory system** that works like a super clever diary + AI friend. You can talk, type, or upload photos (text-only via OCR) → AI remembers the important stuff → saves it securely → you can recall or delete anytime → auto-backups so you always own your data.

### ⭐ Key Philosophy
- **100% ONLINE** - Works on Render, Vercel, or any cloud platform
- **Privacy-First** - Your data belongs to YOU, not us
- **Open Source** - Fork it, modify it, host it yourself
- **BYO API Keys** - Bring Your Own keys, no vendor lock-in
- **Zero Big Files** - Images → OCR → text → delete image (keeps costs low)

---

## 🧩 Core Features

### ✅ 1) Smart Memory Logging
- **Text, voice, or image input** - All input types supported
- **AI filtering** - Only saves meaningful memories, ignores chit-chat
- **Example**: "I went shopping with Samu, she bought bras & panties." → AI saves event, people, items, timestamp

### ✅ 2) Natural Recall
- **Conversational search**: "What did I do with Samu in July?"
- **Multi-modal search**: Postgres + knowledge graph + vector search
- **Precise results**: Shows exact date, time, and related info

### ✅ 3) Timeline View
- **Life map**: Memories sorted by day/week/month/year
- **Visual timeline**: See your entire life story
- **Interactive**: Click to explore, filter by people/places/events

### ✅ 4) Knowledge Graph
- **Smart connections**: People → Events → Places → Memories
- **Visual exploration**: Click through nodes to see relationships
- **Pattern recognition**: Discover hidden connections in your life

### ✅ 5) Forget & Delete
- **One-click forget**: "Forget everything" or "Forget my trip with Samu"
- **Smart deletion**: AI identifies and removes all related data
- **Graph cleanup**: No broken links or orphaned data

### ✅ 6) Automatic Backups
- **Google Drive integration**: Auto-backup to your personal Drive
- **Email backups**: Optional ZIP files to your Gmail
- **Manual downloads**: JSON, CSV, or PDF exports anytime

### ✅ 7) Zero File Storage
- **OCR pipeline**: Image → Text → Delete image
- **Cost efficient**: Keeps Supabase free tier usage minimal
- **Privacy focused**: No personal images stored anywhere

### ✅ 8) Voice Input
- **Web Speech API**: Talk naturally to your AI
- **Real-time transcription**: Speech becomes text instantly
- **Same AI pipeline**: Voice gets same smart processing

---

## 🗄️ Tech Stack

### Frontend
- **React 18** + **Vite 5** - Modern, fast development
- **Tailwind CSS** + **shadcn/ui** - Beautiful, responsive design
- **Zustand** - Simple, powerful state management
- **React Router** - Client-side routing

### Backend & Database
- **Supabase** - Postgres DB + Auth + Storage + Real-time
- **Row-Level Security (RLS)** - Your data stays private
- **Real-time subscriptions** - Live updates across devices

### AI & Integrations
- **Gemini API** - Google's latest AI model (user's own key)
- **Tesseract.js** - In-browser OCR processing
- **Web Speech API** - Voice input recognition
- **Google Drive API** - Personal backup integration

### Deployment
- **Render.com** or **Vercel** - One-click serverless deployment
- **Zero server management** - Fully API-based architecture
- **Environment variables** - Secure configuration

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/pnpm/yarn
- Google account (for OAuth)
- Supabase account (free tier)
- Gemini API key (free tier available)

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/life-ai.git
cd life-ai
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env` and fill in your keys:

```bash
cp .env.example .env
```

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key_here

# Google Gemini AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio

# Google Drive Backup Configuration (Optional)
VITE_GOOGLE_DRIVE_CLIENT_ID=your_google_oauth_client_id
VITE_GOOGLE_DRIVE_CLIENT_SECRET=your_google_oauth_client_secret

# App Configuration
VITE_APP_URL=http://localhost:3000
VITE_APP_NAME=Life.AI
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start creating memories!

---

## 🔑 Getting Your API Keys

### Supabase Setup (Free)
1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project
3. Go to **Settings → API** and copy:
   - Project URL → `VITE_SUPABASE_URL`
   - anon public key → `VITE_SUPABASE_ANON_KEY`
4. Go to **Authentication → Providers → Google** and enable it
5. Set up the database schema (see Database Setup below)

### Gemini API Key (Free Tier Available)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Create new API key
4. Copy key → `VITE_GEMINI_API_KEY`

### Google Drive Backup (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google Drive API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Copy Client ID and Secret

---

## 🗃️ Database Setup

### Required Tables

Create these tables in your Supabase dashboard:

#### 1. Memories Table
```sql
CREATE TABLE memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  people TEXT[] DEFAULT '{}',
  places TEXT[] DEFAULT '{}',
  events TEXT[] DEFAULT '{}',
  sentiment VARCHAR(20) DEFAULT 'neutral',
  confidence FLOAT DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own memories
CREATE POLICY "Users can manage their own memories" ON memories
  FOR ALL USING (auth.uid() = user_id);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE memories;
```

#### 2. Graph Edges Table
```sql
CREATE TABLE graph_edges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_node TEXT NOT NULL,
  target_node TEXT NOT NULL,
  edge_type VARCHAR(50) NOT NULL,
  weight FLOAT DEFAULT 1.0,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own edges
CREATE POLICY "Users can manage their own graph edges" ON graph_edges
  FOR ALL USING (auth.uid() = user_id);
```

#### 3. User Settings Table
```sql
CREATE TABLE user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  date_format VARCHAR(20) DEFAULT 'MM/dd/yyyy',
  auto_backup BOOLEAN DEFAULT true,
  backup_frequency VARCHAR(20) DEFAULT 'weekly',
  drive_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own settings
CREATE POLICY "Users can manage their own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);
```

### Indexes for Performance
```sql
-- Memories table indexes
CREATE INDEX idx_memories_user_created ON memories(user_id, created_at DESC);
CREATE INDEX idx_memories_content_search ON memories USING gin(to_tsvector('english', content));
CREATE INDEX idx_memories_tags ON memories USING gin(tags);
CREATE INDEX idx_memories_people ON memories USING gin(people);

-- Graph edges indexes  
CREATE INDEX idx_graph_edges_user ON graph_edges(user_id);
CREATE INDEX idx_graph_edges_source ON graph_edges(source_node);
CREATE INDEX idx_graph_edges_target ON graph_edges(target_node);
```

---

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── ChatInput.jsx    # Message input with voice/image
│   ├── TimelineView.jsx # Memory timeline display
│   ├── MemoryCard.jsx   # Individual memory cards
│   ├── GraphView.jsx    # Knowledge graph visualization
│   └── BackupSettings.jsx # Backup configuration
├── stores/              # Zustand state management
│   ├── useAuthStore.js      # Authentication state
│   ├── useChatStore.js      # Chat & messages
│   ├── useMemoryStore.js    # Memory CRUD operations
│   ├── useGraphStore.js     # Knowledge graph data
│   ├── useSettingsStore.js  # User preferences
│   └── useAnalyticsStore.js # Usage analytics
├── lib/                 # Core integrations
│   ├── supabaseClient.js    # Supabase setup & helpers
│   ├── geminiApi.js         # Gemini AI integration
│   ├── ocrUtils.js          # Tesseract.js OCR processing
│   ├── driveBackup.js       # Google Drive backups
│   └── utils.js             # Utility functions
├── pages/               # Main application pages
│   ├── index.jsx        # Chat interface (main page)
│   ├── timeline.jsx     # Timeline view
│   ├── graph.jsx        # Knowledge graph page
│   └── settings.jsx     # Settings & preferences
└── styles/
    ├── globals.css      # Global styles & CSS variables
    └── tailwind.config.js # Tailwind configuration
```

---

## 🚀 Deployment

### Deploy to Render (Recommended)

1. **Fork this repository** to your GitHub account

2. **Connect to Render**:
   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repo

3. **Configure Environment**:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview`
   - Add all environment variables from your `.env` file

4. **Deploy**: Click "Create Web Service"

### Deploy to Vercel (Alternative)

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
vercel --prod
```

3. **Add Environment Variables**:
   - Go to Vercel dashboard
   - Project Settings → Environment Variables
   - Add all variables from `.env`

### Deploy to Netlify

1. **Build the project**:
```bash
npm run build
```

2. **Deploy**:
   - Drag `dist` folder to [netlify.com/drop](https://app.netlify.com/drop)
   - Or connect GitHub repo for automatic deployments

---

## 🔒 Security & Privacy

### Built-in Security Features
- **Row-Level Security (RLS)** - Database-level privacy protection
- **Google OAuth** - Secure authentication via Supabase
- **API key isolation** - Each user brings their own keys
- **Client-side encryption** (optional) - Extra privacy layer
- **No file storage** - Images deleted after OCR processing

### Privacy Guarantees
- ✅ **Your data belongs to YOU** - stored in your Supabase instance
- ✅ **No tracking or analytics** - unless you enable them
- ✅ **Open source** - fully auditable code
- ✅ **Right to be forgotten** - delete everything with one click
- ✅ **GDPR compliant** - by design

### Data Flow
1. User logs in → Google OAuth → Supabase creates user row
2. User chats → AI processes → saves to YOUR database
3. OCR processes images → extracts text → deletes image immediately
4. Backups go to YOUR Google Drive or email
5. All API calls use YOUR keys

---

## 💡 Usage Examples

### Smart Memory Logging
```
You: "I went to Goa beach with Aditi on 5th May, watched sunset."

AI Response: "That sounds like a beautiful evening! I've saved this memory for you."

Stored Data:
- Who: User, Aditi
- Where: Goa beach  
- What: sunset watching, beach trip
- When: May 5th, 2025
- Sentiment: Positive
- Tags: beach, sunset, vacation, friends
```

### Natural Recall
```
You: "What did I do with Aditi last month?"

AI Response: "Here's what I remember about your time with Aditi:
• May 5th - Goa beach sunset watching
• May 12th - Coffee at Central Perk
• May 20th - Movie night at home"
```

### Smart Forget
```
You: "Forget my trip to Goa"

AI Response: "I've forgotten 3 memories related to your Goa trip, including the beach sunset with Aditi."

Result: All Goa-related memories + graph connections removed
```

---

## 🛠️ Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production  
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Key Development Tips

1. **State Management**: Each Zustand store handles a specific domain
2. **Error Handling**: All API calls return `{ success, data, error }` format
3. **Loading States**: Components show loading spinners during async operations
4. **Offline Support**: Basic offline functionality with local storage
5. **Real-time Updates**: Supabase subscriptions keep data in sync

### Adding New Features

1. **New Memory Type**: Extend `geminiApi.js` prompt templates
2. **New Backup Provider**: Create new file in `lib/` following `driveBackup.js` pattern  
3. **New Graph Visualization**: Extend `GraphView.jsx` with new rendering modes
4. **New Analytics**: Add metrics to `useAnalyticsStore.js`

---

## 📊 Analytics & Insights

Life.AI includes optional analytics to help you understand your memory patterns:

- **Memory frequency**: How often you create memories
- **Sentiment tracking**: Emotional patterns over time
- **Social connections**: Who you spend time with most
- **Location patterns**: Your favorite places
- **Time patterns**: When you're most active

All analytics are:
- ✅ **Completely private** - processed in your browser
- ✅ **Optional** - can be disabled in settings
- ✅ **Local only** - never sent to external services

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Areas We Need Help
- 🌍 **Internationalization** - Multi-language support
- 📱 **Mobile app** - React Native version
- 🔌 **Integrations** - Calendar, fitness trackers, social media
- 🎨 **Themes** - Additional UI themes
- 🧠 **AI Models** - Support for other LLM providers
- 📈 **Analytics** - Advanced insight algorithms

### Development Setup
```bash
git clone https://github.com/yourusername/life-ai.git
cd life-ai
npm install
cp .env.example .env
# Add your API keys to .env
npm run dev
```

---

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.

This means you can:
- ✅ Use it commercially
- ✅ Modify it freely  
- ✅ Distribute it
- ✅ Host it privately
- ✅ Sell hosted versions

**But you must include the original copyright notice.**

---

## 🆘 Support & Community

### Getting Help
- 📖 **Documentation**: This README + inline code comments
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/yourusername/life-ai/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/life-ai/discussions)
- 💡 **Feature Requests**: [GitHub Issues](https://github.com/yourusername/life-ai/issues) with `enhancement` label

### Community
- 🌟 **Star the repo** if you find it useful
- 🍴 **Fork it** to create your own version
- 📢 **Share it** with friends who value privacy
- 🤝 **Contribute** to make it better for everyone

---

## 🔮 Roadmap

### v1.1 - Mobile & Sync
- [ ] Progressive Web App (PWA) support
- [ ] Cross-device sync improvements
- [ ] Mobile-optimized interface
- [ ] Offline-first architecture

### v1.2 - Enhanced AI
- [ ] Multiple LLM provider support (OpenAI, Anthropic, etc.)
- [ ] Custom AI personas
- [ ] Memory summarization features
- [ ] Automated memory categorization

### v1.3 - Integrations
- [ ] Calendar integration (Google, Outlook)
- [ ] Social media imports (Twitter, Instagram)
- [ ] Wearable device data (fitness, sleep)
- [ ] Location services integration

### v2.0 - Advanced Features
- [ ] Collaborative memories (family/friends)
- [ ] Advanced analytics dashboard
- [ ] Plugin system for custom features
- [ ] Enterprise deployment options

---

## ❤️ Acknowledgments

- **Supabase** - For making backend development delightful
- **Google** - For Gemini AI and excellent APIs
- **Tailwind CSS** - For beautiful, maintainable styling
- **shadcn/ui** - For gorgeous, accessible components
- **React Team** - For the amazing frontend framework
- **Vite** - For lightning-fast development experience

---

<div align="center">
  <h3>Built with ❤️ for Privacy, Transparency, and User Ownership</h3>
  <p>Your memories, your life, fully yours.</p>
  
  <p>
    <a href="#getting-started">Get Started</a> •
    <a href="#deployment">Deploy</a> •
    <a href="#contributing">Contribute</a>
  </p>
</div>