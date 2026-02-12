"use client"
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { getToken } from "@/app/lib/authCookie";
import toast from "react-hot-toast";
export const user_service = "http://localhost:6001";
export const chat_service ="http://localhost:6005";


export interface User{
    _id:string;
    name:string;
    email:string;
}

export interface Chat{
    _id:string;
    users:string[];
    latestMessage:{
        text:string;
        sender:string;
    };
    createdAt:string;
    updatedAt:string;
    unseenCount?:number;
}

export interface Chats{
    _id:string;
    user:User;
    chat:Chat
}

interface AppContextType{
    user:User|null;
    loading:boolean;
    isAuth:boolean;
    setUser:React.Dispatch<React.SetStateAction<User|null>>;
    setIsAuth:React.Dispatch<React.SetStateAction<boolean>>;
    logoutUser:()=>Promise<void>;
    fetchChats:()=>Promise<void>;
    fetchUsers:()=>Promise<void>;
    chats:Chats[]|null;
    users:User[]|null;
    setChats:React.Dispatch<React.SetStateAction<Chats[] | null>>
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps{
    children:ReactNode;
}

export const AppProvider:React.FC<AppProviderProps> = ({children})=>{
    const [user , setUser] = useState<User|null>(null);
    const [isAuth , setIsAuth] = useState<boolean>(false);
    const [loading , setLoading] = useState<boolean>(true);

    async function fetchUser() {
        try {
            setLoading(true);

            const token = getToken();
            
            const {data} = await axios.get(`${user_service}/api/v1/me`,{
                headers:{
                    Authorization:`Bearer ${token}`,
                },
            })

            setUser(data);
            setIsAuth(true);
            setLoading(false);
        } catch (error) {
            console.log(error);
            setLoading(false)
        }
    }

    async function logoutUser() {
        Cookies.remove("token")
        setUser(null)
        setIsAuth(false)
        setLoading(false)
        toast.success("User logged out")
    }

    const [chats , setChats]= useState<Chats[] | null>(null);

    async function fetchChats() {
        const token = getToken();
        try {
            const {data} = await axios.get(`${chat_service}/api/v1/chat/all`,{
                headers:{
                    Authorization:`Bearer ${token}`
                }
            })
            
            setChats(data.chats);
            console.log(chats)
        } catch (error) {
            console.log(error)
        }
    }


    const [users,setUsers] = useState<User[]|null>([])

    async function fetchUsers() {
        const token = getToken();
        try {
            const {data} = await axios.get(`${user_service}/api/v1/users/all`,{
                headers:{
                    Authorization:`Bearer ${token}`
                }
            })

            setUsers(data);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(()=>{
        const getuser = async()=>{
            await Promise.all([
                fetchUser(),
                fetchChats(),
                fetchUsers()
            ]);
        }
        getuser();
    },[])

    return <AppContext.Provider value={{user , setUser , isAuth ,setIsAuth , loading , logoutUser , setChats ,chats ,fetchChats, fetchUsers,users }}>
        {children}
    </AppContext.Provider>
}


export const useAppData = ():AppContextType=>{
    const context = useContext(AppContext);
    if(!context){
        throw new Error("useappdata must be used in provider")
    }
    return context;
}