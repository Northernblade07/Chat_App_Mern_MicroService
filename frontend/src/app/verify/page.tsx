"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import axios from "axios"
import { redirect, useRouter, useSearchParams } from "next/navigation"
import { MessageCircleCode } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { ThemeToggle } from "@/components/ThemeToggle"
import toast from "react-hot-toast"
import Cookies from "js-cookie"
import { useAppData } from "@/context/AppContext"
import Loading from "@/components/Loading"
export default function VerifyPage() {

  const {isAuth , user ,setIsAuth , setUser , loading:userLoading , fetchChats , fetchUsers} = useAppData();

  const router = useRouter()
  const params = useSearchParams()
  const email = params.get("email")

  const [otp, setOtp] = useState(["","","","","",""])
  const [loading, setLoading] = useState(false)
  const [timer , setTimer] = useState(60);
  const [resendLoading ,setResendLoading] = useState(false)

  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  // ✅ Handle typing
  const handleChange = (value:string, index:number) => {

    if(!/^[0-9]?$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // move forward automatically
    if(value && index < 5){
      inputsRef.current[index+1]?.focus()
    }
  }

  // ✅ Handle backspace
  const handleKeyDown = (e:React.KeyboardEvent<HTMLElement>, index:number):void=> {

    if(e.key === "Backspace" && !otp[index] && index > 0){
      inputsRef.current[index-1]?.focus()
    }
  }

  // ✅ Handle paste
  const handlePaste = (e:React.ClipboardEvent) => {

    const pasted = e.clipboardData.getData("text").trim()

    if(!/^\d{6}$/.test(pasted)) return

    const digits = pasted.split("")
    setOtp(digits)

    digits.forEach((digit, i)=>{
      if(inputsRef.current[i]){
        inputsRef.current[i]!.value = digit
      }
    })

    inputsRef.current[5]?.focus()
  }

  const verifyOtp = async() => {
    const finalOtp = otp.join("")

    if(finalOtp.length !== 6){
      toast.error("Enter full OTP")
      return
    }

    try{

      setLoading(true)

        const {data} =  await axios.post(
        "http://localhost:6001/api/v1/verify",
        {
          email,
          otp: finalOtp
        }
      )

      console.log(data)
      Cookies.set("token",data.token,{
        expires:15,
        secure:true,
        path:"/"
    // might have to false secure because of aws deployement , no issue for render deployment
      })
      toast.success("Login successful")
      setOtp(["","","","","",""]);
      setUser(data.user)
      setIsAuth(true)
     await Promise.all([
  fetchUsers(),
  fetchChats()
])
 router.replace("/chat")
      
    }catch(err){
        console.log(err)
      toast.error(
       "Invalid OTP"
      )

    }finally{
      setLoading(false)
    }
  }


  const handleResend = async () => {

    if(timer > 0) return;

  if(!email) return;

  try {

    setResendLoading(true)

    const toastId = toast.loading("Sending new OTP...")

    await axios.post(
      "http://localhost:6001/api/v1/login",
      { email }
    )

    toast.success("New OTP sent 🚀", { id: toastId })

    // reset timer
    setTimer(60)

    // reset OTP
    setOtp(["","","","","",""])

    // focus first input
    inputsRef.current[0]?.focus()

  } catch (err) {
    console.log(err)
    toast.error(
      "Failed to resend OTP"
    )

  } finally {
    setResendLoading(false)
  }
}
useEffect(() => {
  if (timer === 0) return

  const interval = setInterval(() => {
    setTimer((prev) => prev - 1)
  }, 1000)

  return () => clearInterval(interval)
}, [timer])

if(isAuth){
  router.replace("/chat");
}

if(userLoading){
  return <Loading/>
}

  return (
    <div className="
      relative flex min-h-screen items-center justify-center px-4
      bg-gradient-to-br
      from-indigo-50
      via-white
      to-cyan-50
      dark:from-black
      dark:via-zinc-950
      dark:to-indigo-950
    ">

      <div className="fixed right-6 top-6 z-50">
        <ThemeToggle/>
      </div>

      <motion.div
        initial={{opacity:0, y:40}}
        animate={{opacity:1, y:0}}
        transition={{duration:.35}}
        className="w-full max-w-md"
      >

        <Card className="
          text-center
          backdrop-blur-xl
          border
          shadow-2xl

          bg-white/70
          border-zinc-200

          dark:bg-gradient-to-br
          dark:from-zinc-900/80
          dark:to-zinc-800/60
          dark:border-zinc-700
        ">

          <CardHeader>
            <CardTitle className="text-2xl flex justify-center gap-3 items-center">
              Verify OTP
              <MessageCircleCode/>
            </CardTitle>
          </CardHeader>

          <CardHeader>
            <CardTitle className="text-zinc-600 dark:text-zinc-400 text-sm font-normal">
              Enter the 6 digit code sent to  
              <span className="font-semibold ml-1">
                {email}
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">

            {/* OTP INPUTS */}
            <div
              onPaste={handlePaste}
              className="flex justify-between gap-2"
            >
              {otp.map((digit, index)=>(
                <motion.input
                  key={index}
                  ref={(el)=>{inputsRef.current[index] = el}}
                  maxLength={1}
                  onChange={(e)=>handleChange(e.target.value, index)}
                  onKeyDown={(e)=>handleKeyDown(e, index)}
                  className="
                    w-12 h-14 text-center text-xl font-semibold
                    rounded-lg border
                    bg-white/80
                    dark:bg-zinc-900/60
                    border-zinc-300
                    dark:border-zinc-700
                    outline-none
                    focus:ring-2
                    focus:ring-indigo-500
                  "
                  initial={{scale:.8, opacity:0}}
                  animate={{scale:1, opacity:1}}
                  transition={{delay:index*.05}}
                />
              ))}
            </div>

            <Button
              onClick={verifyOtp}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>

              <div className="flex flex-col items-center gap-2 mt-2">

  <p className="text-sm text-zinc-600 dark:text-zinc-400">
    Didn’t receive the code?
  </p>

  {timer > 0 ? (

    <motion.p
      key={timer}
      initial={{opacity:.5}}
      animate={{opacity:1}}
      className="text-sm font-medium text-indigo-500"
    >
      Resend available in {timer}s
    </motion.p>

  ) : (

    <Button
      variant="ghost"
      disabled={resendLoading}
      onClick={handleResend}
      className="
        text-indigo-600
        hover:text-indigo-700
        dark:text-indigo-400
        dark:hover:text-indigo-300
        font-semibold
      "
    >
      {resendLoading ? "Sending..." : "Resend OTP"}
    </Button>

  )}

</div>

          </CardContent>

        </Card>

        
      </motion.div>
    </div>
  )
}
