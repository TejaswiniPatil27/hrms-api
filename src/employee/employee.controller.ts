import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { CreateOrUpdateEmployeeDto } from './dto/create-or-update-employee.dto';
import { EmployeeService } from './employee.service';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  createOrUpdateEmployee(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    employeeData: CreateOrUpdateEmployeeDto,
  ) {
    return this.employeeService.createOrUpdateEmployee(employeeData);
  }
}
