"use client"

import Loading from "@/components/Loading"
import { chat_service, useAppData, User } from "@/context/AppContext"
import { useRouter } from "next/navigation"
import React, { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send, ImagePlus, LogOut, Menu, UserCircle, Delete, UserRoundPenIcon, ChevronDown, ChevronUp } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import Sidebar from "@/components/Sidebar"
import toast from "react-hot-toast"
import { getToken } from "../lib/authCookie"
import axios from "axios"
import Image from "next/image"
import { SocketData } from "@/context/SocketContext"
import Link from "next/link"

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
  const [selectedUser, setselectedUser] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [sideBarOpen, setSideBarOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  
  
  const [messages, setMessages] = useState<Message[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [typing, setTyping] = useState(false)
  const [typingTimeOut, setTypingTimeOut] =
    useState<NodeJS.Timeout | null>(null)
    const isTypingRef = useRef(false);

  const {
    loading,
    isAuth,
    logoutUser,
    chats,
    users,
    user: loggedInUser,
    fetchChats
  } = useAppData()

  const { socket, onlineUsers } = SocketData();
  const router = useRouter()

  useEffect(() => {
    if (window.innerWidth >= 760) {
      async function setSideBar() {
        setSideBarOpen(true)
      }
      setSideBar();
    }
  }, [])

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

      await fetchChats();

    } catch (error) {
      console.log(error)
      toast.error("failed to create new chat")
    }
  }

  async function fetchMessage() {
    const token = getToken();
    try {
      const { data } = await axios.get(`${chat_service}/api/v1/message/${selectedUser}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setMessages(data.messages);
      setUser(data.user)
      // await fetchChats();
    } catch (error) {
      console.log(error)
      toast.error("failed to load message")
    }
  }

  const sendMessage = async (e?: React.FormEvent) => {

    if (e) e.preventDefault()

    if ((!message.trim() && !selectedImage) || !selectedUser || !loggedInUser) return

    // socket work
    if (isTypingRef.current) {
      isTypingRef.current = false;

      socket?.emit("stopTyping", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });
    }

    if (typingTimeOut) {
      clearTimeout(typingTimeOut);
    }



    const token = getToken()

    try {

      const formData = new FormData()

      // must match backend EXACTLY
      formData.append("chatId", selectedUser)

      if (message.trim()) {
        formData.append("text", message)
      }

      if (selectedImage) {
        formData.append("image", selectedImage)
      }

      const { data } = await axios.post(
        `${chat_service}/api/v1/message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // instantly update UI
      // setMessages(prev => [...prev, data.message])

      // clear states
      setMessage("")
      setSelectedImage(null)
      setPreviewUrl(null)
      const input = document.getElementById("imageInput") as HTMLInputElement
      if (input) input.value = ""
      await fetchChats()

    } catch (error) {
      console.log(error)
      toast.error("failed to send message")
    }
  }


  const handleImageSelect = (file: File) => {
    setSelectedImage(file)

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleDelete = async (id: string) => {
    const token = getToken()

    try {
      await axios.delete(`${chat_service}/api/v1/message/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })


      setMessages(prev => prev.filter(m => m._id !== id))

      setOpenMenuId(null)

    } catch (error) {
      console.log(error)
      toast.error("Failed to delete message")
    }
  }

  const handleEditStart = (msg: Message) => {
    setEditingMessage(msg)
    setMessage(msg.text || "")
    setOpenMenuId(null)
  }

  const handleUpdateMessage = async () => {
    if (!editingMessage) return

    const token = getToken()

    try {
      const { data } = await axios.put(
        `${chat_service}/api/v1/message/${editingMessage._id}`,
        { text: message },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      // update locally
      setMessages(prev =>
        prev.map(m =>
          m._id === editingMessage._id ? data.message : m
        )
      )

      setEditingMessage(null)
      setMessage("")

    } catch (error) {
      console.log(error)
      toast.error("Failed to edit message")
    }
  }

  const handleTyping = (value: string) => {
    setMessage(value);

    if (!socket || !selectedUser || !loggedInUser) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;

      socket.emit("typing", {
        chatId: selectedUser,
        userId: loggedInUser._id,
      });
    }

    if (typingTimeOut) {
      clearTimeout(typingTimeOut);
    }

    const timeout = setTimeout(() => {
      isTypingRef.current = false;

      socket.emit("stopTyping", {
        chatId: selectedUser,
        userId: loggedInUser._id,
      });
    }, 2000);

    setTypingTimeOut(timeout);
  };

  useEffect(() => {
    socket?.on("newMessage", (message) => {
      console.log("Recieved new message", message);
setMessages(prev => {
      // Ignore messages from other chats
      if (message.chatId !== selectedUser) return prev;

      // Prevent duplicates
      if (prev.some(m => m._id === message._id)) return prev;

      return [...prev, message];
        })
    })


    socket?.on("messageSeen", (data) => {
      setMessages(prev => prev.map(msg => data.messageIds.includes(msg._id) ? { ...msg, seen: true } : msg));
    });
    socket?.on("userTyping", (data) => {
      console.log("recieved user typing", data);
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) { setTyping(true) }
    })
    socket?.on("userStoppedTyping", (data) => {
      console.log("recieved user stopped typing", data);
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setTyping(false)
      }
    });
    return () => {
      socket?.off("userTyping");
      socket?.off("userStoppedTyping");
      socket?.off("newMessage")
    }
  }, [socket, selectedUser, loggedInUser?._id])
  // handle auto scroll 

  const bottomRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    })
  }, [messages, typing, socket])


  useEffect(() => {
    setTyping(false);
    if (!socket || !selectedUser) return;

    isTypingRef.current = false;
    if (typingTimeOut) clearTimeout(typingTimeOut);

    if (!socket.connected) {
      socket.once("connect", () => {
        socket.emit("joinChat", selectedUser);
      });
    } else {
      socket.emit("joinChat", selectedUser);
    }
    async function getMesssage() {
      fetchMessage();
      setTyping(false);
      // socket?.emit("joinChat",selectedUser);
    }
    getMesssage();
    return () => {
      socket?.emit("leaveChat", selectedUser);
      setMessages([]);
    }
  }, [selectedUser, socket])

  
  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login")
    }
  }, [isAuth, loading,router])

  if (loading) return<Loading />;

  return (
    <div className="h-screen flex bg-white dark:bg-black overflow-hidden">
      {loading && <Loading/>}
      {/* SIDEBAR */}
      {loggedInUser && <Sidebar
        users={users}
        selectedUser={selectedUser}
        setselectedUser={setselectedUser}
        sideBarOpen={sideBarOpen}
        setSideBarOpen={setSideBarOpen}
        user={loggedInUser}
        chats={chats}
        createChat={createChat}
      />
      }

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        {/* HEADER */}
        <div className="sticky top-0 z-20 px-4 sm:px-6 py-3 flex items-center justify-between border-b dark:border-zinc-800 backdrop-blur-xl bg-white/60 dark:bg-zinc-900/60">  
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
                <h2 className="flex gap-2 font-semibold">
                  <UserCircle /> {user.name}
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
         <div className="flex items-center gap-2">

  <ThemeToggle />

  {/* PROFILE BUTTON */}
  <Link href="/profile">
    <Button
      variant="ghost"
      className="
        flex items-center gap-2
        rounded-full
        px-1  
        hover:bg-indigo-500/10
        transition
      "
    >
      <UserCircle size={22} height={25}/>

      <span className="hidden md:block font-medium">
        {loggedInUser?.name}
      </span>
    </Button>
  </Link>

  {/* LOGOUT */}
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
                  className={`flex ${isMe
                    ? "justify-end"
                    : "justify-start"
                    }`}
                >
                  <div
                    onMouseEnter={() => setHoveredMessageId(msg._id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                    className={`relative group
                          px-2 py-2 rounded-xl max-w-[80%] sm:max-w-md flex flex-col items-start flex-wrap
                          ${isMe
                        ? "bg-indigo-500 text-white"
                        : "bg-zinc-200 dark:bg-zinc-800"
                      }
                        `}
                  >
                    {msg.image?.url && (
                      <Image
                        src={msg.image.url}
                        alt="sent"
                        width={200}
                        height={200}
                        className="rounded-lg object-cover"
                      />
                    )}

                    {isMe && hoveredMessageId === msg._id && (
                      <div className="absolute top-0 right-1">
                        <button
                          onClick={() =>
                            setOpenMenuId(prev => prev === msg._id ? null : msg._id)
                          }
                          className="text-sm  hover:opacity-100"
                        >
                          {openMenuId ? <ChevronUp className="mt-0" /> : <ChevronDown />}
                        </button>
                      </div>
                    )}

                    {openMenuId === msg._id && (
                      <div className="absolute right-2 top-6 bg-white dark:bg-zinc-900 shadow-lg rounded-lg text-sm z-50 overflow-hidden">
                        <button
                          onClick={() => handleEditStart(msg)}
                          className="block px-3 py-3 dark:bg-indigo-950 hover:bg-zinc-100 dark:hover:bg-indigo-800 w-full text-left"
                        >
                          <UserRoundPenIcon />

                        </button>

                        <button
                          onClick={() => handleDelete(msg._id)}
                          className="block px-3 py-3 dark:bg-red-900 hover:bg-red-100 dark:hover:bg-red-900 w-full text-left text-white"
                        >
                          <Delete />
                        </button>
                      </div>
                    )}



                    {msg.text && (
                      <p className="text-base break-words whitespace-pre-wrap leading-relaxed">
                        {msg.text}
                      </p>
                    )}


                    {/* Seen indicator */}


                    <div className="flex justify-end items-center gap-1 mt-1 w-full">
                      <span className="text-[11px] opacity-70">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {isMe && (
                        <span className="text-[11px]">
                          {msg.seen ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>


                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {typing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start mb-2"
            >
              <div className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800">
                <motion.div
                  className="flex gap-1 mb-2"
                  initial="start"
                  animate="animate"
                >
                  <motion.span
                    className="w-2 h-2 bg-gray-500 rounded-full"
                    variants={{
                      start: { y: 0 },
                      animate: { y: [0, -5, 0] }
                    }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                  />
                  <motion.span
                    className="w-2 h-2 bg-gray-500 rounded-full"
                    variants={{
                      start: { y: 0 },
                      animate: { y: [0, -5, 0] }
                    }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                  />
                  <motion.span
                    className="w-2 h-2 bg-gray-500 rounded-full"
                    variants={{
                      start: { y: 0 },
                      animate: { y: [0, -5, 0] }
                    }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />

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
            <Button size="icon" variant="ghost" onClick={() => document.getElementById("imageInput")?.click()}>
              <ImagePlus />
              <input
                type="file"
                accept="image/*"
                hidden
                id="imageInput"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageSelect(file)
                }}
              />


            </Button>

            {previewUrl && (
              <div className="px-4 py-2  w-fit absolute bottom-0 left-0 border border-white rounded-2xl ">

                <Image
                  src={previewUrl}
                  width={200}
                  height={200}
                  alt="preview"
                  className="max-w-50 rounded-xl border"
                />

                <button
                  onClick={() => {
                    setSelectedImage(null)
                    setPreviewUrl(null)

                    const input = document.getElementById("imageInput") as HTMLInputElement
                    if (input) input.value = ""
                  }}
                  className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6 text-xs"
                >
                  ✕
                </button>
              </div>
            )}


            <Input
              placeholder="Type a message..."
              value={message}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  editingMessage ? handleUpdateMessage() : sendMessage(e)
                }
              }}
              onChange={(e) => handleTyping(e.target.value)}
            />

            <Button onClick={() => {
              if (editingMessage) {
                handleUpdateMessage()
              } else {
                sendMessage()
              }
            }}>                <Send size={18} />
            </Button>
            {editingMessage && (
              <Button
                variant="ghost"
                onClick={() => {
                  setEditingMessage(null)
                  setMessage("")
                }}
              >
                Cancel
              </Button>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

export default Page
