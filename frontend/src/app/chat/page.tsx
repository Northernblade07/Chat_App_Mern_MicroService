"use client"

import Loading from "@/components/Loading"
import { chat_service, useAppData, User } from "@/context/AppContext"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, ImagePlus, LogOut, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import Sidebar from "@/components/Sidebar"
import toast from "react-hot-toast"
import { getToken } from "../lib/authCookie"
import axios from "axios"

export interface Message {
  _id: string
  chatId: string
  sender: string
  text?: string
  image?: {
    url: string
    publicId: string
  }
  messageType: "text" | "image"
  seen: boolean
  createdAt: string
}

const Page = () => {
  const {
    loading,
    isAuth,
    logoutUser,
    chats,
    users,
    user: loggedInUser,
    fetchChats
  } = useAppData()

  const router = useRouter()

  const [selectedUser, setselectedUser] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [sideBarOpen, setSideBarOpen] = useState(false)

useEffect(() => {
  if (window.innerWidth >= 760) {
    async function setSideBar() {
      setSideBarOpen(true)
    }
    setSideBar();
  }
}, [])

  const [messages, setMessages] = useState<Message[] | null>([])
  const [user, setUser] = useState<User | null>(null)
  const [showAllUsers, setShowAllUsers] = useState(false)
  const [typing, setTyping] = useState(false)
  const [typingTimeOut, setTypingTimeOut] =
    useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login")
    }
  }, [isAuth, router, loading])

  // set selected user object
  useEffect(() => {
    if (!selectedUser || !chats) return

  const foundChat = chats.find(
    (c) => c.chat._id === selectedUser
  )
    async function SettingUsers() {
  setUser(foundChat?.user || null)
    }
    SettingUsers();
  }, [selectedUser, chats])

  if (loading) return <Loading />

 async function createChat(u: User): Promise<void> {
  if (!loggedInUser) return

  const token = getToken()

  try {
    const { data } = await axios.post(
      `${chat_service}/api/v1/chat/new`,
      {
        otherUserId: u._id,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    // IMPORTANT: select by chatId
    setselectedUser(data.chatId)

    await fetchChats()

  } catch (error) {
    console.log(error)
    toast.error("failed to create new chat")
  }
}



  return (
    <div className="h-screen flex bg-white dark:bg-black overflow-hidden">

      {/* SIDEBAR */}
      <Sidebar
  users={users}
  selectedUser={selectedUser}
  setselectedUser={setselectedUser}
  sideBarOpen={sideBarOpen}
  setSideBarOpen={setSideBarOpen}
  user={loggedInUser}
  chats={chats}
  createChat={createChat}
/>


      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
       {/* HEADER */}
<div className="
  sticky top-0 z-20
  px-4 sm:px-6 py-3
  flex items-center justify-between
  border-b dark:border-zinc-800
  backdrop-blur-xl
  bg-white/60 dark:bg-zinc-900/60
">

  {/* LEFT */}

  <div className="flex items-center gap-2">


  {!sideBarOpen && <Button
  size="icon"
  variant="ghost"
  className=" z-0 flex-0"
  onClick={() => setSideBarOpen(true)}
>
  <Menu />
</Button>} 
    {user ? (
      <div>
        <h2 className="font-semibold">
          {user.name}
        </h2>

        {typing && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-indigo-500"
          >
            typing...
          </motion.p>
        )}
      </div>
    ) : (
      <p className="text-zinc-500">
        Select a user to start chatting
      </p>
    )}
  </div>

  {/* RIGHT */}
  <div className="flex items-center gap-3">
    <ThemeToggle />

    <Button
      size="icon"
      variant="ghost"
      onClick={logoutUser}
    >
      <LogOut size={18} />
    </Button>
  </div>

</div>

      <div></div>


        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          <AnimatePresence>
            {messages?.map((msg) => {
              const isMe = msg.sender === loggedInUser?._id

              return (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${
                    isMe
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`
                      px-4 py-2 rounded-2xl max-w-[75%] sm:max-w-md
                      ${
                        isMe
                          ? "bg-indigo-500 text-white"
                          : "bg-zinc-200 dark:bg-zinc-800"
                      }
                    `}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* INPUT */}
        {user && (
          <div className="
            sticky bottom-0
  p-3 sm:p-4
  flex items-center gap-2
            border-t dark:border-zinc-800
            backdrop-blur-xl
            bg-white/60 dark:bg-zinc-900/60
          ">
            <Button size="icon" variant="ghost">
              <ImagePlus />
            </Button>

            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)

                // fake typing logic placeholder
                setTyping(true)

                if (typingTimeOut) {
                  clearTimeout(typingTimeOut)
                }

                const timeout = setTimeout(() => {
                  setTyping(false)
                }, 1500)

                setTypingTimeOut(timeout)
              }}
            />

            <Button>
              <Send size={18} />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Page
