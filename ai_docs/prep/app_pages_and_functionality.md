# App Pages & Functionality Blueprint

## App Summary

**End Goal:** Help knowledge workers and researchers achieve instant, intelligent access to insights from their documents using RAG-powered AI that understands their uploaded content.

**Core Value Proposition:** Save users 3-5 hours per week by eliminating manual document searching through AI-powered document intelligence and natural language querying.

**Target Users:** Knowledge workers, researchers, analysts, consultants, students, legal professionals, and medical professionals who work with extensive documentation.

**Template Type:** rag-saas (RAG-powered SaaS with subscription billing)

---

## 🌐 Universal SaaS Foundation

### Public Marketing Pages

- **Landing Page** — `/`
  - Hero: "Chat with Your Documents Using RAGI"
  - Features: Document Intelligence, Instant Smart Search, Multimedia Support
  - Problem section highlighting document search inefficiency
  - RAG Demo with interactive preview
  - Pricing: Free, Basic ($29), Pro ($99) tiers
  - FAQ section addressing common concerns
  - CTA driving to sign-up and chat functionality

- **Legal Pages** — `/privacy`, `/terms`, `/cookies`
  - Privacy policy with GDPR compliance
  - Terms of service for SaaS operations
  - Cookie policy for tracking compliance
  - Professional legal layout with navigation

### Authentication Flow

- **Login** — `/auth/login` (Email/password with Supabase Auth)
- **Sign Up** — `/auth/sign-up` (Account creation with email verification)
- **Forgot Password** — `/auth/forgot-password` (Password reset flow)
- **Update Password** — `/auth/update-password` (Secure password changes)
- **Sign Up Success** — `/auth/sign-up-success` (Email confirmation page)
- **Email Confirmation** — `/auth/confirm` (Email verification handler)
- **Auth Error** — `/auth/error` (Authentication error handling)

---

## ⚡ Core Application Pages

### Chat Interface — `/chat/[[...conversationId]]`

**Core Purpose:** AI-powered document conversation - the heart of the time-saving value proposition

**Key Functionality:**

- **Multimodal AI Chat** - Google Gemini 2.5 Pro/Flash with thinking capabilities
- **Document Context Integration** - RAG-powered responses with accurate source citations
- **Real-time Streaming** - Live AI responses with thinking indicators and stop controls
- **Multi-format Attachments** - Support for images, PDFs, videos, audio files
- **Usage Limit Tracking** - Real-time request counting with upgrade prompts when approaching limits
- **Conversation Management** - Auto-save conversations, resume sessions, organize by date
- **Welcome Experience** - Interactive onboarding with example prompts and feature highlights
- **Mobile Optimization** - Touch-friendly interface with responsive chat bubbles
- **Model Selection** - Choose between different Gemini models based on needs
- **Message History** - Persistent conversation storage with fast retrieval

### Documents Management — `/documents`

**Core Purpose:** Document upload and processing pipeline that enables intelligent conversations

**Key Functionality:**

- **Bulk Upload System** - Drag-and-drop multi-file upload with real-time progress tracking
- **Multi-format Support** - PDFs, images, videos, audio, text files (up to 50MB per file)
- **Real-time Processing Status** - Live updates on document embedding generation
- **Storage Management** - Visual storage usage with tier-based limits (5GB Basic, 50GB Pro)
- **Document Organization** - List view with metadata (filename, size, type, upload date)
- **Usage Warnings** - Proactive alerts for storage and document count limits
- **Optimistic UI Updates** - Immediate feedback during upload process
- **Error Handling** - Graceful handling of file type, size, and storage limit errors
- **Document Deletion** - Remove documents with confirmation dialogs
- **Processing Pipeline** - Automatic vector embedding generation for RAG functionality

### Conversation History — `/history`

**Core Purpose:** Browse, manage, and resume past AI conversations for continued productivity

**Key Functionality:**

- **Chronological Organization** - Auto-grouped by Today, Yesterday, This Week, Older
- **Conversation Management** - Rename conversations with inline editing
- **Conversation Deletion** - Delete conversations with confirmation dialogs
- **Model Tracking** - Display which AI model was used for each conversation
- **Quick Resume** - One-click return to any conversation for continued work
- **Date Formatting** - User-friendly date display for easy browsing
- **Empty State Guidance** - Clear onboarding for new users with "Start Chatting" CTA
- **Responsive Design** - Grid layout adapting to mobile and desktop
- **Error Handling** - Graceful fallback when conversation data fails to load

### User Profile & Account — `/profile`

**Core Purpose:** Account management and subscription control that drives revenue growth

**Key Functionality:**
**Account Management**

- **Profile Settings** - Editable full name with inline editing
- **Account Information** - Display email, member since date, current subscription status
- **Usage Analytics** - Real-time tracking of documents uploaded, storage used, requests made
- **Progress Indicators** - Visual progress bars for usage limits with tier-specific caps

**Subscription Management**

- **Current Plan Display** - Show active subscription with billing period and status
- **Tier Comparison** - Free (10 docs, 100MB, 10 requests/day), Basic ($29/month), Pro ($99/month)
- **Feature Breakdown** - Detailed comparison of limits and capabilities per tier
- **Upgrade Flows** - Stripe Checkout integration for seamless plan changes
- **Billing Portal Access** - Direct link to Stripe Customer Portal for payment management
- **Cancellation Handling** - Cancel at period end with confirmation dialogs
- **Usage-Based Prompts** - Contextual upgrade suggestions when approaching limits

---

## 🔧 API Infrastructure & Backend

### Document Processing APIs

- **Upload Management** — `/api/documents` (POST: Handle bulk file uploads)
- **Upload URL Generation** — `/api/documents/upload-url` (GET: Generate presigned S3 URLs)
- **Document Operations** — `/api/documents/[id]` (GET/DELETE: Document CRUD operations)
- **Document Completion** — `/api/documents/[id]/complete` (POST: Mark processing complete)
- **Processing Status** — `/api/documents/processing-status` (GET: Real-time processing updates)

### Chat & AI APIs

- **Streaming Chat** — `/api/chat` (POST: Real-time AI responses with RAG integration)

### Business Model APIs

- **Stripe Webhooks** — `/api/webhooks/stripe` (POST: Handle subscription events, invoice updates)

---

## 💰 Business Model Pages

### Subscription Billing Integration

- **Stripe Checkout** - Embedded in profile page with multiple tier options
- **Customer Portal** - Direct access to Stripe billing management
- **Usage Tracking** - Real-time monitoring of document, storage, and request usage
- **Tier Enforcement** - Hard limits enforced at API level with upgrade prompts
- **Webhook Processing** - Automatic subscription status updates via Stripe webhooks
- **Cancellation Management** - Cancel at period end with retention messaging

---

## 📱 Navigation Structure

### Main Sidebar (Responsive)

- **Chat** - 💬 Main AI conversation interface (primary feature)
- **Documents** - 📄 Upload and manage document collections
- **History** - 🕐 Browse and search past conversations
- **Profile** - 👤 Account settings and subscription management

### Role-Based Access

- **All Authenticated Users:** Full access to Chat, Documents, History, Profile
- **Admin Users:** Additional access to system administration (admin routes ready but not implemented in current version)

### Mobile Navigation

- **Collapsible Sidebar** - Icon-only view saves screen space on mobile
- **Touch Optimization** - Adequate spacing for mobile interaction
- **Auto-Collapse** - Sidebar closes after navigation selection on mobile devices
- **Header Integration** - Mobile header shows current page context and user status

---

## 🔧 Next.js App Router Structure

### Layout Groups

```
app/
├── (public)/          # Marketing and legal pages with public layout
├── (auth)/             # Authentication flow with centered auth layout
├── (protected)/        # Main authenticated app with sidebar layout
└── api/                # Backend API endpoints
```

### Complete Route Mapping

**🌐 Public Routes**

- `/` → Landing page (Hero, Features, Problem, Demo, Pricing, FAQ, CTA)
- `/privacy` → Privacy policy (GDPR compliant)
- `/terms` → Terms of service (SaaS legal requirements)
- `/cookies` → Cookie policy (Tracking compliance)

**🔐 Auth Routes**

- `/auth/login` → User login with Supabase Auth
- `/auth/sign-up` → User registration with email verification
- `/auth/forgot-password` → Password reset flow
- `/auth/update-password` → Secure password change
- `/auth/sign-up-success` → Registration confirmation page
- `/auth/confirm` → Email verification handler
- `/auth/error` → Authentication error handling

**🛡️ Protected Routes** (Require Authentication)

- `/chat` → New conversation interface
- `/chat/[conversationId]` → Resume specific conversation
- `/documents` → Document upload and management dashboard
- `/history` → Conversation history browser with search
- `/profile` → User settings, billing, and account management

**🔧 API Routes**

- `/api/documents` → Document upload and management
- `/api/documents/[id]` → Individual document operations
- `/api/documents/upload-url` → Presigned upload URL generation
- `/api/documents/processing-status` → Real-time processing updates
- `/api/documents/[id]/complete` → Mark document processing complete
- `/api/chat` → Streaming AI chat with RAG integration
- `/api/webhooks/stripe` → Stripe subscription webhook handling

---

## 🎯 Technical Implementation Details

### Database Schema (Drizzle ORM)

- **users** - User profiles with Stripe integration and subscription tracking
- **ai_models** - Available Gemini models with provider information and pricing
- **conversations** - Chat conversations with titles, metadata, and user association
- **messages** - Individual chat messages with content, role, and conversation linking
- **subscriptions** - User subscription status and usage tracking data

### AI Integration Stack

- **Google Gemini 2.5 Pro** - Most advanced reasoning with native multimodal capabilities
- **Google Gemini 2.5 Flash** - Best price-performance balance with thinking capabilities
- **Google Gemini 2.5 Flash-Lite** - Cost-effective model for high throughput tasks
- **Vector Search** - 1408-dimensional embeddings for document RAG retrieval
- **Multimodal Processing** - Handle text, images, audio, video, and PDF content

### Business Logic Implementation

- **Usage Tracking** - Real-time monitoring with tier-based limits enforcement
- **Subscription Management** - Full Stripe integration with webhook automation
- **Document Processing** - Async pipeline with status tracking and error recovery
- **Error Handling** - Comprehensive error boundaries and graceful degradation

---

## 🚀 MVP Functionality Summary

This blueprint delivers the core value proposition: **Help knowledge workers save 3-5 hours per week by providing instant, intelligent access to insights from their documents through RAG-powered AI conversations.**

**Phase 1 (Current Implementation - Launch Ready):**

- ✅ Universal SaaS foundation (auth, legal, responsive design)
- ✅ RAG-powered document intelligence with multi-format support
- ✅ Real-time AI chat with Google Gemini models
- ✅ Document upload and processing pipeline
- ✅ Conversation history and management
- ✅ User account and profile management
- ✅ Subscription billing with Stripe integration
- ✅ Usage tracking and tier enforcement
- ✅ Mobile-responsive design throughout

**Phase 2 (Growth Features - Future):**

- 🔄 Admin dashboard for system management
- 🔄 Advanced analytics and reporting
- 🔄 Team collaboration features
- 🔄 API access for enterprise integration
- 🔄 Custom AI model selection
- 🔄 Bulk document processing workflows

> **Status:** Complete implementation ready for production deployment. All core functionality tested and validated through actual app usage.
