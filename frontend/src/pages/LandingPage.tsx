import { Link } from "react-router-dom"
import { motion } from "framer-motion"

import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type RoleCardProps = {
  title: string
  description: string
  to: string
}

function RoleCard({ title, description, to }: RoleCardProps) {
  return (
    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[140px] flex-col justify-between gap-4">
          <p className="text-sm text-muted-foreground">{description}</p>
          <Button asChild className="w-full">
            <Link to={to}>Continue</Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <motion.div
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl"
        animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4">
        <header className="flex items-center justify-between py-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Online College Voting System</h1>
            <p className="text-sm text-muted-foreground">Choose your portal to continue</p>
          </div>
          <ModeToggle />
        </header>

        <div className="grid flex-1 place-items-center">
          <div className="w-full max-w-4xl">
            <div className="grid gap-4 md:grid-cols-3">
              <RoleCard title="Voter Portal" description="Login, view active elections, cast a single ballot." to="/voter/login" />
              <RoleCard title="Candidate Portal" description="Apply, manage manifesto, view results after publish." to="/candidate/login" />
              <RoleCard title="Admin Portal" description="Approvals, elections, analytics, exports, publishing." to="/admin/login" />
            </div>

            <Separator className="my-8" />

            <div className="text-center text-xs text-muted-foreground">
              Tip: Accounts must be OTP verified and approved (where applicable) before login.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
