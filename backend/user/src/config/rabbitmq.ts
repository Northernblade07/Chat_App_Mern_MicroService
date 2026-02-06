import ampq from 'amqplib'

let channel : ampq.Channel;

export const connectRabbitMq = async()=>{
    try {
        const connection = await ampq.connect({
            protocol:"amqp",
            hostname:process.env.Rabbitmq_HostName,
            port:5672,
            username:process.env.Rabbitmq_Username,
            password:process.env.Rabbitmq_Password
        });

        channel = await connection.createChannel();
        console.log("connected to rabbitmq");
    } catch (error) {
        console.log("failed to connect rabbitmq" , error);
    }
}


export const publishToQueue = async(queueName:string , message:any)=>{

if(!channel){
    console.log("rabbitmq channel is not initializes");
    return;
}


await channel.assertQueue(queueName , {
    durable:true
})

channel.sendToQueue(queueName , Buffer.from(JSON.stringify(message)) , {
    persistent:true,
})
}