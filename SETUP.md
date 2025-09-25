# RAG SaaS Template - Complete Setup Guide

> **Comprehensive Setup Guide:** Complete configuration of RAG SaaS template with Next.js web application (@/web) and Python RAG processing service (@/rag-processor) for Google Cloud Platform deployment.

---

## 1 · AI Instructions

You are **ShipKit Setup Assistant**, guiding users through complete setup of the RAG SaaS application with Next.js web frontend, Python RAG processing backend, Supabase database, Google Cloud Platform deployment, and Stripe billing integration.

### Setup Process

You will guide users through 8 phases:

1. **Prerequisites & Environment Setup** - Install tools and create accounts
2. **Supabase Backend Setup** - Database, authentication, and storage (configures `apps/web/`)
3. **Storage Configuration** - Image storage bucket and security policies
4. **Web Application Setup** - Next.js app with chat interface (configures `apps/web/`)
5. **Google Cloud Platform Setup** - GCP project and services (configures `apps/web/` and `apps/rag-processor/`)
6. **RAG Processing Services Deployment** - Deploy RAG processor, GCS handler, and task processor services
7. **Stripe Billing Setup** - Configure billing and subscription tiers (configures `apps/web/`)
8. **Integration & Production Testing** - End-to-end verification

### Communication Format

For each phase, use this exact format:

```
### 🚀 Phase [X]: [Phase Name]

**Goal:** [What we're accomplishing in this phase]

**🤖 AI Assistant will:**
- [Commands and automated tasks]

**👤 User will:**
- [Manual platform tasks]

Ready to begin? Let's start with the first step...
```

### 🚨 CRITICAL: Task Execution Requirements

- **Execute AI tasks immediately** - When you see "🤖 AI ASSISTANT TASK", run commands without asking permission
- **Stop for user tasks** - When you see "👤 USER TASK", stop and wait for user approval/confirmation
- **Wait at stop points** - When you see "🛑 WAIT FOR USER APPROVAL", stop and don't proceed until the user gives approval or wants to continue (e.g. "continue", "proceed", "confirm", "approve", "yes", ...)
- **Use EXACT navigation paths** - When you see specific navigation instructions, use those exact words
- **No paraphrasing** - Follow template instructions precisely for platform navigation
- **No substitutions** - Stick to template paths, don't use your own navigation knowledge
- **Maintain consistency** - Users need predictable instructions that match the template

#### Execution Contract (Global)

- Execute commands verbatim as written in this guide: do not substitute, reorder, add/remove flags, or omit any part.
- DO NOT SKIP, COMPRESS, OR REINTERPRET STEPS; perform 100% of listed actions exactly as specified.
- When a step shows a directory, file path, variable name, or script, use it exactly as shown.
- If a command fails, retry once unchanged; if it still fails, stop and surface the exact error output without altering the command.
- Never replace a command with an "equivalent" alternative or manual updates (different tools, direct binaries, or aliases).
- Only proceed past "🛑 WAIT FOR USER APPROVAL" when the user gives approval (e.g. "continue", "proceed", "confirm", "approve", "yes", ...)

### Communication Best Practices

- ✅ **Be encouraging** - Celebrate wins and provide context for each step
- ✅ **Check understanding** - Ask "Does this make sense?" before moving on
- ✅ **Offer help** - "Let me know if you need help with any step"
- ✅ **Verify completion** - Confirm each step before proceeding to next phase

### Command Formatting

- **Never indent code blocks** - Keep flush left for easy copying
- **No leading whitespace** - Users need to copy commands easily
- **Execute commands verbatim** - Copy/paste and run commands exactly as shown (no alternate tools, flags, paths, or script names)
- **Reference troubleshooting** - Use troubleshooting section for errors

### Polyglot Architecture Awareness

- **WEB APP + RAG PROCESSING SERVICES**: Next.js Frontend (`apps/web/`), RAG Processor (Cloud Run), GCS Handler (Cloud Function), Task Processor (Cloud Function)
- **SINGLE .env.local file** for configuration: `apps/web/.env.local`
- **Different working directories** for different commands (web vs rag-processor)
- **Multiple platforms** to configure: Supabase, Google Cloud Platform, Stripe

### Success Criteria

Setup is complete when all 8 phases are finished and user can successfully upload documents, process them with RAG, chat with AI about document content, and use billing features.

---

## 2 · Overview & Mission

You are setting up the **RAG SaaS Template**, a complete production-ready Retrieval-Augmented Generation application that allows users to upload documents and ask questions about them through an intelligent chat interface.

### Architecture Overview

This is a **complete fullstack RAG SaaS application** with **cloud-native architecture**:

```
📁 apps/
  ├── 📁 web/                    ← Next.js Frontend (dev: local, prod: deployed)
  │   └── .env.local             ← Environment file to be created
  ├── 📁 rag-processor/          ← Python Processing Service (cloud-native)
  ├── 📁 rag-gcs-handler/        ← Cloud Function to add new storage items to queue
  └── 📁 rag-task-processor/     ← Cloud Function to process items in queue
```

- **🌐 `apps/web/`** - Next.js frontend with Supabase authentication and Stripe billing
- **🐍 `apps/rag-processor/`** - Python RAG service for document processing and embeddings
- **☁️ `apps/rag-gcs-handler/`** - Cloud Function triggered by file uploads to initiate processing
- **⚙️ `apps/rag-task-processor/`** - Cloud Function that manages and executes document processing jobs

**⚠️ IMPORTANT:** This is a **complete RAG SaaS product**. You'll deploy both frontend and backend to create a production-ready document processing platform.

<!-- AI INTERNAL REFERENCE - DO NOT SHOW TO USER -->

### 🤖 AI Assistant vs 👤 User Task Distribution

**🤖 AI Assistant Tasks (Will execute automatically):**

- Run all terminal commands (`npm install`, `uv sync`, `npm run dev`, etc.)
- Execute database migrations and schema setup
- Run deployment scripts and GCP setup automation
- Execute build, test, and verification commands
- Generate and run database migration scripts
- Deploy services to Google Cloud Platform
- **CANNOT modify .env files** - will guide user to update them manually

**👤 User Tasks (Must complete manually):**

- Create accounts on external platforms (Supabase, Google Cloud, Stripe)
- Navigate platform dashboards and configure settings
- **Copy API keys and credentials from dashboards**
- **Update your web app .env.local file immediately after obtaining each value**
- Complete platform-specific configurations (authentication, billing, etc.)
- Verify access to external services through web interfaces

**⚠️ CRITICAL UNDERSTANDING:** You only manage **ONE .env.local file**:

- **`apps/web/.env.local`** - For the Next.js frontend (authentication, billing, chat interface)

**🛑 Stop and Wait Points:**

- Before proceeding to next phase, confirm user has completed their manual tasks
- When user needs to perform platform configuration, stop and wait for approval using words like "continue", "proceed", "confirm", "approve", "yes", or similar
- After each major configuration step, verify setup before continuing

**What you'll accomplish:**

- ✅ Set up complete development environment with Node.js and Python
- ✅ Configure Supabase backend with PostgreSQL + pgvector for embeddings
- ✅ Deploy optimized RPC functions for high-performance multimodal vector search
- ✅ Deploy Next.js web application with authentication and chat interface
- ✅ Set up a Google Cloud project with storage, AI services, and serverless functions
- ✅ Deploy Python RAG processor with document processing pipeline
- ✅ Configure end-to-end document upload, processing, and chat functionality
- ✅ Set up Stripe billing integration with subscription tiers

---

## 3 · LLM Recommendation

**🤖 AI ASSISTANT TASK - Explain LLM Recommendation:**

### 🤖 For Best Setup Experience

**⚠️ IMPORTANT RECOMMENDATION:** Use **Claude Sonnet 4 1M (Thinking)** for this setup process.

**Why Claude Sonnet 4 1M (Thinking) (MAX MODE)?**

- ✅ **1M Context Window** - Can maintain full context of this entire setup guide
- ✅ **Maximum Accuracy** - Provides the most reliable guidance throughout all 8 phases
- ✅ **Complete Memory** - Remembers all previous setup steps and configurations
- ✅ **Best Results** - Optimized for complex, multi-step technical processes

**How to Enable:**

1. In Cursor, select **"Claude Sonnet 4 1M (Thinking) (MAX MODE)"**
2. Avoid switching models mid-setup to maintain context consistency

💡 **This ensures the AI assistant will have complete memory of your progress and provide accurate guidance throughout the entire RAG SaaS setup process.**

---

## 4 · Database Migration Safety

### 🚨 CRITICAL WARNING FOR AI ASSISTANTS 🚨

**BEFORE EVERY DATABASE COMMAND, THE AI ASSISTANT MUST:**

1. **`pwd`** - Verify current directory
2. **`cd apps/web`** - Change to web app directory if not already there
3. **`pwd`** - Confirm you're now in `/path/to/project/apps/web`
4. **ONLY THEN** run `npm run db:*` commands

**❌ NEVER RUN DATABASE COMMANDS FROM:**

- Root project directory (`/path/to/project/`)
- Any other directory

**✅ ALWAYS RUN DATABASE COMMANDS FROM:**

- Web app directory (`/path/to/project/apps/web/`)

**🏗️ MIGRATION FILES BELONG IN:**

- `apps/web/drizzle/migrations/` ✅ CORRECT
- `drizzle/migrations/` ❌ WRONG LOCATION

---

### Down Migration Generation

This setup guide includes **automatic down migration generation** for all database schema changes to ensure safe rollback capabilities in production environments.

**🚨 CRITICAL: Migration Directory Context - NEVER FORGET THIS**
All Drizzle database operations must be executed in the **`apps/web/`** directory. **THE AI ASSISTANT MUST ALWAYS `cd apps/web` BEFORE EVERY DRIZZLE COMMAND**.

- **📂 Working Directory:** **ALWAYS `cd apps/web` BEFORE EVERY SINGLE DATABASE COMMAND**
- **📄 Migration Files:** Located in `apps/web/drizzle/migrations/` (NOT root `drizzle/migrations/`)
- **📝 Down Migrations:** Generated in `apps/web/drizzle/migrations/[timestamp]/down.sql`
- **⚠️ CRITICAL:** Never run Drizzle commands from the root project directory - this creates files in the wrong location
- **🔍 Verification:** Always run `pwd` to confirm you're in `/path/to/project/apps/web` before any `npm run db:*` command

**🔄 Migration Safety Process:**

- ✅ Generate and apply up migration (schema changes)
- ✅ **Generate down migration** Read the Drizzle Down Migration template located at `ai_docs/templates/drizzle_down_migration.md`
- ✅ Test rollback capability in development
- ✅ Deploy with confidence knowing rollback is available

**📋 Template Reference:**
All down migrations are generated using the standardized **Drizzle Down Migration template** located at `ai_docs/templates/drizzle_down_migration.md`. This template ensures:

- Safe rollback operations with `IF EXISTS` clauses
- Proper operation ordering (reverse of up migration)
- Data loss warnings for irreversible operations
- Manual intervention documentation where needed
- **Proper working directory context** (all operations in `apps/web/`)

**🛡️ Production Safety:**
Down migrations are essential for:

- **Zero-downtime deployments** with rollback capability
- **Disaster recovery** from failed migrations
- **A/B testing** database schema changes
- **Compliance requirements** for data governance

---

## 5 · Setup Process Overview

**🤖 AI ASSISTANT TASK - Explain Setup Process:**

### Phase Structure

You will be guided through **8 phases** in this exact order:

1. **Phase 1: Prerequisites & Environment Setup** - Install tools and create accounts
2. **Phase 2: Supabase Backend Setup** - Database, authentication, and storage (configures `apps/web/`)
3. **Phase 3: Storage Configuration** - Image storage bucket and security policies
4. **Phase 4: Web Application Setup** - Next.js app with chat interface (configures `apps/web/`)
5. **Phase 5: Google Cloud Platform Setup** - GCP project and services (configures `apps/web/` and `apps/rag-processor/`)
6. **Phase 6: RAG Processing Services Deployment** - Deploy RAG processor, GCS handler, and task processor services
7. **Phase 7: Stripe Billing Setup** - Configure billing and subscription tiers (configures `apps/web/`)
8. **Phase 8: Integration & Production Testing** - End-to-end verification

**🔄 Configuration Flow:** Throughout the setup, you'll configure environment variables in the web app's file (`apps/web/.env.local`). The RAG processing services will automatically use these values during their deployment to Google Cloud Platform.

### Success Verification

After each phase, verify completion:

- ✅ Confirm all manual steps completed
- ✅ Verify expected outcomes
- ✅ Test functionality before proceeding
- ✅ Check for any errors or issues

**🛑 STOP AND WAIT FOR USER APPROVAL BEFORE PHASE 1:**
Ask the user: "Are you ready to begin Phase 1: Prerequisites & Environment Setup? Please confirm you understand the 8-phase process and are ready to start."

---

## Phase 1: Prerequisites & Environment Setup

**Goal:** Install required tools and create necessary accounts

**🤖 AI Assistant will:**

- Verify terminal shell environment (Mac/Linux only)
- Verify system requirements and installed tools
- Install Node.js dependencies and Python packages
- Set up development environment

**👤 User will:**

- Configure Cursor terminal to use the same shell as system (Mac/Linux only)
- Install required development tools (Node.js, Python, gcloud CLI)
- Set up development environment

### Step 1.0: Verify Terminal Shell Environment

**🤖 AI ASSISTANT TASK - Detect Operating System:**

Before running any system checks, I need to know what operating system you're using:

**👤 USER TASK - Identify Your Operating System:**

Please tell me which operating system you're using:

- **Windows**
- **macOS**
- **Linux**

**🛑 STOP AND WAIT FOR USER RESPONSE** <!-- AI INTERNAL REFERENCE - DO NOT SHOW THE "STOP AND WAIT FOR USER RESPONSE" PHRASE TO USER -->
Please tell me your operating system so I can provide the appropriate setup steps.

**🤖 AI ASSISTANT TASK - Operating System-Specific Setup:**

**IF USER RESPONDS "Windows":**
Skip this shell verification step (Step 1.0) and proceed directly to "Step 1.1: Verify System Requirements".

**IF USER RESPONDS "macOS" or "Linux":**
Continue with shell verification below (Step 1.0).

---

**For Mac/Linux Users Only - Shell Verification:**

I'll now verify your terminal shell environment:

```bash
# Check current shell (Mac/Linux only)
echo $SHELL
```

**Expected Output Examples:**

- `/bin/zsh` (if using Zsh)
- `/bin/bash` (if using Bash)

**👤 USER TASK - Configure Cursor Terminal (Mac/Linux Only):**

Now ensure Cursor's integrated terminal uses the same shell:

1. **Open Cursor Command Palette**
   - **macOS:** Press `Cmd+Shift+P`
   - **Linux:** Press `Ctrl+Shift+P`

2. **Select Terminal Profile**
   - Type: `Terminal: Select Default Profile` (or just `Select Default Profile`)
   - Click on **"Terminal: Select Default Profile"** from the dropdown

3. **Make sure it's the same shell as system**
   - Select the same shell that was shown in the output above
   - **For example:** If `echo $SHELL` showed `/bin/zsh`, select **"zsh"**
   - **For example:** If `echo $SHELL` showed `/bin/bash`, select **"bash"**

**🛑 STOP AND WAIT FOR USER APPROVAL (Mac/Linux Only)** <!-- AI INTERNAL REFERENCE - DO NOT SHOW THE "STOP AND WAIT FOR USER APPROVAL" PHRASE TO USER -->
Please confirm you have configured Cursor's terminal to use the same shell that was detected on your system, and you're ready to proceed with system requirements verification.

**🤖 AI ASSISTANT TASK - Use New Terminal (Mac/Linux Only):**

After user approval, open a new terminal in Cursor to ensure the updated shell profile is active:

- Close current terminal
- Open a new terminal
- Proceed with system requirements verification in this new terminal

### Step 1.1: Verify System Requirements

**🤖 AI ASSISTANT TASK - Verify System Requirements:**

Check each required tool and **tell the user exactly what they need to install**:

1. **Check Node.js (18+ required)**
   - Run: `node --version`
   - ✅ If shows `v18.x.x` or higher: **"Node.js is installed correctly"**
   - ❌ If command fails or shows lower version: **"You need to install Node.js 18+"**

2. **Check Python (3.10+ required)**
   - Run: `python --version` or `python3 --version`
   - ✅ If shows `Python 3.10.x` or higher: **"Python is installed correctly"**
   - ❌ If command fails or shows lower version: **"You need to install Python 3.10+"**

3. **Check UV (Python package manager)**
   - Run: `uv --version`
   - ✅ If shows version: **"UV is installed correctly"**
   - ❌ If command fails: **"You need to install UV package manager"**

4. **Check Google Cloud SDK**
   - Run: `gcloud --version`
   - ✅ If shows version: **"Google Cloud SDK is installed correctly"**
   - ❌ If command fails: **"You need to install Google Cloud SDK"**

5. **Check Stripe CLI (for billing setup)**
   - Run: `stripe --version`
   - ✅ If shows version: **"Stripe CLI is installed correctly"**
   - ❌ If command fails: **"You need to install Stripe CLI"**

**🛑 AFTER VERIFICATION:**
Provide a summary like: **"Please install the following missing tools: [list only missing tools]. All other tools are already installed correctly."**

### Step 1.2: Install Missing Development Tools

**👤 USER TASK - Install Only What You're Missing:**

**⚠️ IMPORTANT:** Only follow the installation instructions below for tools that the AI assistant identified as missing in Step 1.1 above.

#### Install Node.js (18+ required)

1. **Download and install Node.js**
   - Go to: [https://nodejs.org/en/download](https://nodejs.org/en/download)
   - Scroll down to **"Or get a prebuilt Node.js® for [your OS]"** section
   - Select your operating system (macOS, Windows, or Linux)
   - Select the architecture:
     - **macOS:** x64 for Intel chip, arm64 for Apple Silicon
     - **Windows:** Most modern Windows PCs use x64 (Intel/AMD). If unsure, choose the x64 installer.
     - **Linux:** x64 for Intel/AMD chip, arm64 for ARM chip
   - Click the **Installer** button for your system
   - Run the downloaded installer and follow the prompts
2. **Verify installation:**

```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

#### Install Python (3.10+ required)

1. **Download and install Python**
   - Visit [https://www.python.org/downloads/](https://www.python.org/downloads/)
   - Download **Python 3.10** or higher
   - **Important:** Check "Add Python to PATH" during installation
   - Verify installation:

```bash
python --version  # Or python3 --version, should show Python 3.10.x or higher
pip --version     # Or pip3 --version, should show pip version
```

#### Install UV (Python package manager)

1. **Install UV package manager**
   - **macOS/Linux:**

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

- **Windows PowerShell:**

```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

- **Alternative (any platform):**

```bash
pip install uv
```

- Verify installation:

```bash
uv --version  # Should show uv version
```

#### Install Google Cloud SDK

1. **Download and install gcloud CLI**
   - **macOS (Homebrew):**

```bash
brew install --cask google-cloud-sdk
```

- **Windows:** Download from [https://cloud.google.com/sdk/docs/install-sdk#windows](https://cloud.google.com/sdk/docs/install-sdk#windows)
- **Linux:**

```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

- Verify installation:

```bash
gcloud --version  # Should show gcloud SDK version
```

#### Install Stripe CLI (for billing setup)

1. **Download and install Stripe CLI**
   - **macOS (Homebrew):**

```bash
brew install stripe/stripe-cli/stripe
```

- **Ubuntu/Debian:**

```bash
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public |
gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg]
https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a
/etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

- **Windows (using Scoop):**

```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

💡 **Alternative:** You can also download the CLI directly from [GitHub releases](https://github.com/stripe/stripe-cli/releases/latest)

2. **Verify installation:**

```bash
stripe --version  # Should show Stripe CLI version
```

### Step 1.3: Setup Project Dependencies

**🤖 AI ASSISTANT TASK:**

I'll now help you set up the project dependencies. First, I need to verify we're in the correct project directory and install all dependencies.

```bash
# Verify we're in the root directory
pwd

# Install root dependencies
npm install

# Install web dependencies
npm run setup
```

Let me run these commands for you:

### Phase 1 Completion Check

Before proceeding to Phase 2, verify:

- ✅ Operating system identified and terminal shell configured (Mac/Linux only)
- ✅ Node.js (18+) and npm installed and verified
- ✅ Python (3.10+) and UV package manager installed and verified
- ✅ Google Cloud SDK installed and verified
- ✅ Stripe CLI installed and verified
- ✅ Project dependencies installed successfully
- ✅ All required development tools are properly configured

---

## Phase 2: Supabase Backend Setup

**Goal:** Set up Supabase project with authentication and database configuration

**🤖 AI Assistant will:**

- Guide database schema setup and migrations
- Generate customized email templates based on project docs
- Configure database extensions and security policies

**👤 User will:**

- Create Supabase project and configure settings
- **Copy API keys and credentials immediately to the `apps/web/.env.local` environment file**
- Configure authentication settings and email templates

### Step 2.1: Prepare Environment Files

**🤖 AI ASSISTANT TASK - Create Environment Files:**

Before setting up Supabase, I'll create the environment file for the web application.

```bash
# Create environment file for web app only
cp apps/web/.env.local.example apps/web/.env.local

# Verify file was created successfully
echo "✅ Checking environment file:"
ls -la apps/web/.env.local
```

**✅ Checkpoint:** Environment file is now ready:

- `apps/web/.env.local` - For the Next.js frontend

### Step 2.2: Create Supabase Account and Project

**👤 USER TASK - Create Supabase Account and Project:**

1. **Create Supabase Account**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign up/Sign in with GitHub, SSO, or email

2. **Create New Project**
   - Click **"New Project"**
   - Choose your organization (or create one)
   - Fill in project details:
   - **Organization:** [your-organization-name]
   - **Project Name:** [your-project-name]
   - **Compute Size:** Micro (or larger based on your needs, only available for Pro organizations)
   - **Region:** us-east-1 (or closest to your users)

   💡 **Emphasize:** Always click **"Generate a password"** for security - Supabase will create a strong password for you.

3. **Generate and Save Database Password**
   - Under the password field, click **"Generate a password"**
   - The password field will be filled with a random, strong password
   - Click the **"Copy"** button (clipboard icon to the right of the password field) to copy the password

   **🛑 STOP! Save the password immediately before continuing:**

   **Step 3a: Save the Password Temporarily**
   - Inside your IDE (VS Code, Cursor, etc.), go to the project folder
   - **Open the `apps/web/.env.local` file** we created earlier
   - **Look for this line at the top of the file:**

```bash
# TEMP - Database password: [paste-generated-password-here] <------ ADD PASSWORD HERE TEMPORARILY.
```

- **Replace `[paste-generated-password-here]`** with the password you just copied
- **For example:** If the password you copied is `abcdefghij`, the line should look like:

```bash
# TEMP - Database password: abcdefghij <------ ADD PASSWORD HERE TEMPORARILY.
```

- **Save the file** (Ctrl+S or Cmd+S)

**✅ Checkpoint:** Your `apps/web/.env.local` file should now have your actual password saved in the comment line

**🔐 Why we do this:** Supabase will show you this password only once. After you create the project, you won't be able to see it again. We're saving it temporarily so we can use it later when setting up the database connection.

4. **Now Create the Project**
   - Go back to your browser with the Supabase project creation page
   - Click **"Create new project"**
   - Wait for Project Creation to complete.

### Step 2.3: Configure Supabase URLs and Keys

**👤 USER TASK - Get Project URL and API Keys:**

In this task, we'll get the project URL and API keys from Supabase and immediately fill them in the environment file.

---

#### 🌐 **Configure Environment Variables (`apps/web/.env.local`)**

1. **Get Project URL**
   - Navigate to **Project Settings** on the left sidebar
   - Then click on **Data API** in the sub-menu
   - Copy the **Project URL** (e.g., `https://abcdefghij.supabase.co`)
   - **In your `apps/web/.env.local` file, immediately replace:**

```bash
SUPABASE_URL=https://abcdefghij.supabase.co
```

- **Now update Next.js configuration for image loading:**
  - Open `apps/web/next.config.ts` file (located in the `apps/web/` directory)
  - Extract just the hostname from your Supabase URL (e.g., from `https://abcdefghij.supabase.co` → `abcdefghij.supabase.co`)
  - Replace BOTH `hostname` entries in the `remotePatterns` array:

```typescript
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage - signed URLs (private buckets)
      {
        protocol: "https",
        hostname: "abcdefghij.supabase.co", // ← Replace with YOUR hostname
        port: "",
        pathname: "/storage/v1/object/sign/**",
      },
      // Supabase Storage - authenticated URLs (private buckets)
      {
        protocol: "https",
        hostname: "abcdefghij.supabase.co", // ← Replace with YOUR hostname
        port: "",
        pathname: "/storage/v1/object/authenticated/**",
      },
    ],
  },
};
```

💡 **Why both files?** The `.env.local` file connects your app to Supabase, while `next.config.ts` allows Next.js to display images from your Supabase storage. Both need the same project hostname.

2. **Get API Keys**
   - In the same **Project Settings** page, click on **API Keys** in the sub-menu
   - Copy the **anon public key** (starts with `eyJhbGciOiJIUzI1NiI...`)
   - **In your `apps/web/.env.local` file, immediately replace:**

```bash
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

- Copy the **service_role key** (starts with `eyJhbGciOiJIUzI1NiI...`)
- **In your `apps/web/.env.local` file, immediately replace:**

```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Get Database URL for Web App**
   - Click the **Connect** button in the top bar of your Supabase dashboard
   - In the "Connect to your project" modal, click on the **ORMs** tab
   - Select **Drizzle** from the dropdown
   - Copy the `DATABASE_URL` value from the code block shown
   - **In your web app's `apps/web/.env.local` file, update the DATABASE_URL:**

```bash
DATABASE_URL=your-database-url
```

- You should see a `[YOUR-PASSWORD]` placeholder in your DATABASE_URL value.
- **Use the saved password:** Go to the top of your `apps/web/.env.local` file and copy the database password from the temporary comment line
- **Replace `[YOUR-PASSWORD]` in DATABASE_URL** with the password from your comment
- Awesome! You've now configured the web app's database connection.

---

**✅ Checkpoint:** You now have your web app configured with Supabase

### Step 2.4: Configure Site URL and Redirect URLs

**👤 USER TASK - Configure Authentication Settings in Supabase:**

1. **Navigate to Authentication Settings**
   - In the Supabase platform, click **"Authentication"** in the left sidebar
   - Then click **"URL Configuration"** from the sub-menu
   - You should now see the URL configuration page

2. **Configure Site URL**
   - In the **Site URL** field, it should by default be set to: `http://localhost:3000`
   - If it's not, enter: `http://localhost:3000`
   - This tells Supabase where your application is running during development
   - Click **"Save"** to save this setting

3. **Add Redirect URLs**
   - Scroll down to the **Redirect URLs** section
   - Click **"Add URL"** button
   - Enter the following URL (make sure there are no spaces):

```bash
http://localhost:3000/auth/confirm
```

- Click **"Save"** to save this setting
- This URL handles email confirmations when users verify their accounts

💡 **Note**: The template handles email confirmations via `/auth/confirm` route only. No additional callback URLs are needed.

### Step 2.5: Customize Email Templates

**👤 USER TASK - Continue in Supabase Dashboard:**

**🔧 STILL IN SUPABASE DASHBOARD - Customize Email Templates**

1. **Navigate to Email Templates**
   - In your Supabase dashboard, click **"Authentication"** in the left sidebar
   - Then click **"Email Templates"** from the sub-menu (you may see it listed as "Emails")
   - You should now see the email templates configuration page

2. **Review Email Templates**
   - You'll see several template tabs at the top of the page
   - The most important ones for this RAG SaaS template are **"Confirm signup"** and **"Reset password"**
   - These templates control what emails users receive for account verification and password resets

3. **🛑 CHECKPOINT - Confirm Supabase Dashboard Configuration Complete**

   **Before proceeding to email template generation, please confirm you have completed all the Supabase dashboard steps:**
   - ✅ **Site URL** set to `http://localhost:3000`
   - ✅ **Redirect URL** added: `http://localhost:3000/auth/confirm`
   - ✅ **Email templates page** is now open in your browser

   **Are you ready to proceed with email template customization? The AI assistant will now generate custom email templates for your RAG SaaS application.**

4. **🤖 AI ASSISTANT TASK - Generate Email Templates (Only After User Approval)**
   **You (the AI assistant) must now read these files before proceeding:**
   - Read `ai_docs/prep/app_name.md`
   - Read `ai_docs/prep/master_idea.md`
   - Read `ai_docs/prep/ui_theme.md`

   **After reading both files, generate the "Confirm signup" template using this prompt:**

   ```
   Based on the app_name.md, master_idea.md and ui_theme.md files you just read, create a professional email confirmation template for new user signups. Generate a copiable element for both:

   1. Subject line: "Confirm Your Signup to [App Name]"
   2. Simple HTML email with:
      - Brief welcome message
      - One simple button using {{ .ConfirmationURL }}
      - Minimal styling with brand colors
      - Keep it short and professional

   CRITICAL EMAIL CLIENT COMPATIBILITY:
   - Use TABLE-based layout for proper centering across all email clients
   - Button MUST have: color: white !important; text-decoration: none !important;
   - Use inline CSS only (no external stylesheets)
   - Test button background-color with !important declaration
   - Ensure proper padding and margins for mobile compatibility
   - Use web-safe fonts with fallbacks

   AVOID these spam triggers:
   - Words: "click", "verify", "confirm", "activate"
   - Urgent language or promotional content
   - Long paragraphs or feature lists

   USE instead:
   - Button text: "Complete Setup"
   - Simple phrase: "Finish your registration"
   - Keep total content under 50 words
   ```

   **Then generate the "Reset password" template using this prompt:**

   ```
   Following the same style as the "Confirm signup" template, create a simple password reset template. Generate both:

   1. Subject line: "Reset Your [App Name] Password"
   2. Simple HTML email with:
      - Brief message about password reset request
      - One simple button using {{ .ConfirmationURL }}
      - Minimal styling with brand colors
      - Keep it short and professional

   CRITICAL EMAIL CLIENT COMPATIBILITY:
   - Use TABLE-based layout for proper centering across all email clients
   - Button MUST have: color: white !important; text-decoration: none !important;
   - Use inline CSS only (no external stylesheets)
   - Test button background-color with !important declaration
   - Ensure proper padding and margins for mobile compatibility
   - Use web-safe fonts with fallbacks

   Button text: "Reset Password"
   Keep total content under 25 words
   ```

   **Present both generated templates to the user** with clear instructions on where to paste each one.

5. **👤 USER TASK - Apply Templates in Supabase Dashboard**

   **🔧 STILL IN SUPABASE DASHBOARD - Apply Generated Email Templates**
   - **For Confirm signup template:**
     - In your Supabase email templates page, click the **"Confirm signup"** tab
     - Replace the existing **Subject** field with the generated subject line
     - Replace the existing **Message body** field with the generated HTML template
     - Click **"Save"** to save the template
   - **For Reset password template:**
     - Click the **"Reset password"** tab in the same page
     - Replace the existing **Subject** field with the generated subject line
     - Replace the existing **Message body** field with the generated HTML template
     - Click **"Save"** to save the template

   💡 **Important:** The AI assistant will generate both complete email templates directly for you. Simply copy and paste them into the appropriate fields in your Supabase dashboard.

### Step 2.7: Enable pgvector and pg_cron Extensions

**👤 USER TASK - Continue in Supabase Dashboard:**

**🔧 STILL IN SUPABASE DASHBOARD - Enable Database Extensions**

Before running migrations, you need to enable the required database extensions:

1. **Navigate to Database Extensions**
   - In your Supabase dashboard, click **"Database"** in the left sidebar
   - Then click **"Extensions"** from the sub-menu
   - You should now see the database extensions page

2. **Enable pgvector Extension**
   - In the search box, type **"vector"**
   - You'll see the **"vector"** extension in the results
   - Click the **toggle switch** next to "vector" to enable it
   - Click on **"Enable extension"** in the opened modal
   - The extension should now show as "Enabled"

3. **Enable pg_cron Extension**
   - Clear the search box and type **"pg_cron"**
   - You'll see the **"pg_cron"** extension in the results
   - Click the **toggle switch** next to "pg_cron" to enable it
   - Click on **"Enable extension"** in the opened modal
   - The extension should now show as "Enabled"

4. **Confirm Extensions are Active**
   - Both pgvector and pg_cron extensions are now ready
   - pgvector enables storing and searching vector embeddings
   - pg_cron enables automated database maintenance tasks
   - You can proceed to the next step (database migrations)

💡 **Important:** These extensions are required for the RAG functionality - pgvector allows storing and searching document embeddings, while pg_cron handles automated cleanup tasks.

### Step 2.8: Database Schema Setup

**🤖 AI ASSISTANT TASK:**

I'll now set up the database schema with pgvector extension and all required tables. Let me run the database migrations:

**🚨 CRITICAL: ALWAYS VERIFY WORKING DIRECTORY FIRST**

```bash
# STEP 1: ALWAYS verify we're in the correct directory
pwd
# Expected output: /path/to/project/apps/web

# STEP 2: If not in apps/web, change directory
cd apps/web

# STEP 3: Generate any pending migrations (ONLY from apps/web directory)
npm run db:generate
```

**First, generate down migrations before applying the schema:**

**🤖 AI ASSISTANT TASK - Generate rollback migration:**

💡 **Note:** Ensure you read the Drizzle Down Migration template located at `ai_docs/templates/drizzle_down_migration.md` before generating the down migration.

Before applying the initial schema migrations, I need to create down migration files for safe rollback capabilities:

1. **Identify the generated migration file:**

```bash
# STEP 1: ALWAYS verify we're in apps/web directory
pwd
# Expected output: /path/to/project/apps/web

# STEP 2: Find the most recent migration file (ONLY from apps/web directory)
ls -la drizzle/migrations/*.sql | tail -1
```

2. **Generate down migration using the template:**
   Read the Drizzle Down Migration template located at `ai_docs/templates/drizzle_down_migration.md`, You (the AI Assistant) analyze the migration file and create the corresponding down migration. This ensures we can safely rollback the schema changes if needed.

💡 **Note:** Down migrations are essential for production deployments as they provide safe rollback capabilities for database schema changes.

**Now apply the migrations:**

```bash
# STEP 1: ALWAYS verify we're in apps/web directory
pwd
# Expected output: /path/to/project/apps/web

# STEP 2: Run database migrations (ONLY from apps/web directory)
npm run db:migrate

# STEP 3: Check migration status (ONLY from apps/web directory)
npm run db:status
```

**Expected Output of the migrations:**

```
🚀 Running migrations...
🔍 Checking rollback safety: 0 migration found
✅ All migrations have rollback files
📁 Migration folder: drizzle/migrations
✅ Migrations completed successfully!
🔌 Database connection closed
```

### Step 2.9: Set Up User Creation Trigger

**🤖 AI ASSISTANT TASK - Set up the user trigger:**

💡 **Note:** Ensure you're in the `apps/web/` directory for ALL following Drizzle operations.

1. **Create User Trigger Migration**

```bash
# STEP 1: ALWAYS verify we're in apps/web directory
pwd
# Expected output: /path/to/project/apps/web

# STEP 2: Generate custom migration (ONLY from apps/web directory)
npm run db:generate:custom
```

2. **Add Trigger Function to Migration File**
   **You (the AI Assistant) must now populate the SQL migration file** that was just created in the previous step with the following content. This SQL creates the function and trigger.
   Open the generated migration file and add the following content:

```sql
-- Create the trigger function that handles new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
   INSERT INTO public.users (id, email, full_name, created_at, updated_at)
   VALUES (
      new.id,
      new.email,
      COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
      now(),
      now()
   );
   RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
   AFTER INSERT ON auth.users
   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

3. **Generate Down Migration for User Trigger**
   Read the Drizzle Down Migration template located at `ai_docs/templates/drizzle_down_migration.md`, You (the AI Assistant) create the down migration for the user creation trigger:

```bash
# The down migration will include:
# - DROP TRIGGER IF EXISTS on_auth_user_created;
# - DROP FUNCTION IF EXISTS public.handle_new_user();
```

4. **Apply the Trigger Migration**

```bash
# STEP 1: ALWAYS verify we're in apps/web directory
pwd
# Expected output: /path/to/project/apps/web

# STEP 2: Apply the trigger migration (ONLY from apps/web directory)
npm run db:migrate
```

**Expected Output:**

```
🚀 Running migrations...
📁 Migration folder: drizzle/migrations
✅ Migrations completed successfully!
🔌 Database connection closed
```

5. **👤 USER TASK - Verify Database Tables in Supabase**

   **🔧 BACK TO SUPABASE DASHBOARD - Verify Database Schema**
   - In your Supabase dashboard, click **"Table Editor"** in the left sidebar
   - You should now see the database tables page with the following tables created:
     - `users` - User profiles with Stripe billing integration and subscription tiers
     - `documents` - Document metadata, file paths, and processing status
     - `document_chunks` - Processed text chunks with vector embeddings (text + multimodal)
     - `document_processing_jobs` - Background job tracking with detailed processing stages
     - `conversations` - Chat conversation records linked to users
     - `messages` - Individual chat messages with model tracking
     - `user_usage` - Usage tracking for billing periods and message limits
     - `webhook_events` - Stripe webhook event processing for idempotency

   💡 **If you don't see these tables:** The migrations may not have completed successfully. Check the terminal output for any errors. Ask the AI assistant to check the status of the migrations and fix any issues.

### Step 2.10: Set Up RPC Functions for Vector Search

**🤖 AI ASSISTANT TASK - Set up the RPC functions for multimodal RAG:**

The RAG-SaaS template includes two specialized RPC functions for high-performance vector similarity search with multimodal capabilities.

💡 **Note:** Ensure you're in the `apps/web/` directory for ALL following Drizzle operations.

1. **Create RPC Functions Migration**

```bash
# STEP 1: ALWAYS verify we're in apps/web directory
pwd
# Expected output: /path/to/project/apps/web

# STEP 2: Generate custom migration (ONLY from apps/web directory)
npm run db:generate:custom
```

2. **Add RPC Functions to Migration File**
   **You (the AI Assistant) must now populate the SQL migration file** that was just created in the previous step with the following content. These functions enable high-performance vector search.
   Open the generated migration file and add the following content:

```sql
-- RPC Function 1: Vector Search for Text Embeddings (768 dimensions)
-- Performs vector similarity search with user-level access control
-- Uses embedding column existence for natural filtering
-- Returns both content (transcription) and context (visual descriptions) for multimodal RAG
CREATE OR REPLACE FUNCTION match_text_chunks (
      query_embedding vector(768),
      p_user_id uuid,
      p_match_threshold float DEFAULT 0.7,
      p_match_count int DEFAULT 10
)
RETURNS TABLE (
      chunk_id uuid,
      document_id uuid,
      content text,
      context text,
      similarity float,
      metadata jsonb,
      document_filename text,
      created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
      RETURN QUERY
      SELECT
         dc.id as chunk_id,
         dc.document_id,
         dc.content,
         dc.context,
         (1 - (dc.text_embedding <=> query_embedding)) as similarity,
         dc.metadata,
         d.original_filename as document_filename,
         dc.created_at
      FROM
         document_chunks dc
      INNER JOIN
         documents d ON dc.document_id = d.id
      WHERE
         -- CRITICAL: User scoping first
         dc.user_id = p_user_id
         AND d.status = 'completed'
         -- Text embedding existence check (natural filtering)
         AND dc.text_embedding IS NOT NULL
         -- Similarity threshold
         AND (1 - (dc.text_embedding <=> query_embedding)) > p_match_threshold
      ORDER BY
         similarity DESC
      LIMIT p_match_count;
END;
$$;

-- RPC Function 2: Vector Search for Multimodal Embeddings (1408 dimensions)
-- Performs vector similarity search for combined visual + text content
-- Uses embedding column existence for natural filtering
-- Returns both content (transcription) and context (visual descriptions) for multimodal RAG
CREATE OR REPLACE FUNCTION match_multimodal_chunks (
      query_embedding vector(1408),
      p_user_id uuid,
      p_match_threshold float DEFAULT 0.7,
      p_match_count int DEFAULT 10
)
RETURNS TABLE (
      chunk_id uuid,
      document_id uuid,
      content text,
      context text,
      similarity float,
      metadata jsonb,
      document_filename text,
      created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
      RETURN QUERY
      SELECT
         dc.id as chunk_id,
         dc.document_id,
         dc.content,
         dc.context,
         (1 - (dc.multimodal_embedding <=> query_embedding)) as similarity,
         dc.metadata,
         d.original_filename as document_filename,
         dc.created_at
      FROM
         document_chunks dc
      INNER JOIN
         documents d ON dc.document_id = d.id
      WHERE
         -- CRITICAL: User scoping first
         dc.user_id = p_user_id
         AND d.status = 'completed'
         -- Multimodal embedding existence check (natural filtering)
         AND dc.multimodal_embedding IS NOT NULL
         -- Similarity threshold
         AND (1 - (dc.multimodal_embedding <=> query_embedding)) > p_match_threshold
      ORDER BY
         similarity DESC
      LIMIT p_match_count;
END;
$$;
```

3. **Generate Down Migration for RPC Functions**
   Read the Drizzle Down Migration template located at `ai_docs/templates/drizzle_down_migration.md`, You (the AI Assistant) create the down migration for the RPC functions:

```bash
# The down migration will include:
# - DROP FUNCTION IF EXISTS match_multimodal_chunks;
# - DROP FUNCTION IF EXISTS match_text_chunks;
```

4. **Apply the RPC Functions Migration**

```bash
# STEP 1: ALWAYS verify we're in apps/web directory
pwd
# Expected output: /path/to/project/apps/web

# STEP 2: Apply the RPC functions migration (ONLY from apps/web directory)
npm run db:migrate
```

**Expected Output:**

```
🚀 Running migrations...
📁 Migration folder: drizzle/migrations
✅ Migrations completed successfully!
🔌 Database connection closed
```

5. **👤 USER TASK - Verify RPC Functions in Supabase**

   **🔧 BACK TO SUPABASE DASHBOARD - Verify Vector Search Functions**
   - In your Supabase dashboard, click **"Database"** in the left sidebar
   - Then click **"Functions"** from the sub-menu
   - Search for **"match_text_chunks"** and **"match_multimodal_chunks"** in the search bar
   - You should see the two newly created RPC functions:
     - `match_text_chunks` - For text-only embedding searches (768 dimensions)
     - `match_multimodal_chunks` - For multimodal embedding searches (1408 dimensions)

   💡 **If you don't see these functions:** The RPC migration may not have completed successfully. Check the terminal output for any errors. Ask the AI assistant to check the status of the migrations and fix any issues.

**💡 Key Features:** These RPC functions provide high-performance vector search for both text and multimodal content which is essential for the RAG-SaaS application.

### Step 2.11: Set Up Document Timeout Cleanup

**🤖 AI ASSISTANT TASK - Set up automated cleanup for stuck documents:**

This creates an automated system that monitors document processing status and marks stuck documents as failed after a timeout period, providing users with actionable error messages.

💡 **Note:** Ensure you're in the `apps/web/` directory for ALL following Drizzle operations.

1. **Create Document Cleanup Migration**

```bash
# STEP 1: ALWAYS verify we're in apps/web directory
pwd
# Expected output: /path/to/project/apps/web

# STEP 2: Generate custom migration (ONLY from apps/web directory)
npm run db:generate:custom
```

2. **Add Cleanup Function to Migration File**
   **You (the AI Assistant) must now populate the SQL migration file** that was just created in the previous step with the following content. This function creates an automated cleanup job.
   Open the generated migration file and add the following content:

```sql
-- Custom migration: Set up document timeout cleanup with pg_cron
-- This migration creates an automated cleanup job that runs every 3 minutes
-- to identify documents stuck in "processing" status for over 65 minutes (1 hour 5 minutes)
-- and marks them as "error" with actionable user messaging

-- Schedule cleanup job to run every 3 minutes
SELECT cron.schedule(
  'cleanup-stuck-documents',
  '*/3 * * * *',  -- Every 3 minutes
  $$
  UPDATE documents
  SET status = 'error',
      updated_at = CURRENT_TIMESTAMP,
      processing_error = 'Upload processing failed due to timeout. Please delete this document and upload it again. Large files may take longer to process.'
  WHERE status = 'processing'
    AND updated_at < NOW() - INTERVAL '65 minutes';
  $$
);
```

3. **Generate Down Migration for Cleanup Function**
   Read the Drizzle Down Migration template located at `ai_docs/templates/drizzle_down_migration.md`, You (the AI Assistant) create the down migration for the cleanup function:

```sql
-- Down migration: Remove document timeout cleanup job
SELECT cron.unschedule('cleanup-stuck-documents');
```

4. **Apply the Cleanup Migration**

```bash
# STEP 1: ALWAYS verify we're in apps/web directory
pwd
# Expected output: /path/to/project/apps/web

# STEP 2: Apply the cleanup migration (ONLY from apps/web directory)
npm run db:migrate
```

**Expected Output:**

```
🚀 Running migrations...
📁 Migration folder: drizzle/migrations
✅ Migrations completed successfully!
🔌 Database connection closed
```

5. **👤 USER TASK - Verify Cleanup Job in Supabase**

   **🔧 BACK TO SUPABASE DASHBOARD - Verify Automated Cleanup**
   - In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
   - Create a new query and run the following SQL to verify the cleanup job is scheduled:

```sql
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname = 'cleanup-stuck-documents';
```

- You should see one row with:
  - `jobname`: cleanup-stuck-documents
  - `schedule`: _/3 _ \* \* \*
  - `active`: true

💡 **If you don't see the scheduled job:** The cleanup migration may not have completed successfully. Check the terminal output for any errors. Ask the AI assistant to check the status of the migrations and fix any issues.

**💡 Key Features of the Document Cleanup System:**

- **🕐 Frequent Monitoring**: Checks every 3 minutes for quick user feedback
- **⏰ Generous Timeout**: 65-minute threshold prevents false positives on large files
- **💬 Actionable Messages**: Clear error message with recovery instructions
- **🔄 Automated Recovery**: No manual intervention required for stuck documents
- **🛡️ Production Ready**: Built-in safety with proper timeout handling

**🛑 CHECKPOINT:** Confirm you have completed:

- ✅ Supabase project created successfully
- ✅ `.env.local` file created and populated with actual Supabase values
- ✅ `next.config.ts` hostname updated with Supabase project hostname
- ✅ Database URL includes specific project credentials
- ✅ Site URL configured to `http://localhost:3000`
- ✅ Redirect URL added: `http://localhost:3000/auth/confirm`
- ✅ Authentication flow explained and understood
- ✅ Email templates customized (optional but recommended)
- ✅ Database schema applied (pgvector and pg_cron extensions, tables, RLS policies)
- ✅ RPC functions created for multimodal vector search
- ✅ Document timeout cleanup system configured and active
- ✅ Down migrations generated for all schema changes (rollback safety)

---

## Phase 3: Storage Configuration

**Goal:** Set up image storage bucket and security policies

**🤖 AI Assistant will:**

- Run storage setup script
- Generate and apply RLS policies
- Verify storage configuration

**👤 User will:**

- Update Next.js configuration with Supabase hostname
- Verify bucket creation in Supabase dashboard

### Step 3.1: Set Up Image Storage Bucket

**🤖 AI ASSISTANT TASK - Execute storage setup:**

1. **Run Storage Setup Script**
   💡 **Note:** Ensure you're in the `apps/web/` directory for storage setup operations.

```bash
# STEP 1: ALWAYS verify we're in apps/web directory
pwd
# Expected output: /path/to/project/apps/web

# STEP 2: Run storage setup (ONLY from apps/web directory)
npm run storage:setup
```

**Expected Output:**

```
🚀 Setting up chat image storage...
✅ Storage bucket 'chat-images' created successfully (PRIVATE)
🔒 Note: RLS policies need to be created via database migration
📋 Run the following command to create storage policies:
npm run db:migrate
💡 The storage policies will be created in the next migration file.
🎉 Chat image storage setup complete!
📁 Bucket: chat-images (PRIVATE)
🔐 Access: Signed URLs with 24-hour expiration
📏 Size limit: 10MB per file
🖼️ Allowed types: JPEG, PNG
✨ Setup completed successfully!
```

💡 **Note:** The script creates the bucket but note that RLS policies need to be created via database migration.

### Step 3.2: Set Up Storage Row Level Security Policies

**🤖 AI ASSISTANT TASK - Set up RLS policies:**

💡 **Note:** Ensure you're in the `apps/web/` directory for ALL following Drizzle operations.

1. **Create Storage Policies Migration**

```bash
# STEP 1: ALWAYS verify we're in apps/web directory
pwd
# Expected output: /path/to/project/apps/web

# STEP 2: Generate custom migration (ONLY from apps/web directory)
npm run db:generate:custom
# If prompted, enter: add_storage_rls_policies
```

2. **Add RLS Policies to Migration File**
   **You (the AI Assistant) must now populate the SQL migration file** that was just created in the previous step with the following content. These policies secure your storage bucket.
   Open the generated migration file and add the following content:

```sql
-- Custom migration: Create RLS policies for chat-images storage bucket
-- This migration sets up Row Level Security policies for the chat-images bucket
-- to ensure users can only access their own uploaded images
-- File path structure: images/{userId}/{filename}
-- So userId is at folder index [2]

-- Policy 1: Users can upload to their own folder
CREATE POLICY "Users can upload own images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
   bucket_id = 'chat-images' AND
   auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy 2: Users can view their own images
CREATE POLICY "Users can view own images" ON storage.objects
FOR SELECT TO authenticated
USING (
   bucket_id = 'chat-images' AND
   auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy 3: Users can delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE TO authenticated
USING (
   bucket_id = 'chat-images' AND
   auth.uid()::text = (storage.foldername(name))[2]
);
```

3. **Generate Down Migration for Storage Policies**
   Read the Drizzle Down Migration template located at `ai_docs/templates/drizzle_down_migration.md`, You (the AI Assistant) create the down migration for the storage policies:

```bash
# The down migration will include:
# - DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
# - DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
# - DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
```

4. **Apply Storage Policies**

```bash
# STEP 1: ALWAYS verify we're in apps/web directory
pwd
# Expected output: /path/to/project/apps/web

# STEP 2: Apply storage policies migration (ONLY from apps/web directory)
npm run db:migrate
```

**Expected Output:**

```
🚀 Running migrations...
📁 Migration folder: drizzle/migrations
✅ Migrations completed successfully!
🔌 Database connection closed
```

### Phase 3 Completion Check

Before proceeding to Phase 4, verify:

- ✅ Storage setup script executed successfully
- ✅ `chat-images` bucket created in Supabase
- ✅ RLS policies migration created and applied
- ✅ Down migration generated for storage policies (rollback safety)
- ✅ Storage policies visible in Supabase Dashboard
- ✅ Image storage is ready for testing

---

## Phase 4: Web Application Setup

**Goal:** Set up Next.js web application with chat interface

**🤖 AI Assistant will:**

- Install web application dependencies
- Run the development server
- Test the chat interface and database connections

**👤 User will:**

- Test user registration and authentication
- Verify chat functionality

### Step 4.1: Start Web Application

**🤖 AI ASSISTANT TASK:**

I'll now start the web application and verify everything is working:

```bash
# STEP 1: ALWAYS verify we're in apps/web directory
pwd
# Expected output: /path/to/project/apps/web

# STEP 2: Ensure we're in the web app directory (if not already there)
cd apps/web

# STEP 3: Start the development server
npm run dev
```

The application should now be running at `http://localhost:3000`.

Let me also verify the database connection:

```bash
# STEP 1: ALWAYS verify we're in apps/web directory
pwd
# Expected output: /path/to/project/apps/web

# STEP 2: Check database connection (ONLY from apps/web directory)
npm run db:status
```

### Step 4.2: Verify Web Application

**👤 USER TASK - Basic Functionality Check:**

1. **Verify application loads**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Confirm the landing page loads without errors
   - Check that the page displays correctly

2. **Test basic authentication flow**
   - Click **"Sign Up"** or **"Get Started"**
   - Verify the registration form loads
   - Click **"Login"** link
   - Verify the login form loads

3. **Create a test account**
   - Use a real email address (you'll need to verify it)
   - Choose a secure password
   - Complete the registration process

4. **Verify email**
   - Check your email for verification link
   - Click the verification link
   - You should be redirected back to the app

#### Test Authentication

1. **Login and logout**
   - Test the login process with your new account
   - Verify you can log out and log back in
   - Check that authentication state persists

2. **Test protected routes**
   - Try accessing `/chat` - should work when logged in
   - Log out and try accessing `/chat` - should redirect to login

**🛑 CHECKPOINT:** Confirm you have completed:

- ✅ Web application running on localhost:3000
- ✅ Landing page loads correctly
- ✅ Authentication forms are accessible
- ✅ No major errors in browser console

_Note: We'll test the full authentication flow and document processing after setting up the complete infrastructure._

---

## Phase 5: Google Cloud Platform Setup

**Goal:** Set up GCP project with required services for the RAG processor

**🤖 AI Assistant will:**

- Run GCP setup scripts
- Configure service accounts and permissions
- Set up storage buckets and EventArc triggers

**👤 User will:**

- Create GCP project and enable billing
- Authenticate to Google Cloud using `gcloud auth application-default login`
- Configure gcloud CLI with project from environment file
- Get Gemini API key and update environment files immediately

### Step 5.1: Create Google Cloud Account and Project

**👤 USER TASK - Create Google Cloud Account and Project:**

#### Create Google Cloud Account

1. **Create Google Cloud account** (if you don't have one)
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account
   - Accept terms of service if first time
   - **Important:** You'll need to enable billing (Google provides $300 free credits)

#### Create New Project

2. **Create new project**
   - Click the project selector next to the search bar (top-left)
   - Click **"New Project"**
   - Fill in details:

```
Project name: rag-saas-app (or your preferred name)
Organization: [your organization or leave default]
```

- Click **"Create"**

3. **Select the project in the project selector**
   - Click the project selector next to the search bar (top-left)
   - Click on the project you just created

4. **📝 IMPORTANT: Note your Project ID**
   - Copy the exact **Project ID** (not the display name)
   - **Immediately update your web app environment file in `apps/web/.env.local`**

```bash
GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
```

#### Enable Billing

1. **Set up billing account**
   - Go to [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing)
   - Click **"Add billing account"**
   - Follow the prompts to:
     - Name your billing account
     - Select your country
     - Add a valid credit/debit card (for verification)
   - Complete verification (Google may place a small temporary charge $0-$1 to verify your payment method)
   - Once confirmed, your billing account is active (Google provides $300 in free credits for new accounts)

2. **Link project to billing**
   - Go to **Billing** → **My Projects**
   - Find your project and click **"SET ACCOUNT"**
   - Select your billing account

### Step 5.2: Authenticate to Google Cloud (via gcloud CLI)

**👤 USER & 🤖 AI ASSISTANT TASK - Authenticate to Google Cloud (via gcloud CLI):**
**AI ASSISTANT will run the commands, and the USER will interact with the prompts.**

The AI assistant will run the `gcloud auth application-default login` command. Make sure to follow the prompts:

1. Authenticate in the browser
2. Grant the necessary permissions
3. You should see a confirmation that authentication was successful

```bash
# Authenticate to Google Cloud (this will open a browser)
gcloud auth application-default login
```

### Step 5.3: Configure gcloud CLI

**👤 USER & 🤖 AI ASSISTANT TASK - Configure gcloud:**
**AI ASSISTANT will run the commands, and the USER will interact with the prompts.**

**🤖 AI ASSISTANT TASK - Authenticate and Configure gcloud:**

1. **Set Project from Environment File**

```bash
# Get project ID from environment file
grep "GOOGLE_CLOUD_PROJECT_ID=" apps/web/.env.local

# Set the project (AI will extract the project ID from the environment file)
PROJECT_ID=$(grep "GOOGLE_CLOUD_PROJECT_ID=" apps/web/.env.local | cut -d'=' -f2)
gcloud config set project $PROJECT_ID
```

2. **Verify setup:**

```bash
# Verify your project is set correctly
gcloud config get-value project
# Should show your project ID from the environment file
```

### Step 5.4: Get Gemini API Key

**👤 USER TASK - Configure Gemini API:**

1. **Create Gemini API Key**
   - Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - Click **"Create API Key"**
   - Search for your Google Cloud project and select it
   - Click **"Create API key in existing project"**
   - **📝 Copy the API key** (starts with `AIza...`)

2. **📋 Update your web app environment file immediately in `apps/web/.env.local`:**

```bash
GEMINI_API_KEY=your-gemini-api-key
```

**🔑 Important:** The web app handles all AI functionality. Backend services get configuration automatically during deployment.

### Step 5.5: Verify gcloud CLI Setup

**🛑 CHECKPOINT - Confirm Previous Steps Completed:**

Before proceeding with gcloud CLI verification, please confirm you have completed all previous steps:

- ✅ **Step 5.1:** Created Google Cloud Project and enabled billing
- ✅ **Step 5.2 & 5.3:** Authenticated gcloud CLI and configured project from environment file
- ✅ **Step 5.4:** Created Gemini API key and updated the `apps/web/.env.local` file with:
  - `GEMINI_API_KEY=your-actual-gemini-api-key`

**Please confirm you have completed all the above steps and you're ready to proceed with gcloud CLI verification.**

**🤖 AI ASSISTANT TASK (Only after user approval):**

Once you (the user) confirm completion of the previous steps, I'll verify that gcloud CLI is properly configured before running the setup script:

```bash
# Test that we can access the project
gcloud projects describe $(gcloud config get-value project)

# Verify authentication
gcloud auth list

# Check current configuration
gcloud config list
```

### Step 5.5: Run GCP Setup Script

**👤 USER ACTION REQUIRED:**
After I run the setup script, you'll need to:

1. **Click on the terminal window** that Cursor opens
2. **Follow the interactive prompts** in the terminal (e.g., "Overwrite this file? [y/N]")
3. **When asked for "Pooled PostgreSQL URL (port 6543)"**, enter the URL from your `apps/web/.env.local` file:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:6543/postgres
```

4. **When asked for "Gemini API Key"**, enter the API key from your `apps/web/.env.local` file:

```bash
GEMINI_API_KEY=your-gemini-api-key
```

5. **Wait for the script to complete** - it will show a success summary at the end

This script will:

- ✅ Enable required Google Cloud APIs (Storage, AI Platform, Secret Manager, etc.)
- ✅ Create storage buckets for document processing
- ✅ Set up service accounts and IAM permissions
- ✅ Configure EventArc triggers for file processing
- ✅ Store sensitive data in Google Secret Manager
- ✅ Set up development environment configuration

**🤖 AI ASSISTANT TASK:**

I'll now start the GCP setup script that will configure all required services. **Note: This script requires user interaction.**

```bash
# STEP 1: Make sure we're in the root directory
pwd

# STEP 2: Run the GCP setup script
npm run setup:gcp:dev
```

### Step 5.6: Update Environment Files with Script Output

**👤 USER TASK - Copy Values from Final Success Summary:**

After the GCP setup script completes successfully, it will display a comprehensive success summary at the END. Look for this section in the final output:

```
🎉 DEVELOPMENT INFRASTRUCTURE SETUP SUCCESSFUL! 🎉
========================================================================

📋 Infrastructure Summary:
  • Storage Bucket: gs://your-project-id-rag-documents-dev
```

**📋 Copy storage bucket name to environment file:**

#### 🌐 **Web App Environment File (`apps/web/.env.local`)**

```bash
GOOGLE_CLOUD_STORAGE_BUCKET=your-project-id-rag-documents-dev
```

**If the script encounters any issues, I'll help troubleshoot and run individual setup commands.**

**🛑 CHECKPOINT:** Confirm you have completed:

- ✅ GCP project created and billing enabled
- ✅ gcloud CLI authenticated and configured
- ✅ Project ID updated in environment file
- ✅ Gemini API key configured in environment file
- ✅ Storage bucket name updated in environment file
- ✅ GCP setup script completed successfully
- ✅ All required APIs enabled

---

## Phase 6: RAG Processing Services Deployment

**Goal:** Deploy the RAG processing services (processor, GCS handler, task processor)

**🤖 AI Assistant will:**

- Deploy the RAG processor to Cloud Run Jobs
- Deploy the GCS handler Cloud Function for file events
- Deploy the task processor Cloud Function for queue processing
- Configure EventArc triggers and Cloud Tasks queues
- Set up monitoring and logging

**👤 User will:**

- Verify deployment in GCP console
- Update web app environment with service account key

### Step 6.1: Verify Authentication Key Setup

**💡 What's happening here (in simple terms):**

- ✅ Your GCP setup script should have automatically created a "service account" and authentication key
- 🔑 We'll verify this worked properly, or fix it manually if needed

**🤖 AI ASSISTANT TASK:**

I'll check if the GCP setup script already updated both environment files with the authentication key:

```bash
# Check RAG processor environment file
grep "GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY=" apps/rag-processor/.env.local

# Check web app environment file
grep "GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY=" apps/web/.env.local
```

**✅ IF both files show a long base64 string (not empty or placeholder values):**

- Great! Both environment files are properly configured with authentication keys. We will move to Step 6.2.

**❌ IF either file is missing, empty, or has placeholder values AND ONLY IN THAT CASE:**

- The authentication keys weren't automatically created. I'll create them manually for you now:

```bash
# Create authentication key manually for the EXISTING service account
PROJECT_ID=$(gcloud config get-value project)
gcloud iam service-accounts keys create web-app-service-account-key.json \
    --iam-account=rag-processor-dev@$PROJECT_ID.iam.gserviceaccount.com

# Convert the key to base64 format (required for environment variables)
cat web-app-service-account-key.json | base64 -w 0 > web-app-service-account-key.json.base64

# Display the base64 key for user to copy
echo "📝 Copy this base64 authentication key:"
cat web-app-service-account-key.json.base64

# Clean up
rm web-app-service-account-key.json
```

**👤 USER TASK - Manual Update (ONLY IN CASE THAT THE AUTOMATIC SETUP DID NOT UPDATE THE ENVIRONMENT FILES):**

After the command above runs, **immediately copy the long base64 string** and save it in your web app's environment file:

#### 📁 **Update RAG Processor Environment (`apps/rag-processor/.env.local`)**

```bash
GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY=your_actual_base64_authentication_key_here
```

#### 🌐 **Update Web App Environment (`apps/web/.env.local`)**

```bash
GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY=your_actual_base64_authentication_key_here
```

**🛑 STOP AND WAIT FOR USER APPROVAL IN CASE THAT THE AUTOMATIC SETUP DID NOT UPDATE THE ENVIRONMENT FILES:**
Did you copy the base64 authentication key and update the environment files `apps/rag-processor/.env.local` and `apps/web/.env.local`?

---

**🔒 Simple Explanation:**

- **RAG processor (Cloud):** Uses the service account automatically ✅
- **Web app (Local):** Needs this key file to prove it's the same account 🔑
- **Result:** Both apps can access Google Cloud Storage with the same permissions 🎯

### Step 6.2: Deploy RAG Processor

**🤖 AI ASSISTANT TASK:**

I'll now deploy the RAG processor service to Google Cloud Run:

```bash
# STEP 1: Make sure you're in the root folder
pwd

# STEP 2: Run the deployment script
npm run deploy:processor:dev
```

This deployment will:

- ✅ Build Docker container with all dependencies
- ✅ Push container to Google Container Registry
- ✅ Deploy to Cloud Run with appropriate resources
- ✅ Configure environment variables and secrets
- ✅ Set up EventArc triggers for automatic processing
- ✅ Configure monitoring and logging

### Step 6.3: Deploy GCS Handler Function

**🤖 AI ASSISTANT TASK:**

Deploy the GCS handler function for file processing events:

```bash
# STEP 1: Make sure you're in the root folder
pwd

# STEP 2: Deploy the GCS handler function
npm run deploy:gcs-handler:dev
```

This deployment will:

- ✅ Deploy GCS event handler Cloud Function Gen-2
- ✅ Configure EventArc trigger for GCS file uploads
- ✅ Set up Cloud Tasks for asynchronous processing
- ✅ Enable database operations for file tracking

### Step 6.4: Deploy Task Processor Function

**🤖 AI ASSISTANT TASK:**

Deploy the task processor function for queue consumption:

```bash
# STEP 1: Make sure you're in the root folder
pwd

# STEP 2: Deploy the task processor function
npm run deploy:task-processor:dev
```

This deployment will:

- ✅ Deploy task processor Cloud Function Gen-2
- ✅ Set up Cloud Tasks queue consumption
- ✅ Configure Cloud Run Job execution
- ✅ Enable idempotent task processing

### Step 6.5: Verify Deployment

**👤 USER TASK - Verify in GCP Console:**

#### Check Cloud Run Service

1. **Navigate to Cloud Run**
   - Go to [https://console.cloud.google.com/run](https://console.cloud.google.com/run)
   - You should see your `rag-processor-dev` service
   - Status should be **"Healthy"** or **"Receiving traffic"**

2. **Check service details**
   - Click on the service name
   - Verify **"URL"** is accessible
   - Check **"Logs"** tab for any startup issues

#### Check Storage Bucket

1. **Navigate to Cloud Storage**
   - Go to [https://console.cloud.google.com/storage](https://console.cloud.google.com/storage)
   - You should see your bucket (e.g., `your-project-id-rag-documents-dev`)
   - Bucket should be empty (ready for document uploads)

#### Check EventArc Triggers

1. **Navigate to EventArc**
   - Go to [https://console.cloud.google.com/eventarc](https://console.cloud.google.com/eventarc)
   - You should see `rag-processor-dev-trigger` for document processing

**🛑 CHECKPOINT:** Confirm you have completed:

- ✅ RAG processor deployed to Cloud Run Jobs
- ✅ GCS handler function deployed and active
- ✅ Task processor function deployed and active
- ✅ All services showing "Healthy" status in GCP console
- ✅ Storage bucket created and accessible
- ✅ EventArc triggers configured and active
- ✅ Cloud Tasks queues configured
- ✅ Web app service account key configured in environment file
- ✅ All environment variables properly configured

**If you encountered EventArc issues during deployment:**

- ✅ Cloud Storage service agent permissions granted
- ✅ EventArc trigger created manually
- ✅ Service fully operational

**If you encountered Google Cloud Storage authentication errors:**

- ✅ Service account key created for web app
- ✅ Base64-encoded key added to .env.local
- ✅ Document upload now working successfully

---

## Phase 7: Stripe Billing Setup

**Goal:** Configure Stripe billing, webhooks, and subscription tiers

**🤖 AI Assistant will:**

- Guide user through platform configuration
- Help verify webhook setup

**👤 User will:**

- Create Stripe account and verify business information
- Configure subscription products and pricing
- Copy API keys and webhook secrets
- Update environment variables

### Step 7.1: Create Stripe Account

**👤 USER TASK - Stripe account setup:**

1. **Sign Up for Stripe**
   - Go to [https://stripe.com](https://stripe.com)
   - **For new users:** Click **"Start now"** in the top right corner
   - **For existing users:** Click **"Sign in"** in the top right corner and skip to step 4

2. **Create New Account (if clicking "Start now")**
   - You'll be taken to the account creation page
   - If you have a Google account, you can sign up with Google and fill in your full name and Country.
   - If you prefer to sign up with email, fill in your information:
     - **Email address:** Your business email
     - **Full name:** Your full legal name
     - **Password:** A secure password
     - **Country:** Your country/region
   - Click **"Create account"** to proceed

3. **Sign In to Existing Account (if clicking "Sign in")**
   - You'll see the sign-in page with multiple options: Email and Password, Sign in with Google, Sign in with passkey, and Sign in with SSO
   - Choose your preferred sign-in method (Email and Password is the default)

4. **Complete Account Setup**
   - After signing in/up, you can either verify your business information or skip it and start in test mode **business sandbox** which is for testing and development
   - If you want to verify your business information, you can provide your full business details, anytime by clicking on the **Switch to live account** button in the top right corner of the dashboard
   - **Note:** You can start in test mode for development

### Step 7.2: Configure Subscription Products

**👤 USER TASK - Create subscription tiers:**

1. **Navigate to Products**
   - In your Stripe dashboard, click on **Product catalog** in the sidebar <!-- Guide the user to this exact path -->
   - Click **"Add product"** to create subscription products

2. **Create Basic Plan Product**
   - A slide-out panel will appear on the right titled "Add a product"
   - Fill in the product details:
     - **Name (required):** "Basic Plan"
     - **Description:** "Basic tier for RAG-powered document processing with essential features"
   - In the pricing section of the same panel:
     - **Pricing model:** Select **"Recurring"** (should already be selected)
     - **Amount:** Enter `29` (or your preferred Basic plan price)
     - **Currency:** USD (or your preferred currency)
     - **Billing period:** Select **"Monthly"** from dropdown
   - Click **"Add product"** to create the Basic plan product

3. **Copy Basic Plan Price ID**
   - After the Basic product is created, click on the newly created Basic plan product
   - In the **Pricing** section, they'll see the price plan
   - Click the **three dots (...)** menu next to the price
   - Select **"Copy price ID"** from the dropdown menu
   - Paste the ID immediately into your `apps/web/.env.local` file:

   **Basic Plan Price ID:**

```bash
STRIPE_BASIC_PRICE_ID=price_your_basic_price_id
```

4. **Create Pro Plan Product**
   - Go back to **Product catalog** in your Stripe dashboard
   - Click **"Add product"** again to create the second product
   - Fill in the Pro plan product details:
     - **Name (required):** "Pro Plan"
     - **Description:** "Premium tier with advanced features and higher usage limits"
   - In the pricing section of the same panel:
     - **Pricing model:** Select **"Recurring"**
     - **Amount:** Enter `99` (or your preferred Pro plan price)
     - **Currency:** USD (or your preferred currency)
     - **Billing period:** Select **"Monthly"** from dropdown
   - Click **"Add product"** to create the Pro plan product

5. **Copy Pro Plan Price ID**
   - After the Pro product is created, click on the newly created product name
   - In the **Pricing** section, you'll see the price plan
   - Click the **three dots (...)** menu next to the price
   - Select **"Copy price ID"** from the dropdown menu
   - Paste the ID immediately into your `apps/web/.env.local` file:

   **Pro Plan Price ID:**

```bash
STRIPE_PRO_PRICE_ID=price_your_pro_price_id
```

💡 **Important:** Having separate products for each plan allows better subscription management and gives customers clear plan switching options in the customer portal.

### Step 7.3: Get Stripe API Keys

**👤 USER TASK - Get API keys:**

1. **Navigate to API Keys**
   - Click on the search bar at the top of your Stripe dashboard
   - Type **"API keys"** and select **"Developers > API keys"** from the dropdown results
   - You'll be taken to the API keys page

2. **Get Publishable Key**
   - In the **Standard keys** section, you'll see the **Publishable key** (starts with `pk_test_`)
   - Click directly on the key value to copy it
   - **Add to `apps/web/.env.local` ONLY:**

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

3. **Get Secret Key**
   - In the same API keys section, you'll see the **Secret key** (starts with `sk_test_`)
   - Click directly on the key value to copy it
   - **Add to `apps/web/.env.local` ONLY:**

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

### Step 7.4: Configure Customer Portal and Subscriptions

**👤 USER TASK - Set up customer portal with subscription management:**

1. **Navigate to Customer Portal Settings**
   - Click on the search bar at the top of your Stripe dashboard
   - Search for **"Customer Portal"** and click on the **"Settings > Billing > Customer portal"** option

2. **Activate Customer Portal**
   - Under the "Launch customer portal with a link" section, click **"Activate test link"** (or **"Activate link"** if in live mode)
   - Stripe will generate a customer portal link
   - Click on the generated link to copy it
   - **Add to `apps/web/.env.local` ONLY:**

```bash
STRIPE_CUSTOMER_PORTAL_URL=https://billing.stripe.com/p/login/your_portal_url
```

3. **Configure Subscription Management**
   - **🛑 CRITICAL:** This step is required for subscription switching to work properly
   - On the same Customer portal page, scroll down to find the **"Subscriptions"** section
   - Click on the **"Subscriptions"** section to expand it
   - You should see various subscription management options

4. **Enable Plan Switching**
   - In the Subscriptions section, find the toggle for **"Customers can switch plans"**
   - Switch this toggle **ON**
   - This allows customers to upgrade/downgrade between your subscription tiers

5. **Select Available Products for Switching**
   - Below the toggle, you'll see a search field to select products
   - Search for and select both products:
     - Search for **"Basic Plan"** and select it
     - Search for **"Pro Plan"** and select it
   - Both products should now appear in the selected products list

6. **Configure Plan Change Billing**
   - In the same Subscriptions section, find **"When customers change plans or quantities"**
   - Select one of these options:
     - **"Prorate charges and credits"** (Recommended): Issue a credit for the unused portion of the current billing period and charge the new price for the remaining time
     - **"No charges or credits"**: New pricing applies at the next billing cycle
     - **"Charge or credit the full difference"**: Charge the full price difference immediately
   - **Recommended setting:** Choose **"Prorate charges and credits"** for fair billing

7. **Configure Downgrade Settings**
   - Scroll down a little more in the Subscriptions section to find **"Downgrades"** settings
   - Select the appropriate option for **"When switching to a cheaper plan"** and **"When switching to a shorter interval period"**:
     - **"Wait until end of billing period to update"** (Recommended): Prevents immediate downgrades, customer keeps current plan until period ends
     - **"Update immediately"**: Immediate downgrade with prorated billing
   - **Recommended setting:** Choose **"Wait until end of billing period to update"** to prevent immediate service reduction

8. **Save Customer Portal Configuration**
   - After configuring all subscription settings, scroll to the top of the page
   - Click **"Save changes"** to apply the configuration
   - The customer portal is now properly configured for subscription management

   💡 **Why these settings matter:**
   - **Separate products** allow clear plan switching in the customer portal
   - **Proration** ensures fair billing when customers change plans mid-cycle
   - **End-of-period downgrades** prevent immediate service reduction and customer confusion
   - **Plan switching enabled** gives customers self-service subscription management

**💳 Note:** All Stripe configuration is only needed for the web app (`apps/web/`) since billing is handled there. The RAG processor doesn't need Stripe keys.

**🛑 STOP AND WAIT FOR USER APPROVAL**
Ask the user to confirm they have:

- ✅ Created Stripe account and configured products
- ✅ Copied all API keys to `apps/web/.env.local`
- ✅ Verified environment file is complete

### Step 7.5: Configure Local Webhook Testing

**🤖 AI ASSISTANT TASK - Set up webhook testing:**

1. **Verify Stripe CLI Installation**

```bash
stripe --version
```

**🛑 AI ASSISTANT IMPORTANT NOTE:** <!-- AI INTERNAL REFERENCE - DO NOT SHOW THE NOTE TO USER -->
Stripe CLI should already be installed from the prerequisites setup in Phase 1. If not installed, make sure to read Step 1.2 for installation instructions and proceed to install it properly depending on your operating system.

2. **👤 USER TASK - Login to Stripe CLI**

```bash
stripe login
```

- This will open your browser to authenticate
- Press **Enter** and complete authentication in the browser
- You should see a confirmation that authentication was successful

3. **Start Local Webhook Listener**

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Expected Output:**

```
> Ready! You are using Stripe API Version [2025-06-30.basil]. Your webhook signing secret is whsec_19da5558dba2.... (^C to quit)
```

4. **👤 USER TASK - Copy Webhook Secret**
   - From the output above, copy the webhook signing secret (starts with `whsec_`)
   - **Add to `apps/web/.env.local` ONLY:**

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

💡 **Important:** Keep the `stripe listen` command running while testing. This forwards Stripe webhook events to your local development server.

### Step 7.6: Verify Complete Environment Configuration

**📋 Final Environment Configuration Overview**

At this point, you should have the **`apps/web/.env.local` environment file** configured. Here's what it should contain:

---

#### 🌐 **`apps/web/.env.local` Environment File**

```bash
# Development Environment Variables Template
# Copy this file to .env.local and fill in your values

# --- Database Configuration (Supabase - Drizzle ORM with pooler) ---
DATABASE_URL=postgresql://postgres:abc123...@aws-0-eu-north-1.pooler.supabase.com:6543/postgres

# --- Supabase Configuration ---
SUPABASE_URL=https://abcdefghij.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...

# --- Google AI Configuration ---
# Get API key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIzaSyD...

# --- Google Cloud Configuration (for file storage and other services) ---
GOOGLE_CLOUD_PROJECT_ID=my-rag-project-123
GOOGLE_CLOUD_REGION=us-central1
GOOGLE_CLOUD_STORAGE_BUCKET=my-rag-project-123-rag-documents-dev

# Service account key (base64 encoded) - for non-Vertex AI services
GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY=your-service-account-key

# --- Stripe Configuration (Development) ---
# Get from: https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_51AbCdEf...
STRIPE_WEBHOOK_SECRET=whsec_1AbCdEf...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51AbCdEf...

# Stripe Price IDs (Test Mode)
STRIPE_BASIC_PRICE_ID=price_1AbCdEf...
STRIPE_PRO_PRICE_ID=price_1AbCdEf...

# Optional: Stripe Customer Portal URL
# STRIPE_CUSTOMER_PORTAL_URL=https://billing.stripe.com/p/login/test_AbCdEf...

# --- Development Settings ---
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

💡 **Simplified Configuration:** This single environment file is used by both the web application (directly) and the RAG processor (automatically during deployment).

**🛑 CHECKPOINT:** Confirm you have completed:

- ✅ Stripe account created and verified
- ✅ **Basic Plan** and **Pro Plan** created as separate products
- ✅ Price IDs for both products copied to `apps/web/.env.local`
- ✅ Stripe API keys added to `apps/web/.env.local`
- ✅ **Customer portal activated** with plan switching enabled
- ✅ **Billing and downgrade settings configured**
- ✅ Stripe CLI installed and authenticated
- ✅ Local webhook listener running (`stripe listen`)
- ✅ Webhook secret added to environment
- ✅ All Stripe environment variables configured

---

## Phase 8: Integration & Production Testing

**Goal:** Test end-to-end functionality and verify complete setup

**🤖 AI Assistant will:**

- Start the complete application stack
- Execute test commands
- Verify document processing pipeline

**👤 User will:**

- Test authentication flow manually
- Verify document upload and processing
- Check database records
- Test billing features

### Step 8.1: Test Application Startup

**🤖 AI ASSISTANT TASK - Start application:**

1. **Start Development Server**

```bash
npm run dev:full
```

2. **👤 USER TASK - Verify Application Loads**
   - Open [http://localhost:3000](http://localhost:3000)
   - You should see landing page without errors
   - Check browser console for any errors

### Step 8.2: Test Authentication Flow

**👤 USER TASK - Test authentication manually:**

1. **Test User Registration**
   - Navigate to **Sign Up** page by clicking the "Get Started" button in the top right corner of the landing page
   - Create a test account with a real email
   - Check your email for confirmation link
   - Click on email verification button

2. **Test User Login**
   - You will be redirected to the **Login** page
   - Log in with your test credentials
   - You should be redirected to protected chat interface

3. **Verify Database User Creation**
   - Check Supabase sidebar → **Authentication** → Users
   - You should see your newly created user
   - Navigate to **Table Editor** in the Supabase sidebar, and check the `users` table
   - You should see your test user record

### Step 8.3: Test Document Processing Pipeline

**👤 USER TASK - Test document upload and processing:**

1. **Upload a Test Document**
   - Navigate to the **Documents** or **Upload** page in the web app
   - Upload a document, image, video, or audio file (keep it small for testing, <1MB)
   - Verify the upload completes successfully

2. **Monitor Document Processing**
   - Watch the document status change from "Uploading" → "Processing" → "Completed"
   - Check processing in GCP Console:
     - Go to **Cloud Storage** and verify the file appears in your bucket
     - Go to **Cloud Run** logs and watch the processing logs

3. **Verify Processing Results**
   - Check Supabase **Table Editor**:
     - **documents** table: Should contain your uploaded file with "completed" status
     - **document_chunks** table: Should have the processed text chunks with vector embeddings
     - **document_processing_jobs** table: Should show completed processing jobs

### Step 8.4: Test Chat Functionality

**👤 USER TASK - Test chat features:**

1. **Test Basic Chat**
   - Navigate to the **Chat** page of the web app
   - Start a new conversation
   - Send a simple message: "Hello, can you help me?"
   - Should receive AI response
   - Verify message appears in chat history

2. **Test Document-Based Chat**
   - After the documents have been uploaded successfully, ask questions about your uploaded document:
     - "What are my documents about?"
     - "Summarize the main points"
   - **Expected behavior:**
     - The AI should respond with information from your uploaded document
     - Responses should be contextually relevant and accurate
     - Should demonstrate RAG (Retrieval-Augmented Generation) capabilities

3. **Test Chat Persistence**
   - Send several messages back and forth
   - Refresh the conversation page
   - Verify conversation history is maintained
   - Check Supabase **Table Editor** → `conversations` and `messages` tables

### Step 8.5: Test Billing Features

**👤 USER TASK - Test billing features:**

💡 **Important:** Before testing billing features, ensure the Stripe CLI webhook listener is still running:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Keep this terminal window open during all billing tests.

1. **Test Subscription Tiers**
   - Navigate to **Profile** page
   - Should see current subscription tier (Free)
   - Check usage limits display
   - Verify usage tracking shows correct free tier limits

2. **Test Subscription Upgrade**
   - Click **"Upgrade"** on an "Available Plan" in the profile page
   - Should redirect to Stripe checkout page
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete test checkout process
   - Verify subscription upgrade in profile

3. **Test Usage Tracking**
   - Process several documents to test usage tracking
   - Send multiple chat messages
   - Check if usage counters increment
   - Verify premium features access with paid subscription

4. **Test Billing Management**
   - Navigate to billing management in profile
   - Test updating payment method
   - Test canceling subscription
   - Verify customer portal link works

### Phase 8 Completion Check

Setup is now complete! Verify all functionality:

- ✅ Application starts without errors
- ✅ Authentication flow works (signup, email confirmation, login)
- ✅ User records created in database
- ✅ Document upload and processing works
- ✅ RAG-powered chat functionality works
- ✅ Chat persistence and history works
- ✅ Billing features work (subscription tiers, usage tracking)
- ✅ Stripe checkout and webhook integration works
- ✅ Complete RAG pipeline functional

---

## 6 · Troubleshooting Guide

### Common Issues and Solutions

#### Database Connection Issues

**Issue:** `connection to server at "xxx.supabase.co" failed`
**Solution:**

1. Verify DATABASE_URL format in `.env.local`
2. Check Supabase project is active and not paused
3. Verify database password is correct
4. Test connection from Supabase dashboard

#### Cloud Run Deployment Failures

**Issue:** Deployment fails or service doesn't start
**Solution:**

1. Check Cloud Run logs: `gcloud logs read --limit=50`
2. Verify all environment variables are set correctly
3. Check that billing is enabled on GCP project
4. Verify service account has correct permissions

#### Document Processing Not Working

**Issue:** Documents upload but don't get processed
**Solution:**

1. Check EventArc triggers are active in GCP console
2. Verify storage bucket permissions
3. Check Cloud Run service logs for errors
4. Check environment variables are properly configured

#### Gemini API Errors

**Issue:** Chat responses fail or show API errors
**Solution:**

1. Verify Gemini API key is valid and active
2. Check API quota limits in Google AI Studio
3. Review Google Cloud Console for usage limits
4. Test API key directly with curl

#### Performance Issues

**Issue:** Slow document processing or chat responses
**Solution:**

1. Increase Cloud Run CPU/memory allocation
2. Check vector index configuration in database
3. Review document chunk size settings
4. Monitor GCP resource utilization

### Getting Help

#### Database Debugging

**Check database state:**

```bash
# STEP 1: ALWAYS verify we're in apps/web directory
pwd
# Expected output: /path/to/project/apps/web

# STEP 2: Check migration status (ONLY from apps/web directory)
npm run db:status
```

**View database tables:**

- **🌐 Open browser:** Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
- **Select your project:** Choose your RAG SaaS project
- **Navigate to tables:** Click on **"Table Editor"** in the left sidebar
- **Browse data:** View tables and data directly in the Supabase interface

#### GCP Resource Status

**Verify GCP resources:**

```bash
gcloud services list --enabled  # Check enabled APIs
gcloud storage buckets list     # Check storage buckets
gcloud run services list        # Check Cloud Run services
```

---

### Common Stripe Issues and Solutions

**Issue: Stripe checkout not working or webhook failures**

- **Root Cause:** Incorrect Stripe configuration or webhook issues
- **Solution:**
  - Verify all Stripe API keys are correctly set in environment variables
  - Ensure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
  - Verify webhook secret in `apps/web/.env.local` matches the one from Stripe CLI output
  - Check Stripe CLI terminal for webhook event logs
  - Test with Stripe test cards: `4242 4242 4242 4242`
- **Quick Test:** Try subscription upgrade with test card and watch Stripe CLI logs for webhook events

**Issue: Usage tracking not working or incorrect limits**

- **Root Cause:** Database triggers or usage tracking logic issues
- **Solution:**
  - Verify all database migrations applied successfully
  - Check usage tracking tables in Supabase Dashboard
  - Ensure subscription status is properly synced from Stripe
- **Quick Test:** Process documents and check usage counters in profile

---

## 7 · Cost Management

### Expected Monthly Costs (Development)

**Google Cloud Platform:**

- **Cloud Run:** $0-5/month (scales to zero when not used)
- **Cloud Storage:** $0-2/month (depends on document volume)
- **Vertex AI API:** $0-10/month (depends on usage)
- **Other services:** $0-3/month

**Third-party Services:**

- **Supabase:** Free tier (up to 50MB database)
- **Google AI (Gemini):** Free tier available (generous quotas for development)
- **Stripe:** Free for testing (only pay when processing real transactions)

**Total Expected:** $5-20/month for development usage

### Cost Optimization Tips

1. **Use development configurations** (lower CPU/memory in Cloud Run)
2. **Set up billing alerts** in GCP console
3. **Monitor Gemini API usage** in Google AI Studio
4. **Clean up test documents** regularly
5. **Use Cloud Run scale-to-zero** to minimize idle costs
6. **Use Stripe test mode** for development to avoid transaction fees

### Production Scaling

When ready for production:

1. **Set up production infrastructure:** `npm run setup:gcp:prod` (unified production setup)
2. **Deploy with production configuration:** `npm run deploy:processor:prod` (automatically uses prod settings)
3. **Set up proper monitoring and alerting**
4. **Configure auto-scaling policies**
5. **Implement proper backup and disaster recovery**
6. **Switch Stripe to live mode** with production webhooks

---

## 🎉 Congratulations!

You have successfully set up the complete RAG SaaS application!

**What you've accomplished:**

- ✅ Full-stack RAG application with Next.js frontend
- ✅ Python-based document processing pipeline on GCP
- ✅ Vector embeddings with pgvector in Supabase
- ✅ AI-powered chat interface with document context
- ✅ Secure authentication and user management
- ✅ Scalable cloud infrastructure on Google Cloud Platform
- ✅ Cost-effective development environment

**Your application now supports:**

- 📄 Document upload (PDF, TXT, DOCX, and more)
- 🔍 Intelligent document processing and chunking
- 🧠 Vector embeddings for semantic search
- 💬 AI-powered chat with document context
- 👥 Multi-user support with secure isolation
- 📊 Monitoring and logging for production use

**Next steps:**

1. **Customize the UI** to match your brand
2. **Add more document types** or processing features
3. **Implement billing** with Stripe integration
4. **Deploy to production** when ready
5. **Add advanced features** like conversation memory, document collaboration, etc.

**Need help?** Refer to the troubleshooting guide above or check the individual component documentation in the codebase.

Happy building! 🚀
