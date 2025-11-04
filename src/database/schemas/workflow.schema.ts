import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type WorkflowDocument = WorkflowModel & Document;

@Schema({ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } })
export class WorkflowModel {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  document_id: string;

  @Prop({ required: true })
  current_step: string;

  @Prop({ required: true })
  status: string;

  @Prop({ type: Object, default: {} })
  variables: any;

  @Prop({ default: null })
  error_message: string;

  created_at?: Date;
  updated_at?: Date;
}

export const WorkflowSchema = SchemaFactory.createForClass(WorkflowModel);
