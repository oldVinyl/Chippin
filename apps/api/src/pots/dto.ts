import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  Matches,
  Equals,
} from 'class-validator';
export class ContributionDto {
  @IsInt() @Min(1) @Max(50000000) amountMinor!: number;
  @IsString() @Length(9, 25) phone!: string;
  @IsOptional() @IsString() @Length(0, 80) displayName?: string;
  @IsOptional() @IsString() @Length(0, 240) message?: string;
  @IsBoolean() isAnonymous!: boolean;
  @IsBoolean() consent!: boolean;
  @IsOptional() @IsBoolean() confirmDuplicate?: boolean;
  @IsOptional()
  @IsIn([
    'success',
    'declined',
    'timeout',
    'delayed',
    'duplicate',
    'missing-callback',
  ])
  scenario?: string;
}
export class PotDto {
  @IsString() @Length(3, 100) name!: string;
  @IsString() @Length(10, 5000) story!: string;
  @IsOptional() @IsInt() @Min(100) @Max(100000000) targetMinor?: number;
  @IsOptional() @IsString() deadlineAt?: string;
  @IsIn(['INSTANT', 'SCHEDULED', 'ON_CLOSE']) payoutMode!:
    'INSTANT' | 'SCHEDULED' | 'ON_CLOSE';
  @IsOptional() @IsString() payoutAt?: string;
  @IsString() @Length(9, 25) payoutPhone!: string;
  @IsString() @Length(2, 100) payoutAccountName!: string;
  @IsBoolean() showAmountsPublicly!: boolean;
  @IsBoolean() allowAnonymous!: boolean;
  @IsInt() @Min(100) @Max(500000) minContributionMinor!: number;
  @IsString() @Length(0, 500) thankYouMessage!: string;
  @IsInt() @Min(1) @Max(8) cover!: number;
}
export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @Length(10, 200) password!: string;
}
export class SignupDto extends LoginDto {
  @IsString() @Length(2, 80) name!: string;
  @IsString() @Length(9, 25) phone!: string;
  @IsBoolean() @Equals(true) terms!: boolean;
}
export class OtpDto {
  @IsString() @Matches(/^\d{6}$/) code!: string;
}
export class ReportDto {
  @IsString() @Length(10, 500) reason!: string;
}
export class DataRequestDto {
  @IsEmail() email!: string;
  @IsString() @Length(9, 25) phone!: string;
  @IsIn(['ACCESS', 'CORRECTION', 'DELETION']) kind!: string;
  @IsString() @Length(10, 500) details!: string;
}
export class VerifyDto {
  @IsIn(['VERIFIED', 'SUSPENDED', 'UNVERIFIED']) status!:
    'VERIFIED' | 'SUSPENDED' | 'UNVERIFIED';
}
export class CallbackDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() externalId?: string;
  @IsOptional() @IsString() amount?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() payer?: object;
  @IsOptional() payee?: object;
  @IsOptional() @IsString() financialTransactionId?: string;
  @IsOptional() reason?: object;
}
export class FulfillDataDto {
  @IsBoolean() @Equals(true) identityVerified!: boolean;
  @IsOptional() @IsString() @Length(2, 80) displayName?: string;
}
