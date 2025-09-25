# RAG Simple

A complete **Retrieval-Augmented Generation (RAG) application** built with modern technologies. This template allows users to upload documents and ask questions about them through an intelligent chat interface.

## 🌟 Cross-Platform Ready

This template now works seamlessly on **Windows**, **macOS**, and **Linux** with simplified setup:

- ✅ **One-click development**: Double-click `dev.bat` (Windows) or `dev.sh` (Mac/Linux)
- ✅ **Universal npm scripts**: Same commands work on all platforms
- ✅ **Beginner-friendly**: No shell scripting knowledge required
- ✅ **Node.js based**: Uses familiar JavaScript instead of complex shell scripts

**Quick Start** (any platform):

```bash
npm run setup   # Install everything
npm run dev     # Start development
```

👉 **[See the complete cross-platform setup guide](SETUP.md)**

> **📝 Note**: This template previously used a Makefile for development commands. All functionality has been migrated to cross-platform npm scripts. See [SETUP.md](SETUP.md) for the migration guide.

## 🏗️ Architecture Overview

This is a **polyglot monorepo** containing two main applications:

- **`apps/web/`**: Next.js frontend with Supabase authentication
- **`apps/rag-processor/`**: Python service for document processing and embedding generation

### Technology Stack

**Frontend (Next.js)**:

- Next.js 14 with App Router
- Supabase Auth & Database (PostgreSQL with pgvector)
- Tailwind CSS + shadcn/ui components
- TypeScript

**Backend (Python)**:

- Google Cloud Storage for document storage
- Google Cloud Run for serverless processing
- Vertex AI for embeddings and chat completions
- Eventarc for event-driven processing
- Poetry for dependency management

## 🔄 Data Flow

### Document Upload & Processing

1. User uploads document via web interface
2. Frontend generates signed URL for direct upload to Google Cloud Storage
3. File upload triggers Google Cloud Storage event
4. Eventarc invokes Cloud Run job to process the document
5. Python service downloads, parses, chunks, and generates embeddings
6. Embeddings stored in Supabase with pgvector extension

### Chat & Query

1. User sends question via chat interface
2. Frontend calls Next.js API route
3. API generates embedding for user query
4. Performs vector similarity search in Supabase
5. Retrieves relevant document chunks
6. Sends context + query to Vertex AI Gemini
7. Streams AI response back to user

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+ and Poetry
- Google Cloud Account with billing enabled
- Supabase account

### 1. Install Dependencies

```bash
# Install all dependencies (Node.js + Python) in one command
npm run setup
```

### 2. Environment Setup

**Web Application (.env.local in apps/web/)**:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_REGION=us-central1

# App
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

**RAG Processor (.env in apps/rag-processor/)**:

```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_REGION=us-central1
PORT=8080
```

### 3. Database Setup

Run the SQL migrations in your Supabase project:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Document chunks table for RAG
CREATE TABLE document_chunks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding vector(1408),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX ON document_chunks (user_id);

-- Documents table for tracking uploads
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_size BIGINT,
  content_type TEXT,
  processing_status TEXT DEFAULT 'pending',
  gcs_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX ON documents (user_id);
CREATE INDEX ON documents (processing_status);
```

### 4. Google Cloud Setup

```bash
# Enable required APIs
gcloud services enable storage.googleapis.com
gcloud services enable aiplatform.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable eventarc.googleapis.com
gcloud services enable run.googleapis.com

# Create storage bucket for documents
gcloud storage buckets create gs://your-rag-documents-bucket

# Store Supabase connection string in Secret Manager
echo "postgresql://postgres:[password]@[host]:5432/postgres" | \
  gcloud secrets create supabase-connection-string --data-file=-

# Create service account for RAG processor
gcloud iam service-accounts create rag-processor-sa

# Grant permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:rag-processor-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:rag-processor-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:rag-processor-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 5. Development

```bash
# Start both web app and RAG processor (recommended)
npm run dev

# Or start separately:
npm run dev:web    # Just web application
npm run dev:api    # Just RAG processor

# Stop all services
npm run stop
```

**Alternative: Click-to-run**

- **Windows**: Double-click `dev.bat`
- **macOS/Linux**: Double-click `dev.sh`

## 📁 Project Structure

```
rag-simple/
├── package.json                 # Root workspace configuration
├── README.md                   # This file
├── apps/
│   ├── web/                    # Next.js application
│   │   ├── app/                # Next.js app router pages
│   │   ├── components/         # React components
│   │   ├── lib/               # Utilities and configurations
│   │   ├── drizzle/           # Database migrations
│   │   └── package.json       # Web app dependencies
│   └── rag-processor/         # Python document processor
│       ├── rag_processor/     # Python package
│       ├── tests/            # Python tests
│       ├── Dockerfile        # Container for Cloud Run
│       ├── pyproject.toml    # Poetry configuration
│       └── README.md         # RAG processor docs
```

## 🔧 Available Scripts

### Root Level

- `npm run dev` - Start web development server
- `npm run build` - Build all applications
- `npm run lint` - Lint all workspaces

### Web Application

- `npm run web` - Start Next.js dev server
- `npm run web:build` - Build Next.js app
- `npm run web:start` - Start production server

### RAG Processor

- `npm run rag-processor:install` - Install Python dependencies
- `npm run rag-processor:dev` - Start development server
- `npm run rag-processor:lint` - Format and lint Python code
- `npm run rag-processor:test` - Run Python tests

## 🚀 Deployment

### Automated Deployment Scripts (Recommended)

The template now includes streamlined deployment scripts in the `deploy/` directory for better accessibility:

#### 🚀 Deploy RAG Processor

```bash
# Complete deployment pipeline (idempotent)
uv run deploy-rag-processor

# Force image rebuild
FORCE_REBUILD=true uv run deploy-rag-processor

# Force service redeployment
FORCE_DEPLOY=true uv run deploy-rag-processor
```

#### 📦 Deploy Queue Handler

```bash
# Deploy Cloud Function with EventArc triggers
uv run deploy-queue-handler
```

**Features:**

- **Idempotent**: Safe to run multiple times
- **Model Auto-Download**: Downloads standard Docling model suite if needed
- **Optimized Builds**: CPU-only PyTorch, layer caching, parallel build steps
- **CWD Independent**: Works from any directory
- **Smart Deployments**: Skips deployment if service is already up to date

### Manual Deployment (Advanced)

#### Web Application (Vercel)

```bash
# Build and deploy to Vercel
cd apps/web
vercel deploy --prod
```

#### RAG Processor (Google Cloud Run)

```bash
# Build and deploy container
cd apps/rag-processor

# Build Docker image
docker build -t gcr.io/$PROJECT_ID/rag-processor .
docker push gcr.io/$PROJECT_ID/rag-processor

# Deploy to Cloud Run
gcloud run jobs create rag-processor \
  --image=gcr.io/$PROJECT_ID/rag-processor \
  --region=$REGION \
  --service-account=rag-processor-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --set-env-vars="GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID,GOOGLE_CLOUD_REGION=$REGION" \
  --memory=2Gi \
  --cpu=2 \
  --timeout=3600

# Set up Eventarc trigger
gcloud eventarc triggers create rag-processor-trigger \
  --destination-run-job=rag-processor \
  --destination-run-region=$REGION \
  --event-filters="type=google.cloud.storage.object.v1.finalized" \
  --event-filters="bucket=your-rag-documents-bucket" \
  --service-account=rag-processor-sa@$PROJECT_ID.iam.gserviceaccount.com
```

## 📚 Key Features

### 🔐 Authentication & Authorization

- Supabase Auth with email/password and social logins
- Row Level Security (RLS) for data isolation
- User profile management


### 📄 Document Processing

- Support for PDFs and other document formats
- Intelligent text chunking with overlap
- High-quality embeddings using Vertex AI
- Scalable processing with Cloud Run

### 💬 RAG Chat Interface

- Real-time chat with streaming responses
- Context-aware responses using retrieved documents
- Chat history and conversation management
- Responsive design for mobile and desktop

### 🎛️ Admin Features

- Admin dashboard for managing AI models
- User management and analytics
- System monitoring and health checks

## 🔄 Customization

### Adding New Document Types

1. Update the document parser in `apps/rag-processor/rag_processor/main.py`
2. Add MIME type support in the web upload component
3. Test processing pipeline with new format

### Changing AI Models

1. Update embedding model in RAG processor config
2. Modify chat completion model in web API routes
3. Update vector dimensions if needed

### Scaling Considerations

- Use Cloud Run autoscaling for variable workloads
- Consider Cloud SQL for larger datasets
- Implement caching for frequently accessed embeddings
- Add monitoring and alerting

## 📝 License

This template is provided as-is for educational and commercial use. See individual dependencies for their respective licenses.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:

- Check the README files in each app directory
- Review the deployment guides
- Open an issue in the repository

---

**Built with ❤️ using Next.js, Supabase, Google Cloud, and modern web technologies.**
