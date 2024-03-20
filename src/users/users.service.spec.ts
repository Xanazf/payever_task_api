import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

describe('UsersService', () => {
  let usersService: UsersService;
  let userModel: Model<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken('User'),
          useValue: {
            findOne: jest.fn().mockReturnThis(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    userModel = module.get<Model<User>>(getModelToken('User'));
  });

  it('should create a user', async () => {
    const createUserDto = {
      name: 'John Doe',
      email: 'john@example.com',
      id: 99,
      avatar: 'https://reqres.in/img/faces/1-image.jpg',
      avatarFile: 'base64-avatar',
    };
    const mockUser = {
      ...createUserDto,
      save: jest.fn(),
    };
    (userModel.findOne as jest.Mock).mockReturnValueOnce(mockUser);
    await usersService.createUser(createUserDto);
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('should get user avatar', async () => {
    const userId = '1';
    const avatarUrl = 'https://reqres.in/img/faces/1-image.jpg';
    const mockUser = {
      id: userId,
      avatar: avatarUrl,
      avatarFile: 'base64-avatar',
    };
    (userModel.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
    const avatar = await usersService.getUserAvatar(userId);
    expect(avatar).toBe('base64-avatar');
  });

  it('should get user from external API', async () => {
    const userId = '1';
    const mockUser = {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
    };
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({ data: mockUser }),
    } as unknown as Response);
    const user = await usersService.getUserFromExternalApi(userId);
    expect(user).toEqual(mockUser);
    expect(global.fetch).toHaveBeenCalledWith(
      `https://reqres.in/api/users/${userId}`,
    );
  });

  it('should delete user avatar', async () => {
    const userId = '1';
    const mockUser = {
      id: userId,
      avatarFile: 'base64-avatar',
      save: jest.fn(),
    };
    (userModel.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
    await usersService.deleteUserAvatar(userId);
    expect(mockUser.avatarFile).toBeUndefined();
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('should send dummy email', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    await usersService.sendDummyEmail();
    expect(consoleLogSpy).toHaveBeenCalledWith('Dummy email sent:');
    consoleLogSpy.mockRestore();
  });
});
