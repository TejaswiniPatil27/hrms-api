import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const EMPLOYMENT_STATUS_CODES = [
  'ACTIVE',
  'ON_NOTICE',
  'RESIGNED',
  'RELIEVED',
  'TERMINATED',
] as const;

export type EmploymentStatusCode = (typeof EMPLOYMENT_STATUS_CODES)[number];

export class EmployeeDocumentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  @IsUrl({ require_tld: false })
  fileUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  documentType?: string;
}

export class CreateOrUpdateEmployeeDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  companyId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  departmentId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  designationId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeeCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  personalEmail?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  officialRoleEmail?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phone: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsDateString()
  joiningDate: string;

  @IsOptional()
  @IsDateString()
  exitDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reportingManagerId?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  zipCode: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  profilePhoto?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salary: number;

  @IsOptional()
  @IsIn(EMPLOYMENT_STATUS_CODES)
  status?: EmploymentStatusCode;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmployeeDocumentDto)
  documents?: EmployeeDocumentDto[];
}
