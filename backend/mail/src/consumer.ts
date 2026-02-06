import amqp from 'amqplib';
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: process.env.USER,
        pass: process.env.PASSWORD
    }
})

export const startSendOtpConsumer = async () => {
    try {
        const connection = await amqp.connect({
            protocol: "amqp",
            hostname: process.env.Rabbitmq_HostName,
            port: 5672,
            username: process.env.Rabbitmq_Username,
            password: process.env.Rabbitmq_Password
        })

        let channel = await connection.createChannel();

        const queueName = "send-otp"

        await channel.assertQueue(queueName, { durable: true });

        console.log("mail service consumer started for listening for otp emails")

        channel.consume(queueName, async (msg) => {
            if (msg) {

                try {
                    const { to, subject, body } = JSON.parse(msg.content.toString())

                    await transporter.sendMail({
                        from: "Chat App",
                        to,
                        subject,
                        text: body,
                    })


                    console.log(`Otp mail sent to ${to}`);
                    channel.ack(msg)
                } catch (error) {
                    console.log("failed to send otp to rabbitmq consumer", error)
                    channel.nack(msg, false, false);

                }
            }
        })
    } catch (error) {
        console.log("failed to start rabbitmq consumer", error)
        process.exit(1);

    }
}
