import { Controller, Get } from "@nestjs/common";
import { WorkflowService } from "../workflow/workflow.service";
import { InternalServerErrorException } from "@nestjs/common";

@Controller("workflows")
export class WorkflowsController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  async getAllWorkflows() {
    try {
      const workflows = await this.workflowService.getAllWorkflows();
      return {
        workflows: workflows,
        count: workflows.length,
      };
    } catch (error) {
      console.error("Get workflows error:", error);
      throw new InternalServerErrorException(
        `Failed to retrieve workflows: ${error.message}`
      );
    }
  }
}
