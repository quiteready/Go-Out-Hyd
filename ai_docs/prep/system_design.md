# RAG Processor System Design

## 1. Overview

The RAG Processor is a **background worker service** designed to automatically process various file types uploaded to Google Cloud Storage (GCS), extract meaningful content, generate embeddings, and store the results in Supabase for retrieval-augmented generation (RAG) applications.

**CRITICAL: This is NOT an API service.** The rag-processor is a pure background worker that processes files via GCS events and stores results in the database. The frontend queries the database directly through Supabase RPC functions, not through the rag-processor.

### Key Design Principles

- **Event-driven**: Triggered by GCS object uploads (NOT HTTP requests)
- **Background processing**: No API endpoints or web server functionality
- **Parallel processing**: Each upload spawns a new instance
- **Format-agnostic**: Handles videos, audio, images, and documents uniformly
- **Scalable**: Auto-scales with Cloud Run based on GCS events
- **Reliable**: Proper error handling and retry mechanisms

### Architecture Clarification

**What rag-processor IS:**

- ✅ Background worker triggered by GCS events
- ✅ File processing and embedding generation
- ✅ Database storage via direct connection
- ✅ Job status updates in database

**What rag-processor is NOT:**

- ❌ API service with HTTP endpoints
- ❌ WebSocket server for real-time updates
- ❌ Search or query service for frontend
- ❌ User-facing service

**Frontend Integration:**

- Frontend uploads files → GCS → triggers rag-processor
- Frontend queries database directly via Supabase RPC functions
- Frontend polls database for job status (not rag-processor APIs)

## 2. Architecture Overview

```
GCS Upload → Cloud Function/Eventarc → Cloud Run Worker Instance → Processing Pipeline → Supabase Database
                                                                                              ↑
Frontend (Next.js) ←------- Direct Database Queries (Supabase RPC) ----------------------┘
```

### 2.1 Core Components

1. **Trigger System**: GCS bucket notifications (Cloud Function/Eventarc)
2. **Background Worker**: Cloud Run container instance (no HTTP endpoints)
3. **Processing Pipelines**: Format-specific processors for video/audio/image/document
4. **Storage Layer**: Supabase database with vector embeddings
5. **Frontend Integration**: Direct database access via Supabase RPC (NOT through rag-processor)
6. **CI/CD Pipeline**: Automated deployment system

## 3. Deployment Strategy

### 3.1 Google Cloud Run Deployment

- **Platform**: Google Cloud Run (serverless background worker containers)
- **Scaling**: Auto-scale from 0 to N instances based on GCS events
- **No HTTP endpoints**: Pure event-driven processing (no web server)
- **Resource allocation**:
  - CPU: 2-4 vCPU per instance
  - Memory: 4-8 GB per instance
  - Timeout: 60 minutes (for large video files)

### 3.2 CI/CD Pipeline

- **Trigger**: Push to main branch or manual trigger
- **Build**: Docker container with all dependencies
- **Deploy**: Cloud Run deployment with blue/green strategy
- **Monitoring**: Job completion tracking via database status

**Deployment Script Components:**

- Docker build with multi-stage optimization
- Cloud Build integration
- Environment variable management
- Background job monitoring setup
- Database connection management

## 4. Event Triggering System

### 4.1 GCS Integration

- **Event Type**: `google.storage.object.finalize`
- **Trigger Mechanism**: Eventarc or Cloud Function
- **Payload**: Object metadata (bucket, object name, size, content type)

### 4.2 Instance Spawning Strategy

- **One instance per object**: Ensures parallel processing
- **Instance isolation**: No shared state between processes
- **Resource management**: Cloud Run handles scaling and lifecycle

### 4.3 Supported File Patterns

```
/uploads/{user_id}/{workspace_id}/{file_type}/{filename}
```

## 5. Processing Pipelines

### 5.1 Video Processing Pipeline

**Input**: MP4, AVI, MOV, MKV, WebM
**Steps:**

1. **Video Splitting**:
   - Split into chunks (30-60 second segments)
   - Extract keyframes for thumbnails
   - Preserve temporal metadata
2. **Audio Extraction**: Extract audio track for transcription
3. **Transcription**:
   - Use Whisper API or similar
   - Generate timestamped transcripts
   - Handle multiple languages
4. **Embedding Generation**:
   - Embed transcript chunks with temporal context
   - Include video metadata (duration, resolution, etc.)
5. **Storage**: Save to Supabase with video-specific schema

**Schema Fields:**

- `content_type`: 'video'
- `content_text`: Transcribed text
- `embedding`: Vector embedding
- `metadata`: `{timestamp, duration, chunk_index, video_info}`
- `file_path`: GCS path
- `chunk_id`: Unique identifier for video segment

### 5.2 Audio Processing Pipeline

**Input**: MP3, WAV, FLAC, AAC, OGG
**File Size Limits**: 1GB maximum (from system limit)
**Steps:**

1. **Audio Splitting**:
   - Split into manageable chunks (2-minute segments, matching video strategy)
   - Maintain audio quality for transcription
2. **Transcription**:
   - Use Whisper API or Google Speech-to-Text
   - Generate timestamped transcripts
3. **Embedding Generation**:
   - Embed transcript chunks with temporal context (text embeddings, not multimodal)
   - Include audio metadata (duration, bitrate, etc.)
4. **Storage**: Save to Supabase with audio-specific schema

**Schema Fields:**

- `content_type`: 'audio'
- `content_text`: Transcribed text
- `embedding`: Vector embedding
- `metadata`: `{timestamp, duration, chunk_index, audio_info}`
- `file_path`: GCS path
- `chunk_id`: Unique identifier for audio segment

### 5.3 Image Processing Pipeline

**Input**: JPG, PNG, GIF, WebP, TIFF, BMP
**Steps:**

1. **Image Analysis**:
   - Extract EXIF metadata
   - Generate image description using vision models (optional)
   - Detect text in images (OCR) if applicable
2. **Embedding Generation**:
   - Generate embeddings from image description/OCR text
   - Use filename and metadata as context
3. **Storage**: Save to Supabase with image-specific schema

**Schema Fields:**

- `content_type`: 'image'
- `content_text`: Image description or OCR text
- `embedding`: Vector embedding
- `metadata`: `{filename, dimensions, exif_data, file_size}`
- `file_path`: GCS path
- `image_url`: Public URL for display

### 5.4 Document Processing Pipeline

**Input**: Based on Docling support:

- **Office Formats**: PDF, DOCX, XLSX, PPTX
- **Web Formats**: HTML, XHTML, Markdown
- **Data Formats**: CSV, AsciiDoc
- **Image Documents**: PNG, JPEG, TIFF, BMP, WebP (for scanned docs)
- **Specialized**: USPTO XML, JATS XML

**Steps:**

1. **Document Parsing**:
   - Use Docling for unified document processing
   - Extract structured content (headings, paragraphs, tables, lists)
   - Maintain document hierarchy and formatting
2. **Content Chunking**:
   - Use Docling's HybridChunker for semantic chunking
   - Preserve document structure in chunks
   - Handle tables and figures appropriately
3. **Embedding Generation**:
   - Generate embeddings for each chunk
   - Include document metadata and structure info
4. **Storage**: Save to Supabase with document-specific schema

**Schema Fields:**

- `content_type`: 'document'
- `content_text`: Chunk text content
- `embedding`: Vector embedding
- `metadata`: `{page_number, section, chunk_index, doc_type, structure_info}`
- `file_path`: GCS path
- `chunk_id`: Unique identifier for document chunk

## 6. Data Flow Architecture

### 6.1 Processing Workflow

```
1. File Upload → GCS
2. Create Document + Processing Job (Atomic Transaction)
3. GCS Event → Trigger Service
4. Cloud Run Instance Spawn
5. Update Job Status: 'processing'
6. File Download & Validation
7. Format Detection & Routing
8. Pipeline-Specific Processing (with progress updates)
9. Embedding Generation
10. Document Chunks Storage
11. Update Job Status: 'processed'
12. Cleanup & Logging
```

### 6.2 Job Tracking Integration

**Upload Flow:**

```typescript
// 1. User uploads file to GCS
const uploadFile = async (file: File, userId: string, workspaceId: string) => {
  // Atomic transaction: Create document + job
  const { document, job } = await db.transaction(async (tx) => {
    const document = await tx
      .insert(documents)
      .values({
        userId,
        workspaceId,
        fileName: file.name,
        filePath: `uploads/${userId}/${workspaceId}/${file.name}`,
        fileSize: file.size,
        mimeType: file.type,
        status: "uploading",
      })
      .returning();

    const job = await tx
      .insert(artifactProcessingJobs)
      .values({
        artifactId: document[0].id,
        fileType: file.type,
        filePath: document[0].filePath,
        fileSize: file.size,
        status: "pending",
      })
      .returning();

    return { document: document[0], job: job[0] };
  });

  // Upload to GCS (triggers processing)
  await uploadToGCS(file, document.filePath);

  return { document, job };
};
```

**Processing Flow:**

```python
# rag-processor updates job status throughout
async def process_file(job_id: str, file_path: str):
    # Update to processing
    await update_job_status(job_id, 'processing', progress=0)

    # Download file
    file_data = await download_from_gcs(file_path)
    await update_job_status(job_id, 'processing', progress=10)

    # Process based on file type
    if file_type == 'video':
        chunks = await process_video(file_data)
        await update_job_status(job_id, 'processing', progress=50)

        embeddings = await generate_embeddings(chunks)
        await update_job_status(job_id, 'processing', progress=75)

        await save_chunks_to_supabase(chunks, embeddings)
        await update_job_status(job_id, 'processed', progress=100)

    # Handle errors with retry logic
    except Exception as e:
        await handle_processing_error(job_id, e)
```

**Frontend Polling:**

```typescript
// React hook for job status polling
const useJobStatus = (jobId: string) => {
  const [status, setStatus] = useState<JobStatus>();

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const job = await fetchJobStatus(jobId);
      setStatus(job);

      // Stop polling when complete
      if (["processed", "error", "cancelled"].includes(job.status)) {
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [jobId]);

  return status;
};
```

### 6.3 Error Handling & Retry Logic

**Retry Strategy:**

```python
# Different retry strategies based on error type
RETRY_STRATEGIES = {
    'transcription_api_error': {'max_retries': 5, 'backoff_ms': 1000},
    'embedding_api_error': {'max_retries': 3, 'backoff_ms': 2000},
    'file_not_found': {'max_retries': 1, 'backoff_ms': 5000},
    'invalid_file_format': {'max_retries': 0},  # Don't retry
    'rate_limit_exceeded': {'max_retries': 10, 'backoff_ms': 5000}
}

async def handle_processing_error(job_id: str, error: Exception):
    job = await get_job(job_id)
    error_type = classify_error(error)
    strategy = RETRY_STRATEGIES.get(error_type, {'max_retries': 3, 'backoff_ms': 2000})

    if job.retry_count < strategy['max_retries']:
        # Update job for retry
        await update_job_status(
            job_id,
            'retry_pending',
            retry_count=job.retry_count + 1,
            error_message=str(error),
            error_details={'error_type': error_type, 'stack_trace': traceback.format_exc()}
        )

        # Schedule retry with exponential backoff
        delay = strategy['backoff_ms'] * (2 ** job.retry_count)
        await schedule_retry(job_id, delay)
    else:
        # Mark as failed
        await update_job_status(
            job_id,
            'error',
            error_message=str(error),
            error_details={'error_type': error_type, 'final_attempt': True}
        )
```

**Job Recovery System:**

```python
# Periodic job recovery for stuck jobs
async def recover_stuck_jobs():
    # Find jobs stuck in processing for > 30 minutes
    stuck_jobs = await db.query("""
        SELECT * FROM artifact_processing_jobs
        WHERE status = 'processing'
        AND processing_started_at < NOW() - INTERVAL '30 minutes'
    """)

    for job in stuck_jobs:
        await handle_processing_error(job.id, Exception("Job timeout"))
```

**Error Monitoring:**

- **Cloud Logging**: Structured error logging with correlation IDs
- **Alerting**: Slack/email notifications for high error rates
- **Dead Letter Queue**: Failed jobs for manual review
- **Graceful Degradation**: Continue processing other chunks if one fails

### 6.4 Data Storage Schema

**Job Tracking Table**: `artifact_processing_jobs`

```sql
CREATE TYPE artifact_processing_job_status AS ENUM (
    'pending', 'processing', 'processed', 'error', 'retry_pending', 'cancelled', 'partially_processed'
);

CREATE TABLE artifact_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Reference to the document being processed
    artifact_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

    -- Job status and progress tracking
    status artifact_processing_job_status DEFAULT 'pending' NOT NULL,
    processing_progress INTEGER DEFAULT 0 NOT NULL, -- 0-100 percentage

    -- File metadata for processing estimates
    file_size BIGINT,
    file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,

    -- Retry logic
    retry_count INTEGER DEFAULT 0 NOT NULL,
    max_retry_count INTEGER DEFAULT 3 NOT NULL,

    -- Error handling
    error_message TEXT,
    error_details JSONB, -- Structured error information

    -- Processing metadata
    processing_metadata JSONB, -- Store processing-specific info

    -- Timing information
    processing_started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Performance indexes
CREATE INDEX idx_processing_jobs_status ON artifact_processing_jobs(status);
CREATE INDEX idx_processing_jobs_artifact_status ON artifact_processing_jobs(artifact_id, status);
CREATE INDEX idx_processing_jobs_retry ON artifact_processing_jobs(retry_count, max_retry_count);
```

**Document Chunks Table**: `document_chunks`

```sql
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    metadata JSONB NOT NULL,
    embedding_type VARCHAR(20) DEFAULT 'text' NOT NULL,

    -- Multi-modal embedding support
    text_embedding VECTOR(768), -- text-embedding-004 (Vertex AI)
    multimodal_embedding VECTOR(1408), -- multimodalembedding@001

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Vector similarity indexes
CREATE INDEX document_chunks_text_embedding_idx ON document_chunks
    USING hnsw (text_embedding vector_cosine_ops);
CREATE INDEX document_chunks_multimodal_embedding_idx ON document_chunks
    USING hnsw (multimodal_embedding vector_cosine_ops);

-- Performance indexes
CREATE INDEX document_chunks_user_id_idx ON document_chunks(user_id);
CREATE INDEX document_chunks_document_id_idx ON document_chunks(document_id);
CREATE INDEX document_chunks_embedding_type_idx ON document_chunks(embedding_type);
```

## 7. User Experience & Real-Time Updates

### 7.1 Frontend Job Status UI

**Upload Interface:**

```typescript
interface UploadStatus {
  document: Document;
  job: ProcessingJob;
  progress: number;
  status: JobStatus;
  errorMessage?: string;
}

const FileUploadComponent = () => {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);

  const handleFileUpload = async (file: File) => {
    // Create document + job
    const { document, job } = await uploadFile(file, userId, workspaceId);

    // Add to tracking list
    setUploads(prev => [...prev, {
      document,
      job,
      progress: 0,
      status: 'pending'
    }]);
  };

  return (
    <div>
      {uploads.map(upload => (
        <UploadProgressCard
          key={upload.job.id}
          upload={upload}
          onStatusUpdate={setUploads}
        />
      ))}
    </div>
  );
};
```

**Progress Indicators:**

```typescript
const UploadProgressCard = ({ upload }: { upload: UploadStatus }) => {
  const jobStatus = useJobStatus(upload.job.id);

  const getProgressColor = (status: JobStatus) => {
    switch (status) {
      case 'processing': return 'blue';
      case 'processed': return 'green';
      case 'error': return 'red';
      case 'retry_pending': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center space-x-4">
        <FileIcon type={upload.document.mimeType} />
        <div className="flex-1">
          <h3>{upload.document.fileName}</h3>
          <Progress
            value={jobStatus?.processingProgress || 0}
            className={getProgressColor(jobStatus?.status || 'pending')}
          />
          <p className="text-sm text-gray-600">
            {getStatusMessage(jobStatus?.status, jobStatus?.processingProgress)}
          </p>
        </div>
        {jobStatus?.status === 'error' && (
          <Button onClick={() => retryJob(upload.job.id)}>
            Retry
          </Button>
        )}
      </div>
    </Card>
  );
};
```

### 7.2 Real-Time Notifications

**Database Polling Strategy:**

```typescript
// Frontend polls database directly for job status (NOT through rag-processor)
const useJobStatus = (jobId: string) => {
  const [status, setStatus] = useState<JobStatus>();

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      // Query Supabase directly for job status
      const job = await supabase
        .from("processing_jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      setStatus(job.data);

      // Stop polling when complete
      if (["processed", "error", "cancelled"].includes(job.data.status)) {
        clearInterval(pollInterval);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [jobId]);

  return status;
};
```

**Note**: The rag-processor does NOT provide WebSocket or any real-time APIs. Real-time updates come from the frontend polling the database directly.

**Toast Notifications:**

```typescript
const useJobNotifications = (jobId: string) => {
  const jobStatus = useJobStatus(jobId);

  useEffect(() => {
    if (jobStatus?.status === "processed") {
      toast.success(`${jobStatus.fileName} processed successfully!`);
    } else if (jobStatus?.status === "error") {
      toast.error(
        `Error processing ${jobStatus.fileName}: ${jobStatus.errorMessage}`,
      );
    }
  }, [jobStatus?.status]);
};
```

### 7.3 Bulk Operations

**Batch Upload Tracking:**

```typescript
interface BatchUpload {
  id: string;
  files: File[];
  jobs: ProcessingJob[];
  totalProgress: number;
  completedCount: number;
  errorCount: number;
}

const useBatchUpload = () => {
  const uploadBatch = async (files: File[]) => {
    const jobs = await Promise.all(
      files.map((file) => uploadFile(file, userId, workspaceId)),
    );

    return {
      id: uuid(),
      files,
      jobs: jobs.map((j) => j.job),
      totalProgress: 0,
      completedCount: 0,
      errorCount: 0,
    };
  };

  return { uploadBatch };
};
```

## 8. Infrastructure Components

### 8.1 Google Cloud Services

- **Cloud Run**: Serverless background worker container hosting (event-driven, no HTTP server)
- **Cloud Storage**: File storage and event triggers
- **Cloud Build**: CI/CD pipeline
- **Cloud Logging**: Centralized logging
- **Cloud Monitoring**: Performance and health monitoring
- **Eventarc**: Event routing from GCS to Cloud Run (alternative to Cloud Functions)

### 8.2 External Services

- **Supabase**: Database and vector storage
- **OpenAI/Anthropic**: Embedding generation APIs
- **Whisper API**: Audio/video transcription
- **Docling**: Document processing library

### 8.3 Security & Compliance

- **IAM**: Least privilege access
- **Service Accounts**: Dedicated accounts for Cloud Run
- **Network Security**: VPC and firewall rules
- **Data Encryption**: At rest and in transit
- **Audit Logging**: Complete audit trail

## 9. Performance & Scaling

### 9.1 Performance Targets

- **Video Processing**: < 10 minutes for 1-hour video
- **Document Processing**: < 2 minutes for 100-page document
- **Image Processing**: < 30 seconds per image
- **Audio Processing**: < 5 minutes for 1-hour audio

### 9.2 Scaling Strategy

- **Horizontal Scaling**: Cloud Run auto-scaling
- **Concurrent Processing**: Process chunks in parallel
- **Resource Optimization**: Container image optimization
- **Caching**: Cache models and frequent operations

### 9.3 Cost Optimization

- **Idle Scaling**: Scale to zero when not in use
- **Resource Right-sizing**: Optimize CPU/memory allocation
- **Batch Processing**: Group small files when beneficial
- **Storage Lifecycle**: Archive old files automatically

## 10. Monitoring & Observability

### 10.1 Key Metrics

- **Processing Time**: Per file type and size
- **Success Rate**: Processing success/failure rates
- **Resource Usage**: CPU, memory, network utilization
- **Error Rates**: By error type and service
- **Queue Depth**: Pending processing jobs
- **Job Status Distribution**: Count of jobs by status
- **Retry Rates**: Frequency of job retries by error type

### 10.2 Alerting

- **High Error Rates**: > 5% failure rate
- **Long Processing Times**: > 2x normal processing time
- **Resource Exhaustion**: > 80% resource utilization
- **Service Downtime**: Health check failures
- **Stuck Jobs**: Jobs in processing for > 30 minutes
- **High Retry Rates**: > 20% of jobs requiring retries

### 10.3 Logging Strategy

- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL
- **Retention**: 30 days for operational logs, 1 year for audit logs
- **Job Tracking**: All job status changes logged with context

## 11. Development & Deployment

### 11.1 Development Workflow

1. **Local Development**: Docker Compose environment
2. **Testing**: Unit and integration tests
3. **Staging**: Deploy to staging environment
4. **Production**: Automated deployment with approval gates

### 11.2 Environment Management

- **Development**: Local Docker environment
- **Staging**: Isolated GCP project
- **Production**: Production GCP project with full monitoring

### 11.3 Configuration Management

- **Environment Variables**: Cloud Run environment configuration
- **Secrets**: Google Secret Manager
- **Feature Flags**: Runtime configuration toggles

## 12. Future Enhancements

### 12.1 Short Term (Next 3 months)

- **Batch Processing**: Handle multiple small files efficiently
- **Enhanced Progress Tracking**: More granular progress updates
- **Preview Generation**: Thumbnails and previews for files
- **WebSocket Integration**: Real-time job status updates

### 12.2 Medium Term (3-6 months)

- **Custom Models**: Support for custom embedding models
- **Multi-language**: Enhanced language detection and processing
- **Advanced OCR**: Improved text extraction from images/PDFs
- **Job Prioritization**: User-defined processing priorities

### 12.3 Long Term (6+ months)

- **AI Enhancement**: LLM-powered content summarization
- **Real-time Processing**: Streaming processing for live content
- **Multi-cloud**: Support for additional cloud providers
- **Advanced Analytics**: Processing insights and optimization

## 13. Risk Assessment

### 13.1 Technical Risks

- **Vendor Lock-in**: Mitigated by containerization and standard APIs
- **API Rate Limits**: Implement queuing and rate limiting
- **Data Loss**: Comprehensive backup and recovery procedures
- **Security Breaches**: Multi-layer security implementation
- **Job Queue Overflow**: Monitor and implement job throttling
- **Processing Failures**: Robust retry mechanisms and error handling

### 13.2 Operational Risks

- **Cost Overruns**: Monitoring and alerting on spend
- **Performance Degradation**: Automated scaling and optimization
- **Service Dependencies**: Fallback options for critical services
- **Compliance**: Regular compliance audits and updates
- **User Experience**: Job status polling performance impact
- **Data Consistency**: Ensure atomic operations for job creation

## 14. RESOLVED DESIGN DECISIONS

### 14.1 Critical Implementation Details ✅

**1. Job ID Propagation Strategy**

```python
# RESOLVED: Query database using GCS path to find job
async def find_job_by_file_path(gcs_path: str) -> str:
    cursor.execute("""
        SELECT dpj.id FROM document_processing_jobs dpj
        JOIN documents d ON dpj.document_id = d.id
        WHERE d.gcs_path = %s AND dpj.status IN ('pending', 'processing')
    """, (gcs_path,))
    return cursor.fetchone()[0]
```

**2. Database Connection**

```python
# RESOLVED: Direct connection using environment variable
DATABASE_URL = os.getenv("DATABASE_URL")
conn = psycopg2.connect(DATABASE_URL)
```

**3. Schema Requirements**

- ✅ No workspace_id needed (keeping it simple)
- ✅ Documents table has all required fields: user_id, gcs_path, filename, file_size, mime_type
- ✅ Existing documents.ts schema is sufficient

**4. Embedding Strategy Logic**

```python
# RESOLVED: Clear logic for embedding types
def get_embedding_strategy(file_type: str) -> str:
    if file_type in ['pdf', 'docx', 'txt', 'html']:
        return 'text'  # Docling → text chunks → text embeddings
    elif file_type in ['mp3', 'wav', 'flac', 'aac']:
        return 'text'  # Audio → transcription → text embeddings
    elif file_type in ['jpg', 'png', 'gif', 'webp']:
        return 'multimodal'  # Image → multimodal embeddings
    elif file_type in ['mp4', 'avi', 'mov', 'mkv']:
        return 'multimodal'  # Video → multimodal embeddings
```

**5. Retry Strategy**

```python
# RESOLVED: Option A - Same execution retries (simplest)
async def process_with_retry(job_id: str, max_retries: int = 3):
    backoff_seconds = [1, 5, 15]  # 1s, 5s, 15s delays

    for attempt in range(max_retries):
        try:
            await process_document(...)
            await update_job_status(job_id, "processed")
            return
        except Exception as e:
            if attempt < max_retries - 1:
                await asyncio.sleep(backoff_seconds[attempt])
                await update_job_status(job_id, "retry_pending")
                continue
            else:
                await update_job_status(job_id, "error", error_message=str(e))
```

**6. File Management**

```python
# RESOLVED: Filename strategy with timestamp
def generate_unique_filename(original_name: str, extension: str) -> str:
    timestamp = int(time.time())
    return f"{original_name}_{timestamp}.{extension}"

# RESOLVED: File limits and concurrency
MAX_FILE_SIZE = 1024 * 1024 * 1024  # 1GB limit
MAX_CONCURRENT_JOBS_PER_USER = 2
```

**7. Processing Strategy**

```python
# RESOLVED: Chunking strategy for all media types
CHUNKING_STRATEGY = {
    'video': '2-minute chunks → transcribe → multimodal embeddings',
    'audio': '2-minute chunks → transcribe → text embeddings',
    'images': 'no chunking → direct multimodal embeddings',
    'documents': 'docling chunking → text embeddings'
}
```

**8. Cloud Run Scaling**

```python
# RESOLVED: Cloud Run with GPU auto-scaling
# - Auto-scales based on demand
# - Queues requests when max instances reached
# - No manual queue management needed
```

**9. Cleanup Policy**

```python
# RESOLVED: 1-day retention for temporary files
TEMP_FILE_RETENTION = 24 * 60 * 60  # 1 day in seconds
```

### 14.2 Job Status Flow ✅

```python
# RESOLVED: Job status updates at each stage
async def process_document_with_status_updates(job_id: str):
    await update_job_status(job_id, "processing", stage="downloading")
    file_path = await download_file_from_gcs(...)

    await update_job_status(job_id, "processing", stage="analyzing")
    file_type = detect_file_type(file_path)

    await update_job_status(job_id, "processing", stage="chunking")
    chunks = await chunk_file(file_path, file_type)

    await update_job_status(job_id, "processing", stage="embedding")
    embeddings = await generate_embeddings(chunks)

    await update_job_status(job_id, "processing", stage="storing")
    await store_embeddings(embeddings)

    await update_job_status(job_id, "processed")
```

### 14.3 Error Handling ✅

```python
# RESOLVED: Simple error handling (return error string)
try:
    await process_document(...)
except Exception as e:
    await update_job_status(job_id, "error", error_message=str(e))
    # No complex error classification needed
```

### 14.4 Implementation Priority ✅

1. **Phase 1**: Basic processing pipeline with job tracking
2. **Phase 2**: Retry logic and error handling
3. **Phase 3**: Real-time status updates and UI
4. **Phase 4**: Performance optimizations and monitoring

---

This system design provides a comprehensive foundation for building a scalable, reliable RAG processing system that can handle diverse file types while maintaining high performance and cost efficiency. All critical implementation details have been resolved and documented above.
