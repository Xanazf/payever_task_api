import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { Connection } from 'amqplib';
import * as nodemailer from 'nodemailer';

@Injectable()
export class UsersService {
  private readonly transporter: nodemailer.transporter;
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject('RABBITMQ_CONNECTION')
    private readonly rabbitMqConnection: Connection,
  ) {
    this.transporter = nodemailer.createTransport({
      // Configure your email service provider settings
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async createUser(createUserDto: CreateUserDto) {
    const user = new this.userModel(createUserDto);
    await user.save();
  }

  async getUserFromExternalApi(userId: string) {
    const response = await fetch(`https://reqres.in/api/users/${userId}`);
    const data = await response.json();
    return data.data;
  }

  async getUserAvatar(userId: string) {
    const user = await this.userModel.findOne({ id: userId });
    if (user && user.avatarFile) {
      return user.avatarFile;
    } else {
      const response = await fetch(`https://reqres.in/api/users/${userId}`);
      const data = await response.json();
      const avatarUrl = data.data.avatar;
      const avatarResponse = await fetch(avatarUrl);
      const avatarBuffer = await avatarResponse.arrayBuffer();
      const base64Avatar = Buffer.from(avatarBuffer).toString('base64');
      user.avatarFile = base64Avatar;
      await user.save();
      return base64Avatar;
    }
  }

  async deleteUserAvatar(userId: string) {
    const user = await this.userModel.findOne({ id: userId });
    if (user) {
      user.avatarFile = undefined;
      await user.save();
    }
  }

  async sendDummyEmail() {
    try {
      // const mailOptions: nodemailer.SendMailOptions = {
      //   from: process.env.EMAIL_USER,
      //   to: 'hotdamnsucka@gmail.com',
      //   subject: 'Dummy Email',
      //   text: 'This is a dummy email sent from the NestJS application.',
      // };

      // const info = await this.transporter.sendMail(mailOptions);

      console.log('Dummy email sent:');
    } catch (error) {
      console.error('Error sending dummy email:', error);
      throw error;
    }
  }

  async publishDummyEvent() {
    try {
      const channel = await this.rabbitMqConnection.createChannel();

      const exchangeName = 'dummy-exchange';
      const queueName = 'dummy-queue';
      await channel.assertExchange(exchangeName, 'direct', { durable: true });
      await channel.assertQueue(queueName, { durable: true });
      await channel.bindQueue(queueName, exchangeName, 'dummy-key');

      const eventData = {
        message: 'Dummy event',
        timestamp: new Date().toISOString(),
      };
      await channel.publish(
        exchangeName,
        'dummy-key',
        Buffer.from(JSON.stringify(eventData)),
      );

      console.log('Dummy event published to RabbitMQ');

      await channel.close();
    } catch (error) {
      console.error('Error publishing dummy event:', error);
      throw error;
    }
  }
}
