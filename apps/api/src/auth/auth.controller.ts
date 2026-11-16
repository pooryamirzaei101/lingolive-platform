import { Body, Controller, HttpCode, Post, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, TokenDto } from "./auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  private cookieName() { return process.env.SESSION_COOKIE_NAME ?? "lingolive_session"; }

  @Post("register") register(@Body() dto: RegisterDto) { return this.auth.register(dto); }
  @Post("verify-email") verifyEmail(@Body() dto: TokenDto) { return this.auth.verifyEmail(dto.token); }
  @Post("forgot-password") @HttpCode(202) forgot(@Body() dto: ForgotPasswordDto) { return this.auth.requestPasswordReset(dto); }
  @Post("reset-password") reset(@Body() dto: ResetPasswordDto) { return this.auth.resetPassword(dto); }

  @Post("login") @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(dto);
    response.cookie(this.cookieName(), result.token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: result.expiresAt });
    return { user: result.user };
  }

  @Post("logout") @HttpCode(200)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.logout(request.cookies?.[this.cookieName()]);
    response.clearCookie(this.cookieName(), { path: "/" });
    return result;
  }
}
