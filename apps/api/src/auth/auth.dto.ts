import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  @IsString() @MinLength(2) @MaxLength(100) displayName!: string;
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(12) @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, { message: "password must include upper-case, lower-case, and numeric characters" })
  password!: string;
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MaxLength(128) password!: string;
}

export class TokenDto { @IsString() @MinLength(32) token!: string; }

export class ResetPasswordDto extends TokenDto {
  @IsString() @MinLength(12) @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
  password!: string;
}

export class ForgotPasswordDto { @IsEmail() email!: string; }
