import { Test, TestingModule } from '@nestjs/testing';
// import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
// import { Channel } from 'diagnostics_channel';
import { Model } from 'mongoose';
import { Connection } from 'amqplib';
import { User } from './user.schema';
import { getModelToken } from '@nestjs/mongoose';

describe('UsersController', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let userModel: Model<User>;
  let rabbitMqConnection: Connection;
  // let channel: Channel;

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
        {
          provide: 'RABBITMQ_CONNECTION',
          useValue: {
            createChannel: jest.fn().mockResolvedValue({
              assertExchange: jest.fn(),
              assertQueue: jest.fn(),
              bindQueue: jest.fn(),
              publish: jest.fn(),
              close: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    userModel = module.get<Model<User>>(getModelToken('User'));
    rabbitMqConnection = module.get<Connection>('RABBITMQ_CONNECTION');
    // channel = await rabbitMqConnection.createChannel();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a user', async () => {
    const createUserDto = { name: 'John Doe', email: 'john@example.com' };
    await request(app.getHttpServer())
      .post('/api/users')
      .send(createUserDto)
      .expect(201)
      .expect({ message: 'User created successfully' });
    expect(usersService.createUser).toHaveBeenCalledWith(createUserDto);
  });

  it('should get user by ID', async () => {
    const userId = '1';
    const mockUser = {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
    };
    (usersService.getUserFromExternalApi as jest.Mock).mockResolvedValueOnce(
      mockUser,
    );
    const response = await request(app.getHttpServer())
      .get(`/api/user/${userId}`)
      .expect(200);
    expect(response.body).toEqual(mockUser);
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

  it('should publish dummy event', async () => {
    const mockChannel = {
      assertExchange: jest.fn(),
      assertQueue: jest.fn(),
      bindQueue: jest.fn(),
      publish: jest.fn(),
      close: jest.fn(),
    };
    jest
      .spyOn(rabbitMqConnection, 'createChannel')
      .mockResolvedValueOnce(mockChannel);

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    await usersService.publishDummyEvent();
    expect(mockChannel.assertExchange).toHaveBeenCalledWith(
      'dummy-exchange',
      'direct',
      { durable: true },
    );
    expect(mockChannel.assertQueue).toHaveBeenCalledWith('dummy-queue', {
      durable: true,
    });
    expect(mockChannel.bindQueue).toHaveBeenCalledWith(
      'dummy-queue',
      'dummy-exchange',
      'dummy-key',
    );
    expect(mockChannel.publish).toHaveBeenCalledWith(
      'dummy-exchange',
      'dummy-key',
      expect.any(Buffer),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Dummy event published to RabbitMQ',
    );
    expect(mockChannel.close).toHaveBeenCalled();
    consoleLogSpy.mockRestore();
  });
});
