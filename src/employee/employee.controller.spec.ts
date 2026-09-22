import { Test, TestingModule } from '@nestjs/testing';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';

describe('EmployeeController', () => {
  let controller: EmployeeController;
  let service: EmployeeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        {
          provide: EmployeeService,
          useValue: {
            createOrUpdateEmployee: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
    service = module.get<EmployeeService>(EmployeeService);
  });

  it('should delegate create/update employee request to the service', async () => {
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
      status: 'ACTIVE',
    };

    const result = { id: 1, ...payload };
    (service.createOrUpdateEmployee as any).mockResolvedValue(result);

    await expect(controller.createOrUpdateEmployee(payload as any)).resolves.toEqual(result);
    expect(service.createOrUpdateEmployee).toHaveBeenCalledWith(payload);
  });
});
