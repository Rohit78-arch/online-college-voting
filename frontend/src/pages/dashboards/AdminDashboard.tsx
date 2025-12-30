import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import type { Election } from "@/types/election"

// Local types for admin analytics & pending items
type AnalyticsSeriesItem = { candidateUserId: string; name?: string; votes: number; percentage: number }
type AnalyticsPosition = { positionId: string; title: string; totalVotes: number; series: AnalyticsSeriesItem[] }
type AdminAnalytics = { summary: { totalVotesCast: number; totalEligibleVoters: number; turnoutPct: number }; election: { status: string }; chart: AnalyticsPosition[] }

type PendingVoter = { _id: string; fullName: string; enrollmentId?: string; department?: string }

type PendingCandidate = { _id: string; user: { _id: string; fullName: string }; position?: { title?: string }; election?: { name?: string } }
import { motion } from "framer-motion"
import { Check, X, Plus, Play, Square, FileBarChart, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  listPendingVoters,
  listPendingCandidates,
  setUserApproval,
  listAllElectionsAdmin,
  createElection,
  startElection,
  stopElection,
  addPosition,
  publishResults,
  getAdminAnalytics,
  exportResultsPdf,
  exportResultsExcel
} from "@/lib/apiEndpoints"

export default function AdminDashboard() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage elections, approve users, and view results.</p>
        </div>
      </div>

      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="elections">Elections</TabsTrigger>
          <TabsTrigger value="results">Results & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          <ApprovalsTab />
        </TabsContent>

        <TabsContent value="elections" className="space-y-4">
          <ElectionsTab />
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <ResultsTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

function ResultsTab() {
  const [elections, setElections] = useState<Election[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listAllElectionsAdmin().then((data: Election[]) => {
      setElections(data)
      const ended = data.find((e) => e.status === "ENDED" || e.status === "RUNNING")
      if (ended) setSelectedId(ended._id)
    }).catch(() => toast.error("Failed to load elections"))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    let mounted = true
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await getAdminAnalytics(selectedId)
        if (mounted) setAnalytics(data)
      } catch (error) {
        console.error(error)
        toast.error("Failed to load analytics")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetch()
    return () => {
      mounted = false
    }
  }, [selectedId])

  const downloadPdf = async () => {
    try {
      const blob = await exportResultsPdf(selectedId)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `results-${selectedId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      toast.error("Download failed")
    }
  }

  const downloadExcel = async () => {
    try {
      const blob = await exportResultsExcel(selectedId)
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `results-${selectedId}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch {
      toast.error("Download failed")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select election" />
          </SelectTrigger>
          <SelectContent>
            {elections.map((e) => (
              <SelectItem key={e._id} value={e._id}>
                {e.name} ({e.status})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={downloadPdf} disabled={!analytics}>
            <FileBarChart className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" onClick={downloadExcel} disabled={!analytics}>
            <FileBarChart className="mr-2 h-4 w-4" /> Excel
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin" />
        </div>
      ) : analytics ? (
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.summary.totalVotesCast}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.chart.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge>{analytics.election.status}</Badge>
              </CardContent>
            </Card>
          </div>

          {analytics.chart.map((pos: AnalyticsPosition) => (
            <Card key={pos.positionId}>
              <CardHeader>
                <CardTitle>{pos.title}</CardTitle>
                <CardDescription>Total Votes: {pos.totalVotes}</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pos.series}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="votes" fill="#8884d8">
                      {pos.series.map((item: AnalyticsSeriesItem, index: number) => (
                        <Cell key={`cell-${item.candidateUserId ?? index}`} fill={index % 2 === 0 ? "#8884d8" : "#82ca9d"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground p-8">Select an election to view analytics</div>
      )}
    </div>
  )
}

function ApprovalsTab() {
  const [voters, setVoters] = useState<PendingVoter[]>([])
  const [candidates, setCandidates] = useState<PendingCandidate[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [v, c] = await Promise.all([listPendingVoters(), listPendingCandidates()])
      setVoters(v)
      setCandidates(c)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load approvals")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleApproval = async (userId: string, status: "APPROVED" | "REJECTED") => {
    try {
      await setUserApproval(userId, status)
      toast.success(`User ${status.toLowerCase()}!`)
      fetchData() // Refresh
    } catch (error) {
      console.error(error)
      toast.error("Action failed")
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Pending Voters ({voters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {voters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending voters.</p>
          ) : (
            <div className="space-y-4">
              {voters.map((user) => (
                <div key={user._id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user.enrollmentId} • {user.department}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => handleApproval(user._id, "APPROVED")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleApproval(user._id, "REJECTED")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Candidates ({candidates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending candidates.</p>
          ) : (
            <div className="space-y-4">
              {candidates.map((item) => (
                <div key={item._id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{item.user.fullName}</p>
                    <p className="text-xs text-muted-foreground">Running for: {item.position?.title} in {item.election?.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => handleApproval(item.user._id, "APPROVED")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleApproval(item.user._id, "REJECTED")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ElectionsTab() {
  const [elections, setElections] = useState<Election[]>([])
  const [loading, setLoading] = useState(true)
  const [openCreate, setOpenCreate] = useState(false)

  const fetchElections = async () => {
    setLoading(true)
    try {
      const data = await listAllElectionsAdmin()
      setElections(data)
    } catch (error) {
      console.error(error)
      toast.error("Failed to load elections")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchElections()
  }, [])

  const handleStart = async (id: string) => {
    try {
      await startElection(id)
      toast.success("Election started!")
      fetchElections()
    } catch (error) {
      console.error(error)
      toast.error("Failed to start election")
    }
  }

  const handleStop = async (id: string) => {
    try {
      await stopElection(id)
      toast.success("Election stopped!")
      fetchElections()
    } catch (error) {
      console.error(error)
      toast.error("Failed to stop election")
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await publishResults(id)
      toast.success("Results published!")
      fetchElections()
    } catch (error) {
      console.error(error)
      toast.error("Failed to publish results")
    }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Create Election</Button>
          </DialogTrigger>
          <CreateElectionDialog onSuccess={() => { setOpenCreate(false); fetchElections(); }} />
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Elections</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Positions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {elections.map((e) => (
                <TableRow key={e._id}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell>
                    <Badge variant={e.status === "RUNNING" ? "default" : e.status === "ENDED" ? "secondary" : "outline"}>
                      {e.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{e.positions?.length || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {e.status === "DRAFT" && (
                        <Button size="sm" onClick={() => handleStart(e._id)}>
                          <Play className="mr-2 h-3 w-3" /> Start
                        </Button>
                      )}
                      {e.status === "RUNNING" && (
                        <Button size="sm" variant="destructive" onClick={() => handleStop(e._id)}>
                          <Square className="mr-2 h-3 w-3" /> Stop
                        </Button>
                      )}
                      {e.status === "ENDED" && !e.resultsPublished && (
                        <Button size="sm" variant="outline" onClick={() => handlePublish(e._id)}>
                          <FileBarChart className="mr-2 h-3 w-3" /> Publish
                        </Button>
                      )}
                      <AddPositionDialog electionId={e._id} onSuccess={fetchElections} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function CreateElectionDialog({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [autoClose, setAutoClose] = useState(false)
  const [endsAt, setEndsAt] = useState("")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await createElection({
        name,
        description: desc,
        autoCloseEnabled: autoClose,
        endsAt: autoClose && endsAt ? new Date(endsAt).toISOString() : undefined
      })
      toast.success("Election created!")
      onSuccess()
    } catch (error) {
      // Extract message safely
      let msg = "Failed to create"
      if (typeof error === 'object' && error !== null && 'response' in error) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        msg = (error as any)?.response?.data?.message || msg
      }
      console.error(error)
      toast.error(msg)
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create New Election</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Election Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoClose"
            className="h-4 w-4 rounded border-gray-300"
            aria-label="Enable auto-close timer"
            checked={autoClose}
            onChange={(e) => setAutoClose(e.target.checked)}
          />
          <Label htmlFor="autoClose">Enable Auto-Close Timer</Label>
        </div>

        {autoClose && (
          <div className="space-y-2">
            <Label>End Date & Time</Label>
            <Input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              required={autoClose}
            />
          </div>
        )}

        <DialogFooter>
          <Button type="submit">Create</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}

function AddPositionDialog({ electionId, onSuccess }: { electionId: string, onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [seats, setSeats] = useState(1)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await addPosition(electionId, { title, seats })
      toast.success("Position added!")
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error(error)
      toast.error("Failed to add position")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">Add Position</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Position</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Position Title (e.g. President)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Seats</Label>
            <Input type="number" min={1} value={seats} onChange={(e) => setSeats(Number(e.target.value))} required />
          </div>
          <DialogFooter>
            <Button type="submit">Add</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
