# 🚀 Life.AI - Complete Deployment Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Get API Keys](#step-1-get-api-keys)
3. [Step 2: Database Setup](#step-2-database-setup)
4. [Step 3: Local Setup & Testing](#step-3-local-setup--testing)
5. [Step 4: Choose Deployment Platform](#step-4-choose-deployment-platform)
6. [Step 5: Deploy to Render (Recommended)](#step-5-deploy-to-render-recommended)
7. [Step 6: Deploy to Vercel (Alternative)](#step-6-deploy-to-vercel-alternative)
8. [Step 7: Deploy to Netlify (Alternative)](#step-7-deploy-to-netlify-alternative)
9. [Step 8: Post-Deployment Setup](#step-8-post-deployment-setup)
10. [Step 9: Domain & SSL Setup](#step-9-domain--ssl-setup)
11. [Troubleshooting](#troubleshooting)
12. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### ✅ **What You Need Before Starting:**

- [ ] Computer with internet connection
- [ ] Google account (for OAuth and APIs)
- [ ] GitHub account (for code repository)
- [ ] Credit card (for API verification - most services have free tiers)
- [ ] Basic familiarity with web browsers and copy/paste
- [ ] 30-60 minutes of time

### ✅ **Accounts You'll Create:**

- [ ] Supabase account (database)
- [ ] Google Cloud Console account (for APIs)
- [ ] Render/Vercel/Netlify account (hosting)
- [ ] Domain registrar account (optional, for custom domain)

---

## Step 1: Get API Keys

### 🔑 **1.1 Supabase Setup (Database & Authentication)**

#### **Create Supabase Account:**

1. **Go to [supabase.com](https://supabase.com)**
2. **Click "Start your project"**
3. **Sign up with GitHub or Google**
4. **Verify your email if required**

#### **Create New Project:**

1. **Click "New Project"**
2. **Fill in project details:**
   - **Organization:** Create new or select existing
   - **Project Name:** `life-ai-production` (or your preferred name)
   - **Database Password:** Generate a strong password (save this!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free tier is sufficient to start

3. **Click "Create new project"**
4. **Wait 2-3 minutes for setup to complete**

#### **Get Supabase Keys:**

1. **Go to Settings → API**
2. **Copy these values:**
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. **Save these in a text file for later**

#### **Enable Google Authentication:**

1. **Go to Authentication → Providers**
2. **Find "Google" and toggle it ON**
3. **You'll need to add Google OAuth credentials later**

---

### 🤖 **1.2 Google Gemini AI Setup**

#### **Get Gemini API Key:**

1. **Go to [Google AI Studio](https://makersuite.google.com/app/apikey)**
2. **Sign in with your Google account**
3. **Click "Create API Key"**
4. **Select "Create API key in new project" (recommended)**
5. **Copy the generated API key**
   ```
   Example: AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
6. **Save this key securely**

⚠️ **Important:** This key has usage limits. Monitor your usage in the Google AI Studio dashboard.

---

### 🔄 **1.3 Google Drive Backup Setup (Optional but Recommended)**

#### **Create Google Cloud Project:**

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create new project:**
   - **Project Name:** `life-ai-backups`
   - **Click "Create"**

#### **Enable APIs:**

1. **Go to "APIs & Services" → "Library"**
2. **Search for and enable these APIs:**
   - Google Drive API
   - Gmail API (if you want email backups)

#### **Create OAuth Credentials:**

1. **Go to "APIs & Services" → "Credentials"**
2. **Click "Create Credentials" → "OAuth client ID"**
3. **If prompted, configure OAuth consent screen:**
   - **User Type:** External
   - **App Name:** Life.AI Personal Memory System
   - **User support email:** Your email
   - **Developer contact:** Your email
   - **Scopes:** Add Google Drive and Gmail scopes
   - **Test users:** Add your email

4. **Create OAuth Client:**
   - **Application type:** Web application
   - **Name:** Life.AI Production
   - **Authorized JavaScript origins:** 
     ```
     http://localhost:3000
     https://your-app-name.onrender.com (add after deployment)
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:3000/auth/callback
     https://your-app-name.onrender.com/auth/callback
     ```

5. **Save the Client ID and Client Secret**

---

## Step 2: Database Setup

### 🗄️ **2.1 Create Database Tables**

#### **Access Supabase SQL Editor:**

1. **Open your Supabase project dashboard**
2. **Go to "SQL Editor"**
3. **Click "New query"**

#### **Run Table Creation Scripts:**

**Copy and paste this SQL script and click "Run":**

```sql
-- 1. Create memories table
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

-- 2. Create graph edges table
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

-- 3. Create user settings table
CREATE TABLE user_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  date_format VARCHAR(20) DEFAULT 'MM/dd/yyyy',
  time_format VARCHAR(10) DEFAULT '12h',
  memory_retention VARCHAR(20) DEFAULT 'forever',
  auto_save_memories BOOLEAN DEFAULT true,
  confidence_threshold FLOAT DEFAULT 0.7,
  enable_analytics BOOLEAN DEFAULT true,
  auto_backup BOOLEAN DEFAULT true,
  backup_frequency VARCHAR(20) DEFAULT 'weekly',
  backup_location VARCHAR(20) DEFAULT 'drive',
  last_backup_date TIMESTAMP WITH TIME ZONE,
  drive_connected BOOLEAN DEFAULT false,
  drive_email TEXT,
  enable_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **Enable Row Level Security:**

**Run this script to secure your data:**

```sql
-- Enable RLS on all tables
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can manage their own memories" ON memories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own graph edges" ON graph_edges
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);
```

#### **Create Performance Indexes:**

**Run this script for better performance:**

```sql
-- Create indexes for better performance
CREATE INDEX idx_memories_user_created ON memories(user_id, created_at DESC);
CREATE INDEX idx_memories_content_search ON memories USING gin(to_tsvector('english', content));
CREATE INDEX idx_memories_tags ON memories USING gin(tags);
CREATE INDEX idx_memories_people ON memories USING gin(people);
CREATE INDEX idx_memories_places ON memories USING gin(places);
CREATE INDEX idx_memories_events ON memories USING gin(events);

CREATE INDEX idx_graph_edges_user ON graph_edges(user_id);
CREATE INDEX idx_graph_edges_source ON graph_edges(source_node);
CREATE INDEX idx_graph_edges_target ON graph_edges(target_node);
CREATE INDEX idx_graph_edges_type ON graph_edges(edge_type);

CREATE INDEX idx_user_settings_user ON user_settings(user_id);
```

#### **Enable Real-time (Optional):**

```sql
-- Enable real-time updates
ALTER PUBLICATION supabase_realtime ADD TABLE memories;
ALTER PUBLICATION supabase_realtime ADD TABLE graph_edges;
```

---

## Step 3: Local Setup & Testing

### 💻 **3.1 Get the Code**

#### **Clone the Repository:**

```bash
# Option 1: If you have the code locally
cd your-life-ai-project

# Option 2: If cloning from GitHub
git clone https://github.com/yourusername/life-ai.git
cd life-ai
```

#### **Install Dependencies:**

```bash
# Install Node.js packages
npm install

# Or if you prefer yarn
yarn install
```

### 🔧 **3.2 Configure Environment Variables**

#### **Create Environment File:**

```bash
# Copy the example file
cp .env.example .env
```

#### **Fill in Your API Keys:**

**Open `.env` file and add your keys:**

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Gemini AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Google Drive Backup Configuration (Optional)
VITE_GOOGLE_DRIVE_CLIENT_ID=your_google_oauth_client_id
VITE_GOOGLE_DRIVE_CLIENT_SECRET=your_google_oauth_client_secret
VITE_GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/auth/callback

# Gmail SMTP Configuration (Optional)
VITE_GMAIL_SMTP_USER=your_gmail_address@gmail.com
VITE_GMAIL_SMTP_PASS=your_gmail_app_password

# Security
VITE_JWT_SECRET=your_secure_random_string_here

# App Configuration
VITE_APP_URL=http://localhost:3000
VITE_APP_NAME=Life.AI
```

### ✅ **3.3 Test Locally**

#### **Start Development Server:**

```bash
npm run dev
```

**You should see:**
```
  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

#### **Test the Application:**

1. **Open http://localhost:3000**
2. **You should see the Life.AI login page**
3. **Try clicking "Continue with Google"**
4. **Verify the login flow works**

#### **Fix Google OAuth (if needed):**

1. **Go back to Google Cloud Console**
2. **Add your local URL to authorized origins:**
   ```
   http://localhost:3000
   ```
3. **Update Supabase Auth settings:**
   - Go to Supabase → Authentication → Settings
   - Add Google OAuth credentials:
     - Client ID: Your Google OAuth Client ID
     - Client Secret: Your Google OAuth Client Secret

#### **Build Test:**

```bash
npm run build
```

**Should complete without errors.**

---

## Step 4: Choose Deployment Platform

### 🎯 **Platform Comparison:**

| Platform | Pros | Cons | Best For |
|----------|------|------|----------|
| **Render** | Free tier, easy setup, good performance | Limited free hours | Recommended for most users |
| **Vercel** | Excellent performance, great for React | Serverless limitations | High-traffic applications |
| **Netlify** | Simple deployment, good free tier | Limited backend features | Static-focused apps |

**🏆 Recommendation: Use Render for most deployments**

---

## Step 5: Deploy to Render (Recommended)

### 🚀 **5.1 Prepare for Deployment**

#### **Push Code to GitHub:**

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial Life.AI deployment"

# Push to GitHub
git remote add origin https://github.com/yourusername/life-ai.git
git push -u origin main
```

### 🌐 **5.2 Deploy to Render**

#### **Create Render Account:**

1. **Go to [render.com](https://render.com)**
2. **Sign up with GitHub**
3. **Authorize Render to access your repositories**

#### **Create New Web Service:**

1. **Click "New" → "Web Service"**
2. **Connect your Life.AI repository**
3. **Configure the service:**

   **Basic Settings:**
   - **Name:** `life-ai-production` (or your choice)
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Root Directory:** Leave blank
   - **Runtime:** `Node`

   **Build & Deploy:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run preview`

   **Pricing:**
   - **Plan:** Free (sufficient for testing)

#### **Add Environment Variables:**

**In the "Environment" section, add all your variables:**

```
VITE_SUPABASE_URL = https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key_here
VITE_GEMINI_API_KEY = your_gemini_api_key_here
VITE_GOOGLE_DRIVE_CLIENT_ID = your_google_oauth_client_id
VITE_GOOGLE_DRIVE_CLIENT_SECRET = your_google_oauth_client_secret
VITE_GOOGLE_DRIVE_REDIRECT_URI = https://your-app-name.onrender.com/auth/callback
VITE_JWT_SECRET = your_secure_random_string_here
VITE_APP_URL = https://your-app-name.onrender.com
VITE_APP_NAME = Life.AI
```

⚠️ **Important:** Update the redirect URI with your actual Render URL

#### **Deploy:**

1. **Click "Create Web Service"**
2. **Wait for deployment (5-10 minutes)**
3. **Monitor the build logs for any errors**

#### **Get Your Deployment URL:**

**Your app will be available at:**
```
https://your-app-name.onrender.com
```

---

## Step 6: Deploy to Vercel (Alternative)

### 🚀 **6.1 Vercel Deployment**

#### **Install Vercel CLI:**

```bash
npm i -g vercel
```

#### **Login and Deploy:**

```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# ? Set up and deploy? Y
# ? Which scope? Your username
# ? Link to existing project? N
# ? What's your project's name? life-ai
# ? In which directory is your code located? ./
```

#### **Add Environment Variables:**

1. **Go to [vercel.com](https://vercel.com) dashboard**
2. **Select your project**
3. **Go to Settings → Environment Variables**
4. **Add all your environment variables**

#### **Trigger Redeploy:**

```bash
vercel --prod
```

---

## Step 7: Deploy to Netlify (Alternative)

### 🚀 **7.1 Netlify Deployment**

#### **Build the Project:**

```bash
npm run build
```

#### **Deploy via Drag & Drop:**

1. **Go to [netlify.com](https://netlify.com)**
2. **Drag the `dist` folder to the deploy area**
3. **Wait for deployment**

#### **Or Deploy via GitHub:**

1. **Connect your GitHub repository**
2. **Configure build settings:**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. **Add environment variables in Site Settings**

---

## Step 8: Post-Deployment Setup

### 🔧 **8.1 Update OAuth Settings**

#### **Update Google OAuth:**

1. **Go to Google Cloud Console**
2. **Update authorized origins and redirect URIs with your production URL:**
   ```
   https://your-app-name.onrender.com
   https://your-app-name.onrender.com/auth/callback
   ```

#### **Update Supabase Auth:**

1. **Go to Supabase → Authentication → Settings**
2. **Update Site URL:** `https://your-app-name.onrender.com`
3. **Add to Redirect URLs:** `https://your-app-name.onrender.com/**`

### ✅ **8.2 Test Production Deployment**

#### **Test Authentication:**

1. **Visit your production URL**
2. **Try logging in with Google**
3. **Verify you can access all pages**

#### **Test Core Features:**

1. **Try the chat interface**
2. **Test voice input (if supported by browser)**
3. **Check settings page**
4. **Verify timeline and graph pages load**

#### **Check Database:**

1. **Go to Supabase dashboard**
2. **Check if user was created in Authentication**
3. **Verify database connections work**

---

## Step 9: Domain & SSL Setup

### 🌐 **9.1 Custom Domain (Optional)**

#### **Purchase Domain:**

1. **Choose a domain registrar (Namecheap, GoDaddy, etc.)**
2. **Purchase your desired domain**
3. **Access DNS settings**

#### **Configure DNS for Render:**

1. **Add CNAME record:**
   ```
   Type: CNAME
   Name: www (or @)
   Value: your-app-name.onrender.com
   ```

#### **Add Domain to Render:**

1. **Go to Render dashboard → your service**
2. **Settings → Custom Domains**
3. **Add your domain**
4. **Wait for SSL certificate (automatic)**

### 🔒 **9.2 SSL Certificate**

**SSL is automatically provided by:**
- ✅ Render (Let's Encrypt)
- ✅ Vercel (automatic)
- ✅ Netlify (Let's Encrypt)

---

## Troubleshooting

### 🐛 **Common Issues & Solutions**

#### **Build Failures:**

```bash
# Error: Module not found
npm install --legacy-peer-deps

# Error: Out of memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

#### **Environment Variable Issues:**

```bash
# Check if variables are loaded
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)

# Ensure all VITE_ prefixes are correct
# Restart development server after changes
```

#### **Authentication Issues:**

1. **Check OAuth redirect URIs match exactly**
2. **Verify Supabase project URL is correct**
3. **Check Google Cloud Console credentials**
4. **Enable third-party cookies in browser**

#### **Database Connection Issues:**

1. **Verify Supabase URL and key**
2. **Check RLS policies are correct**
3. **Ensure tables exist**
4. **Check network connectivity**

#### **Deployment Issues:**

**Render:**
```bash
# Check build logs in Render dashboard
# Ensure Node.js version compatibility
# Verify build command is correct
```

**Vercel:**
```bash
# Check function logs
# Verify serverless function limits
# Check build output
```

### 📊 **Performance Issues:**

#### **Slow Loading:**

1. **Enable compression in hosting platform**
2. **Optimize images and assets**
3. **Use CDN for static assets**
4. **Monitor bundle size**

#### **API Rate Limits:**

1. **Monitor Gemini API usage**
2. **Implement request caching**
3. **Add rate limiting**
4. **Upgrade API plans if needed**

---

## Monitoring & Maintenance

### 📈 **10.1 Monitoring Setup**

#### **Application Monitoring:**

1. **Use platform-provided logs:**
   - Render: Service logs
   - Vercel: Function logs
   - Netlify: Function logs

2. **Monitor key metrics:**
   - Response times
   - Error rates
   - User authentication success
   - Database query performance

#### **Database Monitoring:**

1. **Supabase Dashboard:**
   - Monitor usage statistics
   - Check query performance
   - Review authentication logs

#### **API Usage Monitoring:**

1. **Google AI Studio:** Monitor Gemini API usage
2. **Google Cloud Console:** Monitor Drive API usage
3. **Set up usage alerts**

### 🔄 **10.2 Regular Maintenance**

#### **Weekly Tasks:**

- [ ] Check application health
- [ ] Review error logs
- [ ] Monitor API usage
- [ ] Test backup functionality

#### **Monthly Tasks:**

- [ ] Update dependencies
- [ ] Review security settings
- [ ] Analyze user feedback
- [ ] Optimize performance

#### **Updates & Upgrades:**

```bash
# Update dependencies
npm update

# Security audit
npm audit --audit-level high

# Test updates locally
npm run build
npm run preview
```

### 🔒 **10.3 Security Maintenance**

#### **Regular Security Tasks:**

1. **Monitor Supabase security alerts**
2. **Review OAuth app permissions**
3. **Update API keys if compromised**
4. **Check for dependency vulnerabilities**
5. **Review user access patterns**

#### **Backup & Recovery:**

1. **Regular database backups (Supabase handles this)**
2. **Test data export functionality**
3. **Verify user data backup features**
4. **Document recovery procedures**

---

## 🎉 **Deployment Complete!**

### ✅ **Final Checklist:**

- [ ] Application deployed and accessible
- [ ] Google OAuth working
- [ ] Database connected and secured
- [ ] All environment variables configured
- [ ] SSL certificate active
- [ ] Core features tested
- [ ] Monitoring set up
- [ ] Documentation complete

### 🚀 **You Now Have:**

- ✅ **Production Life.AI application**
- ✅ **Secure user authentication**
- ✅ **Private database with RLS**
- ✅ **AI-powered memory processing**
- ✅ **Automatic backups configured**
- ✅ **Scalable hosting infrastructure**

### 📞 **Need Help?**

- **Documentation:** Check the main README.md
- **Issues:** Create GitHub issues for bugs
- **Community:** Join discussions for support
- **Updates:** Star the repository for updates

**🎊 Congratulations! Your Life.AI personal memory system is now live and ready for users!**

---

## 📋 Quick Reference

### **Essential URLs:**
- **Supabase:** https://supabase.com/dashboard
- **Google Cloud:** https://console.cloud.google.com
- **Google AI Studio:** https://makersuite.google.com
- **Render:** https://dashboard.render.com
- **Vercel:** https://vercel.com/dashboard
- **Netlify:** https://app.netlify.com

### **Key Commands:**
```bash
# Local development
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Check dependencies
npm audit
```

### **Environment Variables Template:**
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
VITE_GOOGLE_DRIVE_CLIENT_ID=
VITE_GOOGLE_DRIVE_CLIENT_SECRET=
VITE_GOOGLE_DRIVE_REDIRECT_URI=
VITE_APP_URL=
VITE_APP_NAME=Life.AI
```