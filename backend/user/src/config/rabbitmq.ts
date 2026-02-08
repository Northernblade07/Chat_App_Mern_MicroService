import amqp from 'amqplib'

let channel : amqp.Channel;

export const connectRabbitMq = async()=>{
    try {
        const connection = await amqp.connect({
            protocol:"amqp",
            hostname:process.env.Rabbitmq_HostName,
            port:5672,
            username:process.env.Rabbitmq_Username,
            password:process.env.Rabbitmq_Password
        });

        connection.on("close", () => {
            console.error("RabbitMQ connection closed!");
        });

        connection.on("error", (err) => {
            console.error("RabbitMQ error", err);
        });


        channel = await connection.createChannel();
        console.log("connected to rabbitmq");
    } catch (error) {
        console.log("failed to connect rabbitmq" , error);
            process.exit(1);

    }
}


export const publishToQueue = async(queueName:string , message:any)=>{
if(!channel){
   throw new Error("RabbitMQ channel not initialized");
}
console.log("publish to queue" , channel)
await channel.assertQueue(queueName , {
    durable:true
})

channel.sendToQueue(queueName , Buffer.from(JSON.stringify(message)) , {
    persistent:true,
})
}