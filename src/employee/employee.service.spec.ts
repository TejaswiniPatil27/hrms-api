import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { EmployeeService } from './employee.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EmployeeService', () => {
  let service: EmployeeService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: PrismaService,
          useValue: {
            employee: {
              create: jest.fn(),
              update: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    prisma = module.get(PrismaService) as any;
  });

  it('should create an employee when no id is provided', async () => {
    prisma.employee.findUnique.mockResolvedValue(null);

    const payload = {
      userId: 1,
      companyId: 1,
      departmentId: 1,
      designationId: 1,
      employeeCode: 'EMP-1001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      joiningDate: '2024-01-01',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10001',
      salary: 50000,
      status: 'ON_NOTICE',
      reportingManagerId: 2,
      personalEmail: 'john.personal@example.com',
      officialRoleEmail: 'john.doe@company.example',
      exitDate: '2026-12-31',
      profilePhoto: 'https://files.example.com/photos/john.jpg',
      remarks: 'Transitioning to a new role.',
      documents: [
        {
          fileName: 'identity.pdf',
          fileUrl: 'https://files.example.com/documents/identity.pdf',
          documentType: 'IDENTITY',
        },
      ],
    };

    const createdEmployee = { id: 1, ...payload };
    prisma.employee.create.mockResolvedValue(createdEmployee as any);

    await expect(service.createOrUpdateEmployee(payload as any)).resolves.toEqual(createdEmployee);
    expect(prisma.employee.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        employeeCode: 'EMP-1001',
        firstName: 'John',
        user: { connect: { id: 1 } },
        employmentStatus: { connect: { code: 'ON_NOTICE' } },
        reportingManager: { connect: { id: 2 } },
        documents: {
          create: [
            {
              fileName: 'identity.pdf',
              fileUrl: 'https://files.example.com/documents/identity.pdf',
              documentType: 'IDENTITY',
            },
          ],
        },
      }),
    });
  });

  it('should update an existing employee when a matching record already exists', async () => {
    const existingEmployee = {
      id: 9,
      userId: 1,
      employeeCode: 'EMP-1001',
      email: 'john@example.com',
      employmentStatus: { code: 'ACTIVE' },
    };
    prisma.employee.findUnique.mockResolvedValue(existingEmployee as any);
    prisma.employee.update.mockResolvedValue({ ...existingEmployee, firstName: 'John' } as any);

    const payload = {
      userId: 1,
      companyId: 1,
      departmentId: 1,
      designationId: 1,
      employeeCode: 'EMP-1001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      joiningDate: '2024-01-01',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10001',
      salary: 50000,
      documents: [
        {
          fileName: 'tax.pdf',
          fileUrl: 'https://files.example.com/documents/tax.pdf',
        },
      ],
    };

    await expect(service.createOrUpdateEmployee(payload as any)).resolves.toEqual({
      ...existingEmployee,
      firstName: 'John',
    });
    expect(prisma.employee.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: expect.objectContaining({
        employeeCode: 'EMP-1001',
        user: { connect: { id: 1 } },
        employmentStatus: { connect: { code: 'ACTIVE' } },
        documents: {
          deleteMany: {},
          create: [
            {
              fileName: 'tax.pdf',
              fileUrl: 'https://files.example.com/documents/tax.pdf',
              documentType: null,
            },
          ],
        },
      }),
    });
  });

  it('should reject invalid employee payloads before hitting the database', async () => {
    await expect(
      service.createOrUpdateEmployee({
        firstName: 'John',
        email: 'john@example.com',
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw a conflict on duplicate unique keys', async () => {
    prisma.employee.findUnique.mockResolvedValue(null);
    prisma.employee.create.mockRejectedValue({ code: 'P2002' });

    const payload = {
      userId: 1,
      companyId: 1,
      departmentId: 1,
      designationId: 1,
      employeeCode: 'EMP-1001',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      joiningDate: '2024-01-01',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10001',
      salary: 50000,
    };

    await expect(service.createOrUpdateEmployee(payload as any)).rejects.toThrow(ConflictException);
  });

  it('should throw a not found exception when updating an unknown employee id', async () => {
    prisma.employee.findUnique.mockResolvedValue(null);

    await expect(
      service.createOrUpdateEmployee({
        id: 999,
        userId: 1,
        companyId: 1,
        departmentId: 1,
        designationId: 1,
        employeeCode: 'EMP-999',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        joiningDate: '2024-01-01',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001',
        salary: 50000,
      } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('should reject an employee who reports to themselves', async () => {
    await expect(
      service.createOrUpdateEmployee({
        id: 9,
        reportingManagerId: 9,
      } as any),
    ).rejects.toThrow(BadRequestException);
  });
});
