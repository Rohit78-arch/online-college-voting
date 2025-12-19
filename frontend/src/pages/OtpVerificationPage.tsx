import { useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { toast } from "sonner"

import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import { sendEmailOtp, sendMobileOtp, verifyEmailOtp, verifyMobileOtp } from "@/lib/apiEndpoints"

type LocationState = {
  email?: string
  mobile?: string
}

type Props = {
  role: "VOTER" | "CANDIDATE"
}

export default function OtpVerificationPage({ role }: Props) {
  const navigate = useNavigate()
  const location = useLocation()

  const state = (location.state || {}) as LocationState

  const [email, setEmail] = useState(state.email || "")
  const [mobile, setMobile] = useState(state.mobile || "")

  const [emailOtp, setEmailOtp] = useState("")
  const [mobileOtp, setMobileOtp] = useState("")

  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingMobile, setLoadingMobile] = useState(false)

  const [emailVerified, setEmailVerified] = useState(false)
  const [mobileVerified, setMobileVerified] = useState(false)

  const nextLoginPath = useMemo(() => (role === "VOTER" ? "/voter/login" : "/candidate/login"), [role])

  async function onVerifyEmail() {
    if (!email) return toast.error("Email required")
    if (!emailOtp) return toast.error("Enter email OTP")

    setLoadingEmail(true)
    try {
      await verifyEmailOtp(email, emailOtp)
      setEmailVerified(true)
      toast.success("Email verified")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Email OTP verification failed")
    } finally {
      setLoadingEmail(false)
    }
  }

  async function onVerifyMobile() {
    if (!mobile) return toast.error("Mobile required")
    if (!mobileOtp) return toast.error("Enter mobile OTP")

    setLoadingMobile(true)
    try {
      await verifyMobileOtp(mobile, mobileOtp)
      setMobileVerified(true)
      toast.success("Mobile verified")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Mobile OTP verification failed")
    } finally {
      setLoadingMobile(false)
    }
  }

  async function onResendEmail() {
    if (!email) return toast.error("Email required")
    setLoadingEmail(true)
    try {
      await sendEmailOtp(email)
      toast.success("Email OTP sent")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send email OTP")
    } finally {
      setLoadingEmail(false)
    }
  }

  async function onResendMobile() {
    if (!mobile) return toast.error("Mobile required")
    setLoadingMobile(true)
    try {
      await sendMobileOtp(mobile)
      toast.success("Mobile OTP sent")
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send mobile OTP")
    } finally {
      setLoadingMobile(false)
    }
  }

  function continueToLogin() {
    if (!emailVerified || !mobileVerified) {
      toast.error("Verify both email and mobile first")
      return
    }
    toast.success("OTP verification complete. Please login.")
    navigate(nextLoginPath, { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">OTP Verification</h1>
              <p className="text-sm text-muted-foreground">Verify Email + Mobile to activate your account</p>
            </div>
            <ModeToggle />
          </div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card>
              <CardHeader>
                <CardTitle>Verify Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Email</p>
                    <span className={emailVerified ? "text-xs text-emerald-600" : "text-xs text-muted-foreground"}>
                      {emailVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@college.edu" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email OTP</Label>
                      <Input value={emailOtp} onChange={(e) => setEmailOtp(e.target.value)} placeholder="123456" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onResendEmail} disabled={loadingEmail}>
                      {loadingEmail ? "Sending…" : "Resend Email OTP"}
                    </Button>
                    <Button type="button" onClick={onVerifyEmail} disabled={loadingEmail || emailVerified}>
                      {emailVerified ? "Email Verified" : "Verify Email"}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Mobile</p>
                    <span className={mobileVerified ? "text-xs text-emerald-600" : "text-xs text-muted-foreground"}>
                      {mobileVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Mobile (E.164)</Label>
                      <Input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+919876543210" />
                    </div>
                    <div className="space-y-2">
                      <Label>Mobile OTP</Label>
                      <Input value={mobileOtp} onChange={(e) => setMobileOtp(e.target.value)} placeholder="123456" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onResendMobile} disabled={loadingMobile}>
                      {loadingMobile ? "Sending…" : "Resend Mobile OTP"}
                    </Button>
                    <Button type="button" onClick={onVerifyMobile} disabled={loadingMobile || mobileVerified}>
                      {mobileVerified ? "Mobile Verified" : "Verify Mobile"}
                    </Button>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <Button className="w-full" onClick={continueToLogin}>
                    Continue to Login
                  </Button>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Link to="/" className="hover:underline">
                      Back to role selection
                    </Link>
                    <span>After OTP, wait for Admin approval</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
