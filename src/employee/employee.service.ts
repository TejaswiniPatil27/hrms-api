import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import {
  CreateOrUpdateEmployeeDto,
  EMPLOYMENT_STATUS_CODES,
  EmploymentStatusCode,
} from './dto/create-or-update-employee.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  private buildEmployeeData(
    employee: CreateOrUpdateEmployeeDto,
    status: EmploymentStatusCode,
    replaceDocuments: boolean,
  ): Prisma.EmployeeCreateInput | Prisma.EmployeeUpdateInput {
    this.ensureRequiredFields(employee);

    const documents = employee.documents?.map((document) => ({
      fileName: document.fileName.trim(),
      fileUrl: document.fileUrl.trim(),
      documentType: document.documentType?.trim() || null,
    }));

    return {
      employeeCode: employee.employeeCode.trim(),
      firstName: employee.firstName.trim(),
      lastName: employee.lastName.trim(),
      email: employee.email.trim().toLowerCase(),
      personalEmail: employee.personalEmail?.trim().toLowerCase() || null,
      officialRoleEmail: employee.officialRoleEmail?.trim().toLowerCase() || null,
      phone: employee.phone.trim(),
      joiningDate: new Date(employee.joiningDate),
      exitDate: employee.exitDate ? new Date(employee.exitDate) : null,
      city: employee.city.trim(),
      state: employee.state.trim(),
      country: employee.country.trim(),
      zipCode: employee.zipCode.trim(),
      salary: employee.salary,
      user: { connect: { id: employee.userId } },
      company: { connect: { id: employee.companyId } },
      department: { connect: { id: employee.departmentId } },
      designation: { connect: { id: employee.designationId } },
      employmentStatus: { connect: { code: status } },
      reportingManager: employee.reportingManagerId
        ? { connect: { id: employee.reportingManagerId } }
        : { disconnect: true },
      dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth) : null,
      address: employee.address?.trim() || null,
      profilePhoto: employee.profilePhoto?.trim() || null,
      remarks: employee.remarks?.trim() || null,
      ...(documents
        ? replaceDocuments
          ? { documents: { deleteMany: {}, create: documents } }
          : { documents: { create: documents } }
        : {}),
    };
  }

  private ensureRequiredFields(employee: CreateOrUpdateEmployeeDto): void {
    const requiredFields = [
      'employeeCode',
      'firstName',
      'lastName',
      'email',
      'phone',
      'joiningDate',
      'city',
      'state',
      'country',
      'zipCode',
    ] as const;

    if (requiredFields.some((field) => !employee[field]?.toString().trim())) {
      throw new BadRequestException('All required employee master fields must be provided.');
    }

    if (!Number.isInteger(employee.userId) || employee.userId <= 0) {
      throw new BadRequestException('userId is required and must be a positive integer.');
    }

    if (!Number.isInteger(employee.companyId) || employee.companyId <= 0) {
      throw new BadRequestException('companyId is required and must be a positive integer.');
    }

    if (!Number.isInteger(employee.departmentId) || employee.departmentId <= 0) {
      throw new BadRequestException('departmentId is required and must be a positive integer.');
    }

    if (!Number.isInteger(employee.designationId) || employee.designationId <= 0) {
      throw new BadRequestException('designationId is required and must be a positive integer.');
    }
  }

  private getStatusCode(status?: string): EmploymentStatusCode {
    const statusCode = status ?? 'ACTIVE';

    if (!this.isEmploymentStatusCode(statusCode)) {
      throw new BadRequestException('A valid employment status is required.');
    }

    return statusCode;
  }

  private isEmploymentStatusCode(status: string): status is EmploymentStatusCode {
    return EMPLOYMENT_STATUS_CODES.some((code) => code === status);
  }

  private async findExistingEmployeeByIdentifiers(employee: CreateOrUpdateEmployeeDto) {
    const employeeByUser = await this.prisma.employee.findUnique({
      where: { userId: employee.userId },
    });

    if (employeeByUser) {
      return employeeByUser;
    }

    const employeeByCode = await this.prisma.employee.findUnique({
      where: { employeeCode: employee.employeeCode.trim() },
    });

    if (employeeByCode) {
      return employeeByCode;
    }

    return this.prisma.employee.findUnique({
      where: { email: employee.email.trim().toLowerCase() },
    });
  }

  async createOrUpdateEmployee(employee: CreateOrUpdateEmployeeDto) {
    this.ensureRequiredFields(employee);

    if (employee.id && employee.reportingManagerId === employee.id) {
      throw new BadRequestException('An employee cannot be their own reporting manager.');
    }

    if (employee.id) {
      const existingEmployee = await this.prisma.employee.findUnique({
        where: { id: employee.id },
        include: { employmentStatus: true },
      });

      if (!existingEmployee) {
        throw new NotFoundException('Employee not found.');
      }

      return this.updateEmployee(
        employee.id,
        this.buildEmployeeData(
          employee,
          this.getStatusCode(employee.status ?? existingEmployee.employmentStatus.code),
          employee.documents !== undefined,
        ),
      );
    }

    const existingEmployee = await this.findExistingEmployeeByIdentifiers(employee);

    if (existingEmployee) {
      return this.updateEmployee(
        existingEmployee.id,
        this.buildEmployeeData(employee, this.getStatusCode(employee.status), employee.documents !== undefined),
      );
    }

    try {
      return await this.prisma.employee.create({
        data: this.buildEmployeeData(employee, this.getStatusCode(employee.status), false) as Prisma.EmployeeCreateInput,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private async updateEmployee(
    employeeId: number,
    data: Prisma.EmployeeCreateInput | Prisma.EmployeeUpdateInput,
  ) {
    try {
      return await this.prisma.employee.update({
        where: { id: employeeId },
        data,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  private handlePrismaError(error: unknown): never {
    if (this.isPrismaError(error)) {
      if (error.code === 'P2002') {
        throw new ConflictException('An employee with the same employee code or email already exists.');
      }

      if (error.code === 'P2025') {
        throw new BadRequestException(
          'The referenced user, company, department, designation, reporting manager, or status does not exist.',
        );
      }
    }

    throw error;
  }

  private isPrismaError(error: unknown): error is { code: string } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string'
    );
  }
}
