import { Injectable } from "@nestjs/common";
import { FlowableWorkflowEngineService } from "./flowable-workflow-engine.service";

@Injectable()
export class WorkflowService {
  constructor(private readonly flowableEngine: FlowableWorkflowEngineService) {
    console.log("Using Flowable BPMN Engine");
  }

  async startWorkflow(
    documentId: string,
    filePath: string,
    originalFilename: string
  ) {
    return await this.flowableEngine.startWorkflow(
      documentId,
      filePath,
      originalFilename
    );
  }

  async completeTask(taskId: string, action: string, reason: string = "") {
    return await this.flowableEngine.completeManualTask(taskId, action, reason);
  }

  async getDocumentStatus(documentId: string) {
    return await this.flowableEngine.getDocumentStatus(documentId);
  }

  async getPendingTasks() {
    return await this.flowableEngine.getPendingTasks();
  }

  async getAllWorkflows() {
    return await this.flowableEngine.getAllWorkflows();
  }
}
