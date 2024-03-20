import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './user.schema';
import { AppModule } from 'src/app.module';
import { rabbitMqProvider } from 'src/rabbitmq.provider';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    forwardRef(() => AppModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, rabbitMqProvider],
  exports: [UsersService],
})
export class UsersModule {}
