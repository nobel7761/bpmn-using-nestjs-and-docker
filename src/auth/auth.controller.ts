import { Controller, Get } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Controller()
export class AuthController {
  constructor(private readonly jwtService: JwtService) {}

  @Get("getToken")
  getToken() {
    const token = this.jwtService.sign(
      { user: "admin" },
      {
        secret: "#51sa%!^ui*",
        expiresIn: "2h",
      }
    );
    return { token };
  }
}
