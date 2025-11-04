import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { IsString, IsIn, IsOptional } from "class-validator";
import { Transform } from "class-transformer";
import { WorkflowService } from "../workflow/workflow.service";

class CompleteTaskDto {
  @Transform(({ value }) => value?.toLowerCase())
  @IsString()
  @IsIn(["approve", "reject"])
  action: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

@Controller("tasks")
export class TasksController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  async getPendingTasks() {
    try {
      const tasks = await this.workflowService.getPendingTasks();
      return {
        tasks: tasks,
        count: tasks.length,
      };
    } catch (error) {
      console.error("Get tasks error:", error);
      throw new InternalServerErrorException(
        `Failed to retrieve tasks: ${error.message}`
      );
    }
  }

  @Post(":taskId/complete")
  async completeTask(
    @Param("taskId") taskId: string,
    @Body() completeTaskDto: CompleteTaskDto
  ) {
    try {
      const { action, reason } = completeTaskDto;

      // Validation is now handled by class-validator decorators
      // The action will be automatically transformed to lowercase and validated

      const result = await this.workflowService.completeTask(
        taskId,
        action,
        reason || ""
      );

      if (result) {
        return result;
      } else {
        throw new NotFoundException("Task not found or already completed");
      }
    } catch (error) {
      console.error("Complete task error:", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to complete task: ${error.message}`
      );
    }
  }
}
