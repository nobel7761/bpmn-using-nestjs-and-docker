import { Controller, Get } from "@nestjs/common";

@Controller()
export class HealthController {
  @Get("health")
  getHealth() {
    return {
      status: "healthy",
      message: "Document Processing Workflow API",
      timestamp: new Date().toISOString(),
    };
  }
}
