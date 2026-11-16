import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserStatus } from "@prisma/client";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma.service";
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from "./auth.dto";
import { hashToken, newOpaqueToken } from "./token";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}
  private pepper() { return this.config.getOrThrow<string>("PASSWORD_PEPPER"); }
  private futureMinutes(minutes: number) { return new Date(Date.now() + minutes * 60_000); }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException("An account already exists for this email");
    const token = newOpaqueToken();
    const user = await this.prisma.user.create({
      data: {
        email,
        displayName: dto.displayName.trim(),
        passwordHash: await argon2.hash(dto.password + this.pepper(), { type: argon2.argon2id }),
        verificationTokens: { create: { tokenHash: hashToken(token), expiresAt: this.futureMinutes(Number(process.env.EMAIL_TOKEN_TTL_MINUTES ?? 30)) } }
      },
      select: { id: true, email: true, displayName: true }
    });
    return { user, verificationToken: process.env.NODE_ENV === "production" ? undefined : token };
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerification.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!record || record.usedAt || record.expiresAt <= new Date()) throw new BadRequestException("Verification token is invalid or expired");
    await this.prisma.$transaction([
      this.prisma.emailVerification.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      this.prisma.user.update({ where: { id: record.userId }, data: { status: UserStatus.ACTIVE, emailVerifiedAt: new Date() } })
    ]);
    return { verified: true };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    const valid = user ? await argon2.verify(user.passwordHash, dto.password + this.pepper()) : false;
    if (!user || !valid || user.status !== UserStatus.ACTIVE) throw new UnauthorizedException("Invalid credentials or inactive account");
    const token = newOpaqueToken();
    const days = Number(process.env.SESSION_TTL_DAYS ?? 30);
    await this.prisma.session.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + days * 86_400_000) } });
    return { token, expiresAt: new Date(Date.now() + days * 86_400_000), user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role } };
  }

  async requestPasswordReset(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user) return { accepted: true };
    const token = newOpaqueToken();
    await this.prisma.passwordReset.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: this.futureMinutes(Number(process.env.RESET_TOKEN_TTL_MINUTES ?? 20)) } });
    return { accepted: true, resetToken: process.env.NODE_ENV === "production" ? undefined : token };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordReset.findUnique({ where: { tokenHash: hashToken(dto.token) } });
    if (!record || record.usedAt || record.expiresAt <= new Date()) throw new BadRequestException("Reset token is invalid or expired");
    await this.prisma.$transaction([
      this.prisma.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await argon2.hash(dto.password + this.pepper(), { type: argon2.argon2id }), passwordChangedAt: new Date() } }),
      this.prisma.session.deleteMany({ where: { userId: record.userId } })
    ]);
    return { reset: true };
  }

  async logout(token?: string) {
    if (token) await this.prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
    return { loggedOut: true };
  }
}
