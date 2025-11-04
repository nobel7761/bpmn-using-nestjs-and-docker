import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Req,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import { WorkflowService } from "../workflow/workflow.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("documents")
export class DocumentsController {
  private readonly uploadDir = "uploads";

  constructor(private readonly workflowService: WorkflowService) {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  @Post("upload")
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "uploads",
        filename: (req, file, cb) => {
          const documentId = `DOC-${uuidv4().substring(0, 8).toUpperCase()}`;
          const extension = extname(file.originalname);
          (req as any).documentId = documentId;
          cb(null, `${documentId}${extension}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = [".pdf", ".docx"];
        const extension = extname(file.originalname).toLowerCase();

        if (allowedTypes.includes(extension)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              "Invalid file type. Only PDF and DOCX files are allowed"
            ),
            false
          );
        }
      },
      limits: {
        fileSize: 16 * 1024 * 1024, // 16MB
      },
    })
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ) {
    try {
      if (!file) {
        throw new BadRequestException("No file uploaded");
      }

      // Get documentId from request (set by multer storage)
      const documentId =
        req.documentId || file.filename.replace(/\.[^/.]+$/, "");
      const filePath = file.path;
      const originalName = file.originalname;

      console.log("Upload request for documentId:", documentId);
      console.log("File path:", filePath);
      console.log("Original file name:", originalName);

      // Start workflow
      const result = await this.workflowService.startWorkflow(
        documentId,
        filePath,
        originalName
      );

      return result;
    } catch (error) {
      console.error("Upload error:", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(`Upload failed: ${error.message}`);
    }
  }

  @Get(":documentId")
  async getDocumentStatus(@Param("documentId") documentId: string) {
    try {
      const result = await this.workflowService.getDocumentStatus(documentId);

      if (result) {
        return result;
      } else {
        throw new NotFoundException("Document not found");
      }
    } catch (error) {
      console.error("Get document error:", error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve document: ${error.message}`
      );
    }
  }
}
