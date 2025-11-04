import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DatabaseService } from "./database.service";
import { DocumentModel, DocumentSchema } from "./schemas/document.schema";
import { TaskModel, TaskSchema } from "./schemas/task.schema";
import { WorkflowModel, WorkflowSchema } from "./schemas/workflow.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentModel.name, schema: DocumentSchema },
      { name: TaskModel.name, schema: TaskSchema },
      { name: WorkflowModel.name, schema: WorkflowSchema },
    ]),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
