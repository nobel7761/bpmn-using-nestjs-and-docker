import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type DocumentDocument = DocumentModel & Document;

@Schema({ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } })
export class DocumentModel {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  file_path: string;

  @Prop({ required: true })
  status: string;

  @Prop({ type: Object, default: null })
  extracted_data: any;

  @Prop({ type: Object, default: null })
  workflow_data: any;

  created_at?: Date;
  updated_at?: Date;
}

export const DocumentSchema = SchemaFactory.createForClass(DocumentModel);
