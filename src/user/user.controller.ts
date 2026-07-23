import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.userService.create(createUserDto);
  }

  @Post('admin/create')
  @HttpCode(HttpStatus.CREATED)
  async createByAdmin(
    @Body() createUserDto: CreateUserDto,
    @GetUser() user: any,
  ) {
    return await this.userService.createByAdmin(createUserDto, user.id);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @GetUser() user?: any,
  ) {
    return this.userService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search,
      user?.id,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.userService.findOneById(id, user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: any,
  ) {
    return this.userService.update(id, updateUserDto, user.id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @GetUser() user: any) {
    return this.userService.delete(id, user.id);
  }
}
