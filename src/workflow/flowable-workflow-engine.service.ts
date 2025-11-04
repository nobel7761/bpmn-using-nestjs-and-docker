import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import * as path from "path";
import { DatabaseService } from "../database/database.service";
import { DocumentProcessorService } from "../document-processor/document-processor.service";

const FormData = require("form-data");

@Injectable()
export class FlowableWorkflowEngineService implements OnModuleInit {
  private readonly flowableUrl: string;
  private readonly restEndpoint: string;
  private readonly auth: { username: string; password: string };
  private readonly processDefinitionKey = "process";

  constructor(
    private readonly db: DatabaseService,
    private readonly documentProcessor: DocumentProcessorService,
    private readonly configService: ConfigService
  ) {
    this.flowableUrl =
      this.configService.get<string>("FLOWABLE_URL") || "http://localhost:8080";
    this.restEndpoint = `${this.flowableUrl}/flowable-task/process-api`;
    this.auth = {
      username: "admin",
      password: "test",
    };
  }

  async onModuleInit() {
    await this.initializeFlowable();
  }

  async initializeFlowable() {
    try {
      // Give Flowable time to start
      await new Promise((resolve) => setTimeout(resolve, 30000));

      // Try to deploy BPMN process
      await this.deployProcess();

      console.log("Flowable started!");
    } catch (error) {
      console.error("Failed to start flowable:", error.message);
    }
  }

  async deployProcess() {
    try {
      // Check if process is already deployed
      const deployments = await axios.get(
        `${this.restEndpoint}/repository/process-definitions`,
        {
          auth: this.auth,
          params: { key: this.processDefinitionKey },
        }
      );

      if (deployments.data.data && deployments.data.data.length > 0) {
        console.log("Already deployed:", this.processDefinitionKey);
        return;
      }

      // Read BPMN file
      const bpmnPath = path.join(
        __dirname,
        "..",
        "..",
        "bpmn",
        "document_processing.bpmn"
      );
      const bpmnContent = fs.readFileSync(bpmnPath, "utf8");

      // Deploy process using multipart form data
      const formData = new FormData();
      formData.append("file", bpmnContent, {
        filename: "document_processing.bpmn",
        contentType: "text/xml",
      });

      const deployment = await axios.post(
        `${this.restEndpoint}/repository/deployments`,
        formData,
        {
          auth: this.auth,
          headers: {
            ...formData.getHeaders(),
          },
        }
      );

      console.log("Process deployed successfully:", deployment.data.id);

      // Also deploy to Flowable Modeler for visualization
      await this.deployToModeler(bpmnContent);
    } catch (error) {
      console.error("Process deployment failed:", error.message);
      // Continue anyway - might be already deployed
    }
  }

  async deployToModeler(bpmnContent: string) {
    try {
      const modelerUrl = `${this.flowableUrl}/flowable-modeler/api/models`;

      // Create model in Flowable Modeler
      const modelData = {
        name: "Document Processing Workflow",
        key: this.processDefinitionKey,
        description:
          "Automated invoice approval workflow with amount-based routing",
        modelType: 0, // 0 = BPMN model
      };

      const createResponse = await axios.post(modelerUrl, modelData, {
        auth: this.auth,
        headers: { "Content-Type": "application/json" },
      });

      const modelId = createResponse.data.id;
      console.log(`Model created: ${modelId}`);

      // Upload BPMN XML to the model
      await axios.put(
        `${modelerUrl}/${modelId}/editor/json`,
        {
          xml: bpmnContent,
        },
        {
          auth: this.auth,
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("BPMN model uploaded!");
    } catch (error) {
      console.warn("Model may already exist:", error.message);
    }
  }

  async startWorkflow(
    documentId: string,
    filePath: string,
    originalFilename: string
  ) {
    try {
      console.log("startWorkflow called with:", {
        documentId,
        filePath,
        originalFilename,
      });

      // Create document record
      await this.db.createDocument(documentId, originalFilename, filePath);

      // File validating
      this.documentProcessor.validateFile(filePath);
      const extractedText = await this.documentProcessor.extractText(filePath);
      const extractedData =
        this.documentProcessor.parseDocumentData(extractedText);

      const amount = extractedData.amount || 0;

      // Start Flowable process instance with amount variable
      const processInstance = await axios.post(
        `${this.restEndpoint}/runtime/process-instances`,
        {
          processDefinitionKey: this.processDefinitionKey,
          variables: [
            { name: "documentId", value: documentId },
            { name: "filePath", value: filePath },
            { name: "originalFilename", value: originalFilename },
            { name: "amount", value: amount },
            { name: "startTime", value: new Date().toISOString() },
          ],
        },
        {
          auth: this.auth,
        }
      );

      console.log(
        `Started Flowable process: ${processInstance.data.id} (amount: ${amount})`
      );
      console.log(
        "Process instance details:",
        JSON.stringify(processInstance.data, null, 2)
      );

      // Complete the "Upload Document" user task automatically since document is already uploaded
      await this.completeUploadDocumentTask(processInstance.data.id);

      // Continue processing with extracted data
      await this.db.updateDocument(documentId, {
        extractedData: extractedData,
        status: "data_extracted",
      });

      // Handle approval logic
      // ManualApprove
      if (amount >= 1000) {
        await this.createManualApprovalTask(
          documentId,
          extractedData,
          processInstance.data.id
        );
        return {
          document_id: documentId,
          process_instance_id: processInstance.data.id,
          status: "awaiting_approval",
          extracted: extractedData,
          message: "Document requires manual approval due to amount >= $1000",
        };
      }
      // AutoApprove
      else {
        const approvalResult = await this.executeAutoApproval(
          documentId,
          extractedData,
          processInstance.data.id
        );
        return {
          document_id: documentId,
          process_instance_id: processInstance.data.id,
          status: "approved",
          extracted: extractedData,
          message: "Document automatically approved",
        };
      }
    } catch (error) {
      console.error("Error in startWorkflow:", error);
      console.error("Error stack:", error.stack);
      console.error(
        "Error details:",
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      );

      try {
        await this.db.updateDocument(documentId, { status: "error" });
      } catch (dbError) {
        console.error("Failed to update document status:", dbError);
      }

      throw new Error(`Failed to start Flowable workflow: ${error.message}`);
    }
  }

  async processDocument(
    documentId: string,
    filePath: string,
    processInstanceId: string
  ) {
    try {
      console.log(`Processing document: ${documentId}`);

      // Step 1: Validate and extract text
      this.documentProcessor.validateFile(filePath);
      const extractedText = await this.documentProcessor.extractText(filePath);

      // Step 2: Parse data
      const extractedData =
        this.documentProcessor.parseDocumentData(extractedText);

      await this.db.updateDocument(documentId, {
        extractedData: extractedData,
        status: "data_extracted",
      });

      // Step 3: Decision logic
      const amount = extractedData.amount || 0;

      if (amount >= 1000) {
        // Create manual approval task
        await this.createManualApprovalTask(
          documentId,
          extractedData,
          processInstanceId
        );
      } else {
        // Auto approve
        await this.executeAutoApproval(
          documentId,
          extractedData,
          processInstanceId
        );
      }
    } catch (error) {
      console.error("Document processing error:", error);
      await this.db.updateDocument(documentId, { status: "error" });

      // Signal error to Flowable process
      await this.signalProcessError(processInstanceId, error.message);
    }
  }

  async createManualApprovalTask(
    documentId: string,
    extractedData: any,
    processInstanceId: string
  ) {
    try {
      const taskId = `TASK-${uuidv4().substring(0, 8).toUpperCase()}`;

      // Create task in database
      await this.db.createTask(taskId, documentId, "manual_approval", {
        extracted_data: extractedData,
        process_instance_id: processInstanceId,
        requires_approval: true,
        amount: extractedData.amount,
      });

      // Update document status
      await this.db.updateDocument(documentId, {
        status: "awaiting_approval",
      });

      console.log(`Manual approval task created: ${taskId}`);

      return {
        status: "awaiting_approval",
        extracted: extractedData,
        task_id: taskId,
        message: "Document requires manual approval due to amount >= $1000",
      };
    } catch (error) {
      throw new Error(
        `Failed to create manual approval task: ${error.message}`
      );
    }
  }

  async executeAutoApproval(
    documentId: string,
    extractedData: any,
    processInstanceId: string
  ) {
    try {
      const approvalResult = {
        status: "approved",
        approval_type: "automatic",
        approved_by: "system",
        approved_at: new Date().toISOString(),
        reason: "Amount below $1000 threshold",
      };

      await this.db.updateDocument(documentId, {
        status: "approved",
        workflowData: approvalResult,
      });

      // Signal completion to Flowable
      await this.signalProcessCompletion(processInstanceId, approvalResult);

      console.log(`Document auto-approved: ${documentId}`);

      return {
        status: "approved",
        extracted: extractedData,
        approval: approvalResult,
        message: "Document automatically approved",
      };
    } catch (error) {
      throw new Error(`Auto approval failed: ${error.message}`);
    }
  }

  async completeManualTask(
    taskId: string,
    action: string,
    reason: string = ""
  ) {
    try {
      const task = await this.db.getTask(taskId);
      if (!task || task.status !== "pending") {
        throw new Error("Task not found or already completed");
      }

      const documentId = task.document_id;
      const processInstanceId = task.data.process_instance_id;

      // Complete the task in database
      const taskResult = {
        action: action,
        completed_by: "user",
        completed_at: new Date().toISOString(),
        reason: reason,
      };

      await this.db.completeTask(taskId, taskResult);

      // Update document based on action
      if (action === "approve") {
        const approvalResult = {
          status: "approved",
          approval_type: "manual",
          ...taskResult,
        };

        await this.db.updateDocument(documentId, {
          status: "approved",
          workflowData: approvalResult,
        });

        // Signal approval to Flowable
        await this.signalProcessCompletion(processInstanceId, approvalResult);
      } else {
        const rejectionResult = {
          status: "rejected",
          approval_type: "manual",
          ...taskResult,
        };

        await this.db.updateDocument(documentId, {
          status: "rejected",
          workflowData: rejectionResult,
        });

        // Signal rejection to Flowable
        await this.signalProcessCompletion(processInstanceId, rejectionResult);
      }

      return {
        document_id: documentId,
        status: action === "approve" ? "approved" : "rejected",
        task_result: taskResult,
        message: `Document ${action}d via Flowable workflow`,
      };
    } catch (error) {
      throw new Error(`Failed to complete manual task: ${error.message}`);
    }
  }

  async signalProcessCompletion(processInstanceId: string, result: any) {
    try {
      await axios.post(
        `${this.restEndpoint}/runtime/process-instances/${processInstanceId}/variables`,
        [
          { name: "completed", value: true },
          { name: "result", value: JSON.stringify(result) },
        ],
        {
          auth: this.auth,
        }
      );
    } catch (error) {
      console.error("Failed to signal process completion:", error.message);
    }
  }

  async signalProcessError(processInstanceId: string, errorMessage: string) {
    try {
      await axios.post(
        `${this.restEndpoint}/runtime/process-instances/${processInstanceId}/variables`,
        [
          { name: "error", value: true },
          { name: "errorMessage", value: errorMessage },
        ],
        {
          auth: this.auth,
        }
      );
    } catch (error) {
      console.error("Failed to signal process error:", error.message);
    }
  }

  async getDocumentStatus(documentId: string) {
    try {
      const document = await this.db.getDocument(documentId);
      if (!document) return null;

      const result: any = {
        document_id: documentId,
        filename: document.filename,
        status: document.status,
        created_at: document.created_at,
        updated_at: document.updated_at,
      };

      if (document.extracted_data) {
        result.extracted = document.extracted_data;
      }

      if (document.workflow_data) {
        result.workflow_result = document.workflow_data;
      }

      // Get pending tasks
      const allTasks = await this.db.getPendingTasks();
      const pendingTasks = allTasks.filter(
        (task: any) => task.document_id === documentId
      );

      if (pendingTasks.length > 0) {
        result.pending_tasks = pendingTasks.map((task: any) => ({
          task_id: task.id,
          task_type: task.task_type,
          created_at: task.created_at,
        }));
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to get document status: ${error.message}`);
    }
  }

  async getPendingTasks() {
    try {
      const tasks = await this.db.getPendingTasks();

      return tasks.map((task: any) => ({
        task_id: task.id,
        document_id: task.document_id,
        filename: task.filename || task.document?.filename,
        task_type: task.task_type,
        created_at: task.created_at,
        extracted_data: task.extracted_data || task.document?.extracted_data,
        requires_approval: task.data?.requires_approval || false,
        amount: task.data?.amount || 0,
      }));
    } catch (error) {
      throw new Error(`Failed to get pending tasks: ${error.message}`);
    }
  }

  async getAllWorkflows() {
    try {
      // Get process instances from Flowable
      const processInstances = await axios.get(
        `${this.restEndpoint}/runtime/process-instances`,
        {
          auth: this.auth,
          params: { processDefinitionKey: this.processDefinitionKey },
        }
      );

      return processInstances.data.data.map((instance: any) => ({
        process_instance_id: instance.id,
        process_definition_key: instance.processDefinitionKey,
        status: instance.ended ? "completed" : "active",
        started: instance.startTime,
        ended: instance.endTime,
      }));
    } catch (error) {
      console.error("Failed to get workflows from Flowable:", error.message);
      return [];
    }
  }

  async completeUploadDocumentTask(processInstanceId: string) {
    try {
      // Get tasks for this process instance
      const tasksResponse = await axios.get(
        `${this.restEndpoint}/runtime/tasks`,
        {
          auth: this.auth,
          params: { processInstanceId: processInstanceId },
        }
      );

      // Find Upload Document task
      const uploadTask = tasksResponse.data.data.find(
        (task: any) => task.name === "Upload Document"
      );

      if (uploadTask) {
        console.log(`Found Upload Document task: ${uploadTask.id}`);

        await axios.post(
          `${this.restEndpoint}/runtime/tasks/${uploadTask.id}`,
          {
            action: "complete",
          },
          {
            auth: this.auth,
          }
        );

        console.log(`Completed Upload Document task: ${uploadTask.id}`);
      } else {
        console.log(
          "Upload Document task not found - process may have already progressed"
        );
      }
    } catch (error: any) {
      console.error(
        "Error completing upload task:",
        error.response?.data || error.message
      );
      // Don't throw - this is a background operation that shouldn't fail the main flow
    }
  }
}
