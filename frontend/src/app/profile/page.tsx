"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { User, Mail, Edit3, Save, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData, user_service } from "@/context/AppContext";
import toast from "react-hot-toast";
import axios from "axios";
import { getToken } from "../lib/authCookie";
import Cookies from "js-cookie";
import Loading from "@/components/Loading";
export default function ProfilePage() {
  const router = useRouter();
  const { user ,isAuth,loading,setUser} = useAppData();

  const [editing, setEditing] = useState(false);
  const [name,setName] = useState<string>("");
 useEffect(() => {
  if (user?.name) {
    setName(user.name);
  }
}, [user?.name]);

  const updateName=async(e:React.FormEvent)=>{
    e.preventDefault();
    const token = getToken();
    try {
        const {data} = await axios.patch(`${user_service}/api/v1/update/user`,{
            name:name
        },{
            headers:{
                Authorization:`Bearer ${token}`
            }
        })

        console.log(data)
        Cookies.set("token",data.token,{
            expires: 15,
  secure: true,
  path: "/",
        })
        setName(data.user.name)    
        setUser(data.user)
        toast.success(`name changed to ${name}`)
        setEditing(false)
    } catch (error) {
        console.log(error)
        toast.error("failed to update the name")
    }
  }

useEffect(() => {
  if (!loading && !isAuth) {
    router.replace("/login");
  }
}, [loading, isAuth,router]);

  if(!user) return <Loading/>
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* floating blur orbs */}
      <div className="absolute w-72 h-72 dark:bg-indigo-500/20 bg-indigo-500/50 rounded-full blur-3xl top-20 left-10 animate-pulse" />
      <div className="absolute w-72 h-72 dark:bg-cyan-200/20 bg-cyan-200/50 rounded-full blur-3xl bottom-20 right-10 animate-pulse" />

      {/* top bar */}
      <div className="fixed top-6 left-6">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full backdrop-blur-xl"
          onClick={() => router.push("/chat")}
        >
          <ArrowLeft />
        </Button>
      </div>

      <div className="fixed top-6 right-6">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xl"
      >
        <Card className="
          border
          shadow-2xl
          backdrop-blur-2xl
          bg-white/60
          dark:bg-zinc-900/60
          border-white/20
        ">
          <CardContent className="p-10">
            <div className="flex flex-col items-center gap-6">

              {/* Avatar */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative"
              >
                <Avatar className="w-28 h-28 shadow-xl  ring-4 ring-indigo-400/40">
                  <AvatarFallback className="dark:bg-cyan-800 text-4xl bg-indigo-200 font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="absolute inset-0 rounded-full bg-indigo-500/50 blur-xl -z-10" />
              </motion.div>

              {/* Title */}
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight">
                  Your Profile
                </h1>
                <p className="text-muted-foreground text-sm">
                  Manage your identity in the network
                </p>
              </div>

              {/* Fields */}
              <div className="w-full space-y-5 mt-4">

                {/* Name */}
                <div className="space-y-2">
                  <label className="text-sm flex gap-2 items-center text-muted-foreground">
                    <User size={16} /> Name
                  </label>

                  <Input
                    value={name}
                    disabled={!editing}
                    onChange={(e) => setName(e.target.value)}
                    className="backdrop-blur-lg bg-white/70 dark:bg-zinc-800/60"
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm flex gap-2 items-center text-muted-foreground">
                    <Mail size={16} /> Email
                  </label>

                  <Input
                    value={user?.email}
                    disabled
                    className="backdrop-blur-lg bg-white/70 dark:bg-zinc-800/60 text-white"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 mt-6">
                {!editing ? (
                  <Button
                    onClick={() => setEditing(true)}
                    className="gap-2 shadow-lg"
                  >
                    <Edit3 size={16} /> Edit Name
                  </Button>
                ) : (
                  <Button
                    disabled={name === user?.name}
                    onClick={(e) => {
                        updateName(e)
                    }}
                    className="gap-2 shadow-lg"
                  >
                    <Save size={16} /> Save Name
                  </Button>
                )}
              </div>

            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}