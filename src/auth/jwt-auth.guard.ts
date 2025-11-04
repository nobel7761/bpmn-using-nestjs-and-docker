import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token =
      request.query.token || request.headers.authorization?.split(" ")[1];

    if (!token) {
      throw new UnauthorizedException(
        "Unauthorized: No token provided\nGo To Authorization\nSelect 'Bearer' from Auth Type\nThen Select File & Send"
      );
    }

    try {
      const decoded = this.jwtService.verify(token, {
        secret: "#51sa%!^ui*",
      });
      request.user = decoded;
      return true;
    } catch (error) {
      throw new UnauthorizedException("Unauthorized: Invalid token");
    }
  }
}
