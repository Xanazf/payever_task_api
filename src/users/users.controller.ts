import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/api/users')
  async createUser(@Body() createUserDto: CreateUserDto) {
    await this.usersService.createUser(createUserDto);
    await this.usersService.sendDummyEmail();
    await this.usersService.publishDummyEvent();
    return { message: 'User created successfully' };
  }

  @Get('/api/user/:userId')
  async getUserById(@Param('userId') userId: string) {
    const user = await this.usersService.getUserFromExternalApi(userId);
    return user;
  }

  @Get('/api/user/:userId/avatar')
  async getUserAvatar(@Param('userId') userId: string) {
    const avatar = await this.usersService.getUserAvatar(userId);
    return { avatar };
  }

  @Delete('/api/user/:userId/avatar')
  async deleteUserAvatar(@Param('userId') userId: string) {
    await this.usersService.deleteUserAvatar(userId);
    return { message: 'User avatar deleted successfully' };
  }
}
