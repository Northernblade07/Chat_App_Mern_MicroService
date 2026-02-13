  "use client";

  import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useRef,
    useState,
  } from "react";
  import { io, Socket } from "socket.io-client";
  import { chat_service, useAppData } from "./AppContext";

  interface SocketContextType {
    socket: Socket | null;
    onlineUsers: Set<string>;
  }

  const SocketContext = createContext<SocketContextType>({
    socket: null,
    onlineUsers: new Set(),
  });

  export const SocketProvider = ({ children }: { children: ReactNode }) => {
    const { user, loading } = useAppData();


    const socketRef = useRef<Socket | null>(null);

    // ONLY for UI
    const [socket, setSocket] = useState<Socket | null>(null);
   const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());




    useEffect(() => {
      if (!user?._id||loading) return;
  
      // 🔥 ALWAYS destroy old socket when user changes
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      console.log("🚀 Creating NEW socket for:", user._id);

      const socketInstance = io(chat_service, {
        transports: ["websocket"],
        query: { userId: user._id },
      });

      socketRef.current = socketInstance;
      setSocket(socketInstance);

      socketInstance.on("connect", () => {
        console.log("✅ Socket connected:", socketInstance.id);
          socketInstance.emit("requestOnlineUsers");
      });

     socketInstance.on("getOnlineUser", (users: string[]) => {
      console.log("")
setOnlineUsers(prev => new Set(users));
  });

      socketInstance.on("disconnect", () => {
        console.log("🔴 Socket disconnected");
        setOnlineUsers(new Set()); // prevents ghost online users
      });

      return () => {
        console.log("🧹 Cleaning socket");

        socketInstance.disconnect();
        socketRef.current = null;
        setSocket(null);
        setOnlineUsers(new Set());
      };
    }, [user?._id]);

    return (
      <SocketContext.Provider value={{ socket, onlineUsers }}>
        {children}
      </SocketContext.Provider>
    );
  };

  export const SocketData = () => useContext(SocketContext);
