<div align="center">
  <h1>Document Processing Workflow with Flowable (NestJS)</h1>
  <p>Automated document processing system using Flowable BPMN engine for invoice approval workflows.</p>
</div>

## Run

```bash
# Install dependencies
npm install

# UP
npm run docker:up
# or
docker-compose up --build

# Down
npm run docker:down
# or
docker-compose down
```

## URL Endpoints

| Service | URL                                                                                                                  |
| ------- | -------------------------------------------------------------------------------------------------------------------- |
| Modeler | [http://localhost:8080/flowable-modeler](http://localhost:8080/flowable-modeler)                                     |
| Tasks   | [http://localhost:8080/flowable-task/workflow/#/tasks](http://localhost:8080/flowable-task/workflow/#/tasks)         |
| Process | [http://localhost:8080/flowable-task/workflow/#/processes](http://localhost:8080/flowable-task/workflow/#/processes) |

## Credentials

| Field        | Value   |
| ------------ | ------- |
| **Username** | `admin` |
| **Password** | `test`  |

## Overview

Processes PDF/DOCX invoices with automatic approval routing:

- **Amount < $1000**: Auto-approved
- **Amount >= $1000**: Manual approval required

## Tech Stack

**BPMN Engine**: `Flowable (all-in-one)` | **Backend**: `NestJS`, `TypeScript` | **Database**: `MongoDB` | **Document Processing**: `PDF-Parse`, `Mammoth` | **Container**: `Docker`

## API Endpoints

### 1. Check Health

```bash
GET http://localhost:5001/health
```

### 2. Get Token

```bash
GET http://localhost:5001/getToken
```

### 3. Upload Document

```bash
POST http://localhost:5001/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
Body: file (PDF or DOCX)
```

### 4. Get Document Status

```bash
GET http://localhost:5001/documents/{documentId}
```

### 5. Approve/Reject Task

```bash
POST http://localhost:5001/tasks/{taskId}/complete
Body: { "action": "approve|reject", "reason": "..." }
```

### 6. Get All Pending Tasks

```bash
GET http://localhost:5001/tasks
```

### 7. Get All Workflows

```bash
GET http://localhost:5001/workflows
```

### 8. Get BPMN Definition

```bash
GET http://localhost:5001/bpmn/definition
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://mrs-admin:3ioWTBd6P098mCqj@cluster0.grizk.mongodb.net/business-analyst-wsd?retryWrites=true&w=majority&appName=Cluster0
FLOWABLE_URL=http://localhost:8080
```

## Project Structure

```
backend-nobel/
├── bpmn/
│   └── document_processing.bpmn
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   └── jwt-auth.guard.ts
│   ├── bpmn/
│   │   └── bpmn.controller.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── database.service.ts
│   │   └── schemas/
│   │       ├── document.schema.ts
│   │       ├── task.schema.ts
│   │       └── workflow.schema.ts
│   ├── document-processor/
│   │   ├── document-processor.module.ts
│   │   └── document-processor.service.ts
│   ├── documents/
│   │   └── documents.controller.ts
│   ├── health/
│   │   └── health.controller.ts
│   ├── tasks/
│   │   └── tasks.controller.ts
│   ├── workflow/
│   │   ├── flowable-workflow-engine.service.ts
│   │   ├── workflow.module.ts
│   │   └── workflow.service.ts
│   ├── workflows/
│   │   └── workflows.controller.ts
│   ├── app.module.ts
│   └── main.ts
├── docker-compose.yml
├── Dockerfile
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

## View BPMN Diagram

**Flowable Modeler (Import Required)**

1. Go to http://localhost:8080/flowable-modeler/#/processes
2. Login: admin / test
3. Click "Import Process"
4. Upload `bpmn/document_processing.bpmn`
5. View the visual diagram

> **Note**: The process is auto-deployed to Flowable Engine on startup, but the Modeler requires manual import to visualize it.
