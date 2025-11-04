import { Module } from "@nestjs/common";
import { FlowableWorkflowEngineService } from "./flowable-workflow-engine.service";
import { WorkflowService } from "./workflow.service";
import { DatabaseModule } from "../database/database.module";
import { DocumentProcessorModule } from "../document-processor/document-processor.module";

@Module({
  imports: [DatabaseModule, DocumentProcessorModule],
  providers: [FlowableWorkflowEngineService, WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
