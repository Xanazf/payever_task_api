import * as amqp from 'amqplib';

export const rabbitMqProvider = {
  provide: 'RABBITMQ_CONNECTION',
  useFactory: async () => {
    // const connection = await amqp.connect({
    //   url: process.env.RABBITMQ_HOST,
    //   port: parseInt(process.env.RABBITMQ_PORT),
    //   username: process.env.RABBITMQ_USERNAME,
    //   password: process.env.RABBITMQ_PASSWORD,
    // });
    const connection = await amqp.connect(process.env.AMQP_URL);
    return connection;
  },
};
