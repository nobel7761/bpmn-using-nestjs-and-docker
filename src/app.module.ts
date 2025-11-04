import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

import { DocumentsController } from "./documents/documents.controller";
import { TasksController } from "./tasks/tasks.controller";
import { AuthController } from "./auth/auth.controller";
import { HealthController } from "./health/health.controller";
import { WorkflowsController } from "./workflows/workflows.controller";
import { BpmnController } from "./bpmn/bpmn.controller";
import { JwtModule } from "@nestjs/jwt";
import { DatabaseModule } from "./database/database.module";
import { DocumentProcessorModule } from "./document-processor/document-processor.module";
import { WorkflowModule } from "./workflow/workflow.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    MongooseModule.forRoot(
      process.env.MONGO_URI ||
        "mongodb+srv://mrs-admin:3ioWTBd6P098mCqj@cluster0.grizk.mongodb.net/business-analyst-wsd?retryWrites=true&w=majority&appName=Cluster0"
    ),
    JwtModule.register({
      secret: "#51sa%!^ui*",
      signOptions: { expiresIn: "2h" },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 900000, // 15 minutes
        limit: 100, // 100 requests per window
      },
    ]),
    DatabaseModule,
    DocumentProcessorModule,
    WorkflowModule,
  ],
  controllers: [
    HealthController,
    AuthController,
    DocumentsController,
    TasksController,
    WorkflowsController,
    BpmnController,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
