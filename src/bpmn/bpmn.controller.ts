import {
  Controller,
  Get,
  InternalServerErrorException,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import * as fs from "fs";
import * as path from "path";

@Controller("bpmn")
export class BpmnController {
  @Get("definition")
  getBpmnDefinition(@Res() res: Response) {
    try {
      const bpmnPath = path.join(
        __dirname,
        "..",
        "..",
        "bpmn",
        "document_processing.bpmn"
      );
      const bpmnContent = fs.readFileSync(bpmnPath, "utf8");

      res.set("Content-Type", "application/xml");
      res.send(bpmnContent);
    } catch (error) {
      console.error("Get BPMN definition error:", error);
      throw new InternalServerErrorException(
        `Failed to retrieve BPMN definition: ${error.message}`
      );
    }
  }
}
