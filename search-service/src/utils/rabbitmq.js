const amqp = require('amqplib');
const logger = require('./logger');


let connection = null;
let channel = null;

const EXCHANGE_NAME = 'post_exchange';

const connectRabbitMQ = async () => {
    try {
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
        logger.info('RabbitMQ connected');
        return channel;
    } catch (error) {
        logger.error('Error connecting to RabbitMQ: %o', error);
        throw error;
    }
}

const consumeEvent = async (routingKey, callback) => {
    if (!channel) {
        channel = await connectRabbitMQ();
    }

    const q = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
    channel.consume(q.queue, (msg) => {
        if (msg !== null) {
            const message = JSON.parse(msg.content.toString());
            callback(message);
            channel.ack(msg); // Acknowledge the message
        }
    }, { noAck: false });

    logger.info('Subscribed to RabbitMQ with routing key: %s', routingKey);
}

module.exports = {
    connectRabbitMQ,
    consumeEvent
}