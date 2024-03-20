import { forwardRef, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { rabbitMqProvider } from './rabbitmq.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URL),
    forwardRef(() => UsersModule),
  ],
  controllers: [AppController],
  providers: [AppService, rabbitMqProvider],
  exports: [rabbitMqProvider],
})
export class AppModule {}
