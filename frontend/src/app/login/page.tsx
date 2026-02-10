"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import axios from "axios"
import { redirect, useRouter } from "next/navigation"
import { MessageCircleCode } from "lucide-react"
import { useState } from "react"
import { ThemeToggle } from "@/components/ThemeToggle"
import toast from "react-hot-toast"
import { useAppData } from "@/context/AppContext"
import Loading from "@/components/Loading"

export default function LoginPage() {

  const {isAuth ,loading:userLoading} = useAppData();
  const router = useRouter()

  const [email, setEmail] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState("")

  const onSubmit = async(e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Email is required")
      return
    }
    try {
      setLoading(true)
      setError("")

      const{data} = await axios.post(
        "http://localhost:6001/api/v1/login",
        { email }
      )
      console.log(data)
      toast.success("enter otp to login")
      router.push(`/verify?email=${email}`)
    } catch (err) {
      console.log(err)
      toast.error("login failed")
    } finally {
      setLoading(false)
    }
  }


if(isAuth){
  redirect("/chat");
}

if(userLoading){
  return <Loading/>
}

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">

      {/* THEME TOGGLE */}
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >

        <Card className="
          text-center
          backdrop-blur-xl
         dark:[bg-gradient-to-br
          from-zinc-900/80
          to-zinc-800/60
          border-zinc-700]
          shadow-2xl
        ">

          <CardHeader>
            <CardTitle className="mt-1 text-2xl flex justify-center items-center gap-3">
              Welcome To Chatify
              <MessageCircleCode />
            </CardTitle>
          </CardHeader>

          <CardHeader>
            <CardTitle className="text-slate-400 text-sm font-normal">
              Please enter your email below to continue your journey
            </CardTitle>
          </CardHeader>

          <CardContent>

            <form
              onSubmit={onSubmit}
              className="flex flex-col gap-4"
            >

              <Input
                className="py-6 px-4"
                placeholder="Enter your email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
              />

              {error && (
                <p className="text-red-400 text-sm">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>

            </form>
          </CardContent>
        </Card>

      </motion.div>
    </div>
  )
}
