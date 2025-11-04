import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { DocumentModel, DocumentDocument } from "./schemas/document.schema";
import { TaskModel, TaskDocument } from "./schemas/task.schema";
import { WorkflowModel, WorkflowDocument } from "./schemas/workflow.schema";

@Injectable()
export class DatabaseService {
  constructor(
    @InjectModel(DocumentModel.name)
    private documentModel: Model<DocumentDocument>,
    @InjectModel(TaskModel.name)
    private taskModel: Model<TaskDocument>,
    @InjectModel(WorkflowModel.name)
    private workflowModel: Model<WorkflowDocument>
  ) {}

  // --- Documents ---
  async createDocument(documentId: string, filename: string, filePath: string) {
    await this.documentModel.create({
      id: documentId,
      filename,
      file_path: filePath,
      status: "processing",
    });
    return documentId;
  }

  async updateDocument(documentId: string, updates: any) {
    const updateData: any = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.extractedData)
      updateData.extracted_data = updates.extractedData;
    if (updates.workflowData) updateData.workflow_data = updates.workflowData;

    const res = await this.documentModel.updateOne(
      { id: documentId },
      updateData
    );
    return res.modifiedCount > 0;
  }

  async getDocument(documentId: string) {
    return await this.documentModel.findOne({ id: documentId }).lean();
  }

  // --- Tasks ---
  async createTask(
    taskId: string,
    documentId: string,
    taskType: string,
    data: any = null
  ) {
    await this.taskModel.create({
      id: taskId,
      document_id: documentId,
      task_type: taskType,
      status: "pending",
      data,
    });
    return taskId;
  }

  async completeTask(taskId: string, resultData: any = null) {
    const res = await this.taskModel.updateOne(
      { id: taskId },
      {
        status: "completed",
        data: resultData,
        completed_at: new Date(),
      }
    );
    return res.modifiedCount > 0;
  }

  async getTask(taskId: string) {
    return await this.taskModel.findOne({ id: taskId }).lean();
  }

  async getPendingTasks() {
    // Get the actual collection name from the model
    const documentCollectionName = this.documentModel.collection.name;

    const tasks = await this.taskModel.aggregate([
      { $match: { status: "pending" } },
      {
        $lookup: {
          from: documentCollectionName,
          localField: "document_id",
          foreignField: "id",
          as: "document",
        },
      },
      {
        $unwind: {
          path: "$document",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { created_at: 1 } },
      {
        $project: {
          id: 1,
          document_id: 1,
          task_type: 1,
          status: 1,
          data: 1,
          created_at: 1,
          "document.filename": 1,
          "document.extracted_data": 1,
        },
      },
    ]);

    return tasks;
  }

  // --- Workflow Instances ---
  async createWorkflowInstance(
    workflowId: string,
    documentId: string,
    initialStep: string
  ) {
    await this.workflowModel.create({
      id: workflowId,
      document_id: documentId,
      current_step: initialStep,
      status: "running",
      variables: {},
    });
    return workflowId;
  }

  async updateWorkflowInstance(workflowId: string, updates: any) {
    const updateData: any = {};
    if (updates.currentStep) updateData.current_step = updates.currentStep;
    if (updates.status) updateData.status = updates.status;
    if (updates.variables) updateData.variables = updates.variables;
    if (updates.errorMessage) updateData.error_message = updates.errorMessage;

    const res = await this.workflowModel.updateOne(
      { id: workflowId },
      updateData
    );
    return res.modifiedCount > 0;
  }

  async getWorkflowInstance(workflowId: string) {
    return await this.workflowModel.findOne({ id: workflowId }).lean();
  }

  async getAllWorkflowInstances() {
    return await this.workflowModel.find().sort({ created_at: -1 }).lean();
  }
}
