const express = require("express")
const router = express.Router()
const authMiddleware = require("../middleware/authMiddleware")

const {
    sendRequest,
    getReceivedRequests,
    getSentRequests,
    updateRequest,
    getPendingCount,
    checkConnection,
} = require("../controllers/connectionController")

router.post("/send", authMiddleware, sendRequest)
router.get("/received", authMiddleware, getReceivedRequests)
router.get("/sent", authMiddleware, getSentRequests)
router.get("/count", authMiddleware, getPendingCount)
router.get("/check/:targetId", authMiddleware, checkConnection)
router.put("/:id", authMiddleware, updateRequest)

console.log("Connection Routes Loaded")
module.exports = router
