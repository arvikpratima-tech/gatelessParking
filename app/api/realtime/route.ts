import { connectToDB } from "@/lib/db"
import { DetectionModel } from "@/schemas/detection"
import { ThreatModel } from "@/schemas/threat"
import { NextRequest } from "next/server"
import mongoose from "mongoose"

// Server-Sent Events endpoint for real-time updates
// Uses polling fallback for MongoDB without replica set
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const lastDetectionId = searchParams.get('lastDetectionId') || ''
    const lastThreatId = searchParams.get('lastThreatId') || ''
    const pollInterval = parseInt(searchParams.get('interval') || '2000') // 2 seconds default

    // Set up SSE headers
    const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
    })

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()
            let lastDetId = lastDetectionId
            let lastThrId = lastThreatId
            
            // Send initial connection message
            const send = (data: any) => {
                const message = `data: ${JSON.stringify(data)}\n\n`
                controller.enqueue(encoder.encode(message))
            }

            send({ type: 'connected', message: 'Real-time stream connected', mode: 'polling' })

            // Connect to database
            try {
                await connectToDB()
            } catch (error) {
                send({ type: 'error', message: 'Database connection failed' })
                controller.close()
                return
            }

            // Polling-based approach (works without replica set)
            const pollIntervalId = setInterval(async () => {
                try {
                    // Check for new detections
                    const detectionQuery: any = {}
                    if (lastDetId && mongoose.Types.ObjectId.isValid(lastDetId)) {
                        detectionQuery._id = { $gt: new mongoose.Types.ObjectId(lastDetId) }
                    }
                    
                    const newDetections = await DetectionModel.find(detectionQuery)
                        .sort({ _id: 1 })
                        .limit(10)
                        .lean()

                    for (const detection of newDetections) {
                        send({
                            type: 'detection',
                            data: {
                                id: detection._id.toString(),
                                plate: detection.plate,
                                timestamp: detection.timestamp,
                                address: detection.address,
                                hasBooking: detection.hasBooking,
                                isViolation: detection.isViolation,
                            }
                        })
                        lastDetId = detection._id.toString()
                    }

                    // Check for new threats
                    const threatQuery: any = {}
                    if (lastThrId && mongoose.Types.ObjectId.isValid(lastThrId)) {
                        threatQuery._id = { $gt: new mongoose.Types.ObjectId(lastThrId) }
                    }
                    
                    const newThreats = await ThreatModel.find(threatQuery)
                        .sort({ _id: 1 })
                        .limit(10)
                        .lean()

                    for (const threat of newThreats) {
                        send({
                            type: 'threat',
                            data: {
                                id: threat._id.toString(),
                                plate: threat.plate,
                                timestamp: threat.timestamp,
                                address: threat.address,
                                threats: threat.threats,
                                alertText: threat.alertText,
                            }
                        })
                        lastThrId = threat._id.toString()
                    }
                } catch (error) {
                    console.error('Polling error:', error)
                    send({ type: 'error', message: 'Polling failed', error: String(error) })
                }
            }, pollInterval)

            // Send heartbeat every 30 seconds
            const heartbeatInterval = setInterval(() => {
                send({ type: 'heartbeat', timestamp: new Date().toISOString() })
            }, 30000)

            // Handle client disconnect
            req.signal.addEventListener('abort', () => {
                clearInterval(pollIntervalId)
                clearInterval(heartbeatInterval)
                controller.close()
            })

            // Cleanup on close
            const originalClose = controller.close.bind(controller)
            controller.close = () => {
                clearInterval(pollIntervalId)
                clearInterval(heartbeatInterval)
                return originalClose()
            }
        }
    })

    return new Response(stream, { headers })
}

