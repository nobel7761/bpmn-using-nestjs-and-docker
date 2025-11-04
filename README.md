# 📄 Document Processing Workflow System

<div align="center">
  <h3>Automated BPMN-based Document Processing with Approval Workflows</h3>
  <p>Built with NestJS, Flowable BPMN Engine, and MongoDB</p>
</div>

---

## 📋 Description

This is a **document processing workflow system** that automatically processes Word (DOCX) and PDF files containing invoices or application data. The system extracts key information (invoice number, customer name, amount) and implements an intelligent approval workflow based on business rules.

### Key Features

- **Automated Document Processing**: Upload PDF or DOCX files and automatically extract structured data
- **BPMN 2.0 Workflow Engine**: Uses Flowable BPMN engine for process automation
- **Smart Approval Logic**:
  - Documents with amount **< $1000** → Auto-approved
  - Documents with amount **≥ $1000** → Require manual approval
- **RESTful API**: Complete REST API for document upload, status tracking, and task management
- **Error Handling**: Comprehensive error boundaries for invalid files and processing failures
- **JWT Authentication**: Secure API endpoints with JWT token-based authentication
- **Docker Support**: Fully containerized with Docker and Docker Compose

### Workflow Process

```
1. Document Upload → 2. File Validation → 3. Text Extraction → 4. Data Parsing
                                                                    ↓
5. Amount Check (Gateway) → 6a. Auto-Approve (< $1000) OR 6b. Manual Approval (≥ $1000)
                                                                    ↓
                                                        7. Save Result → 8. End
```

---

## 🛠️ Tech Stack

### Backend Framework

- **NestJS** (v10.3.0) - Progressive Node.js framework for scalable server-side applications
- **TypeScript** - Type-safe JavaScript development
- **Express** - Web application framework

### BPMN Engine

- **Flowable All-in-One** - Enterprise-grade BPMN 2.0 workflow engine
  - Process definition and execution
  - Task management
  - Process visualization

### Database

- **MongoDB** - NoSQL database for document and workflow data storage
- **Mongoose** - MongoDB object modeling for Node.js

### Document Processing

- **Mammoth** (v1.6.0) - DOCX to HTML/text conversion
- **PDF-Parse** (v1.1.1) - PDF text extraction

### Security & Utilities

- **JWT** - JSON Web Token authentication
- **Helmet** - Security middleware
- **Class Validator** - Input validation and transformation
- **UUID** - Unique identifier generation

### Development Tools

- **Docker & Docker Compose** - Containerization
- **ESLint & Prettier** - Code quality and formatting

---

## 🚀 How to Use This Project

### Prerequisites

- **Node.js** (v18 or higher)
- **Docker** and **Docker Compose** (for containerized deployment)
- **MongoDB** (or use MongoDB Atlas connection string)

### Quick Start with Docker (Recommended)

1. **Clone the repository** (if applicable) or navigate to the project directory:

   ```bash
   cd backend-nobel
   ```

2. **Start the services**:

   ```bash
   npm run docker:up
   # OR
   docker-compose up --build
   ```

   This will start:
   - Document Workflow API on `http://localhost:5001`
   - Flowable BPMN Engine on `http://localhost:8080`

3. **Wait for services to initialize** (approximately 30-60 seconds)

4. **Verify the setup**:
   ```bash
   curl http://localhost:5001/health
   ```

### Local Development Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory:

   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   FLOWABLE_URL=http://localhost:8080
   NODE_ENV=development
   ```

3. **Start Flowable separately** (if not using Docker):

   ```bash
   docker run -d -p 8080:8080 flowable/all-in-one
   ```

4. **Start the development server**:

   ```bash
   npm run start:dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   npm run start:prod
   ```

### Stop Services

```bash
npm run docker:down
# OR
docker-compose down
```

---

## 📡 API Endpoints

### Base URL

- **Docker**: `http://localhost:5001`
- **Local**: `http://localhost:5000`

### Authentication

Most endpoints require JWT authentication. Get a token first:

#### 1. Get Authentication Token

```http
GET /getToken
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Usage:**
Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

---

### Document Management

#### 2. Upload Document

```http
POST /documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request:**

- `file`: PDF or DOCX file (max 16MB)

**Response:**

```json
{
  "document_id": "DOC-0FB166B4",
  "status": "processing",
  "message": "Document uploaded and workflow started"
}
```

**Example (cURL):**

```bash
curl -X POST http://localhost:5001/documents/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/invoice.pdf"
```

#### 3. Get Document Status

```http
GET /documents/{documentId}
```

**Response:**

```json
{
  "document_id": "DOC-0FB166B4",
  "status": "awaiting_approval",
  "extracted": {
    "invoice_number": "INV-1234",
    "customer_name": "Acme Inc",
    "amount": 1250.5
  },
  "workflow_instance_id": "12345",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:31:00Z"
}
```

**Status Values:**

- `processing` - Document is being processed
- `awaiting_approval` - Manual approval required
- `approved` - Document approved (auto or manual)
- `rejected` - Document rejected
- `error` - Processing error occurred

**Example:**

```bash
curl http://localhost:5001/documents/DOC-0FB166B4
```

---

### Task Management

#### 4. Get All Pending Tasks

```http
GET /tasks
```

**Response:**

```json
{
  "tasks": [
    {
      "task_id": "67890",
      "document_id": "DOC-0FB166B4",
      "name": "Manual Approval Required",
      "status": "pending",
      "extracted_data": {
        "invoice_number": "INV-1234",
        "customer_name": "Acme Inc",
        "amount": 1250.5
      },
      "created_at": "2024-01-15T10:31:00Z"
    }
  ],
  "count": 1
}
```

#### 5. Complete Task (Approve/Reject)

```http
POST /tasks/{taskId}/complete
Content-Type: application/json
```

**Request Body:**

```json
{
  "action": "approve",
  "reason": "Amount is within acceptable range"
}
```

**OR**

```json
{
  "action": "reject",
  "reason": "Amount exceeds budget"
}
```

**Response:**

```json
{
  "task_id": "67890",
  "document_id": "DOC-0FB166B4",
  "action": "approve",
  "status": "completed",
  "message": "Task completed successfully"
}
```

**Example:**

```bash
curl -X POST http://localhost:5001/tasks/67890/complete \
  -H "Content-Type: application/json" \
  -d '{"action": "approve", "reason": "Approved"}'
```

---

### Workflow Management

#### 6. Get All Workflows

```http
GET /workflows
```

**Response:**

```json
{
  "workflows": [
    {
      "instance_id": "12345",
      "document_id": "DOC-0FB166B4",
      "status": "active",
      "process_definition_key": "process",
      "started_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

#### 7. Get BPMN Process Definition

```http
GET /bpmn/definition
```

**Response:**
Returns the BPMN XML definition of the document processing workflow.

---

### Health & Monitoring

#### 8. Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "message": "Document Processing Workflow API",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🔐 Flowable UI Access

After starting the services, you can access Flowable's web interfaces:

| Service                | URL                                                      | Credentials      |
| ---------------------- | -------------------------------------------------------- | ---------------- |
| **Flowable Modeler**   | http://localhost:8080/flowable-modeler                   | `admin` / `test` |
| **Flowable Task**      | http://localhost:8080/flowable-task/workflow/#/tasks     | `admin` / `test` |
| **Flowable Processes** | http://localhost:8080/flowable-task/workflow/#/processes | `admin` / `test` |

### Viewing the BPMN Diagram

1. Navigate to http://localhost:8080/flowable-modeler/#/processes
2. Login with credentials: `admin` / `test`
3. Click "Import Process"
4. Upload `bpmn/document_processing.bpmn`
5. View the visual workflow diagram

> **Note**: The BPMN process is automatically deployed to the Flowable engine on startup. The Modeler UI requires manual import for visualization.

---

## 📁 Project Structure

```
backend-nobel/
├── bpmn/                          # BPMN process definitions
│   └── document_processing.bpmn   # Main workflow definition
├── src/                           # Source code
│   ├── auth/                      # Authentication module
│   │   ├── auth.controller.ts     # Token generation endpoint
│   │   └── jwt-auth.guard.ts      # JWT authentication guard
│   ├── bpmn/                      # BPMN management
│   │   └── bpmn.controller.ts     # BPMN definition endpoints
│   ├── database/                  # Database layer
│   │   ├── database.module.ts
│   │   ├── database.service.ts    # MongoDB operations
│   │   └── schemas/               # Mongoose schemas
│   │       ├── document.schema.ts
│   │       ├── task.schema.ts
│   │       └── workflow.schema.ts
│   ├── document-processor/        # Document processing
│   │   ├── document-processor.module.ts
│   │   └── document-processor.service.ts  # Text extraction & parsing
│   ├── documents/                 # Document endpoints
│   │   └── documents.controller.ts
│   ├── health/                    # Health check
│   │   └── health.controller.ts
│   ├── tasks/                     # Task management
│   │   └── tasks.controller.ts
│   ├── workflow/                  # Workflow engine integration
│   │   ├── flowable-workflow-engine.service.ts  # Flowable integration
│   │   ├── workflow.module.ts
│   │   └── workflow.service.ts
│   ├── workflows/                 # Workflow endpoints
│   │   └── workflows.controller.ts
│   ├── app.module.ts              # Root module
│   └── main.ts                    # Application entry point
├── test-files/                    # Sample documents for testing
│   ├── sample_invoice_auto_approval.docx
│   ├── sample_invoice_auto_approval.pdf
│   ├── sample_invoice_manual_approval.docx
│   └── sample_invoice_manual_approval.pdf
├── uploads/                       # Uploaded documents (created at runtime)
├── dist/                          # Compiled JavaScript (build output)
├── docker-compose.yml             # Docker Compose configuration
├── Dockerfile                     # Docker image definition
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── nest-cli.json                  # NestJS CLI configuration
└── README.md                      # This file
```

---

## 🔄 Workflow Details

### BPMN Process Flow

The workflow follows this BPMN 2.0 process:

1. **Start Event** → Triggered by `/documents/upload` API call
2. **Upload Document Task** → User task for document upload
3. **Validate Document** → Service task that validates file type and extracts data
4. **Exclusive Gateway (Amount Check)**:
   - **Amount < $1000** → Route to Auto-Approve
   - **Amount ≥ $1000** → Route to Manual Approval
5. **Auto-Approve Task** → Automatically approves documents below threshold
6. **Manual Approval Task** → User task requiring API call to `/tasks/{id}/complete`
7. **Merge Gateway** → Combines both approval paths
8. **End Event** → Workflow completes

### Data Extraction

The system extracts the following fields from documents:

- **Invoice Number**: Extracted using patterns like "Invoice Number:", "INV-1234", etc.
- **Customer Name**: Extracted from "Name:" fields or similar patterns
- **Amount**: Extracted from "Total:", "Amount:", "$XXX", etc. (takes the largest value found)

### Error Handling

- Invalid file types are rejected at upload
- File size limits (16MB) are enforced
- Text extraction failures trigger error boundary events
- Invalid or missing data can route to error paths

---

## 🧪 Testing

### Sample Files

Test files are included in the `test-files/` directory:

- `sample_invoice_auto_approval.docx` / `.pdf` - Amount < $1000 (auto-approved)
- `sample_invoice_manual_approval.docx` / `.pdf` - Amount ≥ $1000 (requires approval)

### Testing Workflow

1. **Get a token**:

   ```bash
   curl http://localhost:5001/getToken
   ```

2. **Upload a document**:

   ```bash
   curl -X POST http://localhost:5001/documents/upload \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@test-files/sample_invoice_manual_approval.pdf"
   ```

3. **Check document status**:

   ```bash
   curl http://localhost:5001/documents/DOC-XXXXX
   ```

4. **List pending tasks** (if amount ≥ $1000):

   ```bash
   curl http://localhost:5001/tasks
   ```

5. **Complete a task**:
   ```bash
   curl -X POST http://localhost:5001/tasks/TASK_ID/complete \
     -H "Content-Type: application/json" \
     -d '{"action": "approve", "reason": "Looks good"}'
   ```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Flowable Configuration
FLOWABLE_URL=http://flowable:8080

# JWT Configuration (optional, defaults provided)
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=2h
```

**Note**: For Docker Compose, the `MONGO_URI` and `FLOWABLE_URL` are configured in `docker-compose.yml`.

---

## 🐳 Docker Configuration

### Docker Compose Services

1. **document-workflow**: The NestJS API server
   - Port: `5001:5000`
   - Volumes: `./uploads` (for uploaded files)

2. **flowable**: Flowable All-in-One BPMN engine
   - Port: `8080:8080`
   - Database: H2 (in-memory, persisted in volume)

### Building and Running

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f document-workflow
docker-compose logs -f flowable
```

---

## 📝 API Request Examples

### Using cURL

```bash
# 1. Get token
TOKEN=$(curl -s http://localhost:5001/getToken | jq -r '.token')

# 2. Upload document
curl -X POST http://localhost:5001/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@invoice.pdf"

# 3. Get document status
curl http://localhost:5001/documents/DOC-0FB166B4

# 4. List tasks
curl http://localhost:5001/tasks

# 5. Complete task
curl -X POST http://localhost:5001/tasks/67890/complete \
  -H "Content-Type: application/json" \
  -d '{"action": "approve", "reason": "Approved"}'
```

### Using Postman

A `postman_collection.json` file can be created with all endpoints. Import it into Postman for easy testing.

---

## 🔧 Development Scripts

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugging

# Production
npm run build              # Build TypeScript to JavaScript
npm run start:prod         # Start production server

# Code Quality
npm run lint               # Run ESLint
npm run format             # Format code with Prettier

# Docker
npm run docker:up          # Start Docker services
npm run docker:down        # Stop Docker services
```

---

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Flowable Documentation](https://www.flowable.com/open-source/docs/)
- [BPMN 2.0 Specification](https://www.omg.org/spec/BPMN/2.0/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)

---

## 🐛 Troubleshooting

### Common Issues

1. **Flowable not starting**:
   - Wait 30-60 seconds for Flowable to initialize
   - Check logs: `docker-compose logs flowable`
   - Ensure port 8080 is not in use

2. **MongoDB connection errors**:
   - Verify `MONGO_URI` in `.env` or `docker-compose.yml`
   - Check network connectivity to MongoDB

3. **Document upload fails**:
   - Ensure file is PDF or DOCX
   - Check file size (max 16MB)
   - Verify JWT token is valid

4. **Tasks not appearing**:
   - Check if document amount is ≥ $1000
   - Verify workflow instance is active
   - Check Flowable Task UI at http://localhost:8080/flowable-task

---

<div align="center">
  <p>Built with ❤️ using NestJS and Flowable</p>
</div>
