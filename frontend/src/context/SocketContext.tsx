    "use client"

    import { createContext, ReactNode, useContext, useEffect, useState } from "react";
    import { io, Socket } from "socket.io-client"
    import { chat_service, useAppData } from "./AppContext";

    interface SocketContextType{
        socket: Socket|null;
        onlineUsers:string[]
    }

    const SocketContext = createContext<SocketContextType>({
        socket:null,
        onlineUsers:[]
    });

    interface ProviderProps{
        children:ReactNode;
    }

    export const SocketProvider = ({children}:ProviderProps)=>{

        const[socket , setSocket] = useState<Socket|null>(null);
        const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
        const {user} = useAppData();

      useEffect(()=>{

    if(!user?._id) return;

    const newSocket = io(chat_service,{
        query:{ userId:user._id }
    });

    // ✅ attach FIRST
    newSocket.on("connect", () => {
        console.log("socket connected");
    });

    newSocket.on("getOnlineUser",(users:string[])=>{
        console.log("ONLINE USERS RECEIVED:", users);
        setOnlineUsers(users);
    });
    socketSetting();
    async function socketSetting() {
        setSocket(newSocket);
    }
    return()=>{
        newSocket.disconnect();
    }

},[user?._id]);


useEffect(() => {
    console.log(onlineUsers,"online");
}, [onlineUsers]);

if(!user?._id){
    return<>{children}</>; // wait until user exists
}


        return <SocketContext.Provider value={{socket,onlineUsers}}>
            {children}
        </SocketContext.Provider>
    };

    export const SocketData=()=>useContext(SocketContext)