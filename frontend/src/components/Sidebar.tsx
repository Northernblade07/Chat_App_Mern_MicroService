"use client"

import React, { Dispatch, SetStateAction, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Chats } from "@/context/AppContext"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { UserCircle, X } from "lucide-react"
import { SocketData } from "@/context/SocketContext"

type SidebarProps = {
  users: User[] | null
  chats: Chats[] | null
  selectedUser: string | null // now stores chatId
  setselectedUser: Dispatch<SetStateAction<string | null>>
  sideBarOpen: boolean
  setSideBarOpen: Dispatch<SetStateAction<boolean>>
  user: User | null
  createChat: (user: User) => Promise<void>
  onlineUsers:string[]
}

const Sidebar = ({
  users,
  chats,
  selectedUser,
  setselectedUser,
  sideBarOpen,
  setSideBarOpen,
  user,
  createChat,
}: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("")
  const {onlineUsers} = SocketData()
  
  console.log("online",onlineUsers)
  // userId -> chat
  const chatMap = useMemo(() => {
    const map = new Map<string, Chats["chat"]>()
    chats?.forEach((c) => {
      map.set(c.user._id, c.chat)
    })
    return map
  }, [chats])

  return (
    <AnimatePresence>
      {sideBarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSideBarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 sm:hidden"
          />

          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="
              fixed sm:static
              z-30
              w-72 sm:w-80
              h-full
              flex flex-col
              flex-shrink-0
              border-r border-zinc-200
              dark:border-zinc-800
              backdrop-blur-xl
              bg-white/70
              dark:bg-zinc-900/70
            "
          >
            <div className="p-4 flex justify-between items-center border-b dark:border-zinc-800">
              <h2 className="font-semibold text-lg">Chats</h2>
              {sideBarOpen && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSideBarOpen(false)}
                >
                  <X size={18} />
                </Button>
              )}
            </div>

            <div className="p-3">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {users
                ?.filter(
                  (u) =>(
                    u._id !== user?._id &&
                    u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map((u) => {
                  const chat = chatMap.get(u._id)
                  const unseen = chat?.unseenCount ?? 0
                  const latestMessage = chat?.latestMessage?.text
                  console.log(u._id )
                  return (
                    <motion.div
                      key={u._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={async () => {

                        if (chat) {
                          // open existing chat
                          setselectedUser(chat._id)
                        } else {
                          // create new chat
                          await createChat(u)
                        }

                        if (window.innerWidth < 640) {
                          setSideBarOpen(false)
                        }
                      }}
                      className={`
                        cursor-pointer px-4 py-3
                        border-b dark:border-zinc-800
                        transition-colors flex gap-2 items-center justify-start rounded-2xl
                        ${
                          selectedUser === chat?._id
                            ? "dark:bg-indigo-500/10 bg-indigo-200"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }
                      `}
                    >
                      <UserCircle className="w-6 h-6 dark:text-gray-300"/>
                      
  {onlineUsers.includes(u._id.toString()) && (
      <span className="w-3 h-3 bg-green-500 rounded-full border border-black"/>
   )}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium dark:text-indigo-300 text-indigo-500">{u.name}</p>

                        <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
                          {u.email}
                        </p>

                        {latestMessage && (
                          <p className="font-semibold text-indigo-400 truncate">
                            {onlineUsers.includes(u._id)?"online":"offline"}
                          </p>
                        )}
                      </div>

                      {unseen > 0 && (
                        <div className="
                          min-w-[20px]
                          h-5
                          px-1
                          rounded-full
                          bg-indigo-500
                          text-white
                          text-xs
                          flex
                          items-center
                          justify-center
                        ">
                          {unseen}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default Sidebar
