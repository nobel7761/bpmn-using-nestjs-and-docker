import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type TaskDocument = TaskModel & Document;

@Schema({ timestamps: { createdAt: "created_at" } })
export class TaskModel {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  document_id: string;

  @Prop({ required: true })
  task_type: string;

  @Prop({ required: true })
  status: string;

  @Prop({ default: null })
  assigned_to: string;

  @Prop({ type: Object, default: null })
  data: any;

  @Prop({ default: null })
  completed_at: Date;

  created_at?: Date;
}

export const TaskSchema = SchemaFactory.createForClass(TaskModel);
