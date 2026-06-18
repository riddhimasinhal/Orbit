import { useEffect, useState } from "react"
import axios from "axios"
import { Check, X, Send, Clock } from "lucide-react"
import { toast } from "sonner"

const Requests = () => {
    const [tab, setTab] = useState("received")
    const [received, setReceived] = useState([])
    const [sent, setSent] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem("token")
            const receivedRes = await axios.get("http://localhost:5001/api/connections/received", {
                headers: { Authorization: token },
            })
            const sentRes = await axios.get("http://localhost:5001/api/connections/sent", {
                headers: { Authorization: token },
            })
            console.log("Received:", receivedRes.data.requests.length, "Sent:", sentRes.data.requests.length)
            setReceived(receivedRes.data.requests)
            setSent(sentRes.data.requests)
        } catch (error) {
            console.log("Failed to load requests", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleUpdate = async (id, status) => {
        try {
            const token = localStorage.getItem("token")
            await axios.put("http://localhost:5001/api/connections/" + id, { status }, {
                headers: { Authorization: token },
            })
            toast.success("Request " + status)
            console.log("Updated request", id, status)
            // refresh the list
            fetchRequests()
        } catch (error) {
            console.log("Failed to update", error)
            toast.error("Failed to update request")
        }
    }

    if (loading) return <p className="text-zinc-400">Loading requests...</p>

    const pendingCount = received.filter(r => r.status === "pending").length

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-white">Requests</h1>
                <p className="text-sm text-zinc-500 mt-1">Manage your collaboration requests.</p>
            </div>

            {/* tabs */}
            <div className="flex rounded-lg border border-white/10 bg-white/5 p-1 w-fit">
                <button
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${tab === "received" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"}`}
                    onClick={() => setTab("received")}
                >
                    Received {pendingCount > 0 && <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-violet-500 text-[10px] text-white">{pendingCount}</span>}
                </button>
                <button
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${tab === "sent" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"}`}
                    onClick={() => setTab("sent")}
                >
                    Sent
                </button>
            </div>

            {/* received requests */}
            {tab === "received" && (
                <div className="space-y-3">
                    {received.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-zinc-500">No requests received yet.</p>
                        </div>
                    ) : (
                        received.map((req) => (
                            <div key={req._id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-300">
                                            {req.senderName?.slice(0, 2).toUpperCase() || "??"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{req.senderName}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-violet-400">{req.senderRole}</span>
                                                {req.senderLocation && <span className="text-xs text-zinc-500">• {req.senderLocation}</span>}
                                            </div>
                                            {req.senderNiche && req.senderNiche.length > 0 && (
                                                <div className="flex gap-1 mt-1">
                                                    {req.senderNiche.slice(0, 3).map((n) => (
                                                        <span key={n} className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300">{n}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {req.status === "pending" && (
                                            <>
                                                <button onClick={() => handleUpdate(req._id, "accepted")} className="flex items-center gap-1.5 rounded-lg bg-green-600/20 border border-green-500/30 px-3 py-1.5 text-xs text-green-300 hover:bg-green-600/30">
                                                    <Check className="size-3.5" /> Accept
                                                </button>
                                                <button onClick={() => handleUpdate(req._id, "declined")} className="flex items-center gap-1.5 rounded-lg bg-red-600/20 border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-600/30">
                                                    <X className="size-3.5" /> Decline
                                                </button>
                                            </>
                                        )}
                                        {req.status === "accepted" && (
                                            <span className="flex items-center gap-1 text-xs text-green-400">
                                                <Check className="size-3.5" /> Accepted
                                            </span>
                                        )}
                                        {req.status === "declined" && (
                                            <span className="flex items-center gap-1 text-xs text-red-400">
                                                <X className="size-3.5" /> Declined
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {req.message && (
                                    <p className="mt-2 text-xs text-zinc-400 pl-13">"{req.message}"</p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* sent requests */}
            {tab === "sent" && (
                <div className="space-y-3">
                    {sent.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-zinc-500">You haven't sent any requests yet.</p>
                        </div>
                    ) : (
                        sent.map((req) => (
                            <div key={req._id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-300">
                                            {req.receiverName?.slice(0, 2).toUpperCase() || "??"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{req.receiverName}</p>
                                            <span className="text-xs text-violet-400">{req.receiverRole}</span>
                                            {req.receiverLocation && <span className="text-xs text-zinc-500 ml-2">• {req.receiverLocation}</span>}
                                        </div>
                                    </div>

                                    <div>
                                        {req.status === "pending" && (
                                            <span className="flex items-center gap-1 text-xs text-yellow-400">
                                                <Clock className="size-3.5" /> Pending
                                            </span>
                                        )}
                                        {req.status === "accepted" && (
                                            <span className="flex items-center gap-1 text-xs text-green-400">
                                                <Check className="size-3.5" /> Accepted
                                            </span>
                                        )}
                                        {req.status === "declined" && (
                                            <span className="flex items-center gap-1 text-xs text-red-400">
                                                <X className="size-3.5" /> Declined
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export default Requests
