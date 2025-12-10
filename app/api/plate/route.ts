import { sendViolationEmail, sendOverstayEmail, sendFireAlertEmail } from "@/actions/actions"
import { connectToDB } from "@/lib/db"
import { processSecurityAlert } from "@/lib/security/orchestrator"
import { detectFire } from "@/lib/security/fire-detection"
import { BookingModel } from "@/schemas/booking"
import { DetectionModel } from "@/schemas/detection"
import { ParkingLocationModel } from "@/schemas/parking-locations"
import { ThreatModel } from "@/schemas/threat"
import { FireModel } from "@/schemas/fire"
import { BookingStatus } from "@/types"
import { format } from "date-fns"
import { NextResponse } from "next/server"
import { z } from "zod"

// Input validation schema
const PlateDetectionSchema = z.object({
    plate: z.string().min(1).max(20),
    address: z.string().min(1),
    timestamp: z.union([z.string(), z.number(), z.date()]).optional(),
    imageBase64: z.string().optional(),
    zoneName: z.string().optional(),
    vehicleColor: z.string().optional(),
    vehicleType: z.string().optional(),
    cameraId: z.string().optional(),
    locationId: z.string().optional(),
})

// CORS headers - more secure for production
function getCorsHeaders() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*']
    const origin = allowedOrigins.includes('*') ? '*' : allowedOrigins[0]
    
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    }
}

// Handle CORS preflight requests
export async function OPTIONS(req: Request) {
    return new NextResponse(null, {
        status: 200,
        headers: getCorsHeaders()
    })
}

export async function POST(req: Request) {
    try {
        // Connect to database first with retry logic
        await connectToDB()

        const body = await req.json()
        const authHeader = req.headers.get('authorization')

        // Validate authentication
        if (!authHeader) {
            return NextResponse.json(
                { message: "Not allowed", error: "Missing authorization header" },
                { status: 401, headers: getCorsHeaders() }
            )
        }

        // Handle both "Token", "Bearer", or plain token formats
        const parts = authHeader.trim().split(/\s+/)
        const token = parts.length > 1 ? parts[parts.length - 1] : parts[0] // Get last part (handles "Token key" or "Bearer key")
        
        if (token !== process.env.APP_KEY) {
            return NextResponse.json(
                { message: "Wrong credentials", error: "Invalid API key" },
                { status: 401, headers: getCorsHeaders() }
            )
        }

        // Validate input
        const validationResult = PlateDetectionSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json(
                { 
                    message: "Invalid input", 
                    error: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
                },
                { status: 400, headers: getCorsHeaders() }
            )
        }

        const { plate, address, timestamp, imageBase64, zoneName, vehicleColor, vehicleType, cameraId, locationId } = validationResult.data

        // Normalize plate (lowercase, no spaces)
        const normalizedPlate = plate.toLowerCase().replace(/\s+/g, '')
        
        // Parse timestamp with timezone awareness
        const detectionTimestamp = timestamp 
            ? new Date(timestamp)
            : new Date()

        // Debug: Log if image is provided
        console.log('[PLATE API] Received request:', {
            plate: normalizedPlate,
            address,
            hasImage: !!imageBase64,
            imageLength: imageBase64?.length || 0,
            zoneName,
            cameraId
        })

        // Optional: Run security threat detection if image is provided
        let securityAlert = null
        let threatRecord = null
        
        // Optional: Run fire detection if image is provided
        let fireAlert = null
        let fireRecord = null
        
        if (imageBase64 && address) {
            try {
                // Run threat detection
                securityAlert = await processSecurityAlert(
                    imageBase64,
                    'base64',
                    {
                        zoneName: zoneName || address,
                        vehicleColor: vehicleColor,
                        vehicleType: vehicleType,
                        plateNumber: normalizedPlate,
                    }
                )
                
                // Store threat in database if detected
                if (securityAlert.hasThreat && securityAlert.threats.length > 0) {
                    try {
                        threatRecord = await ThreatModel.create({
                            timestamp: detectionTimestamp,
                            address,
                            zoneName: zoneName || address,
                            plate: normalizedPlate,
                            vehicleColor,
                            vehicleType,
                            threats: securityAlert.threats.map(t => ({
                                label: t.label,
                                confidence: t.score,
                            })),
                            alertText: securityAlert.alertText,
                            hasAudio: !!securityAlert.audio?.base64,
                            cameraId,
                            locationId: locationId || undefined,
                            imageBase64: imageBase64.substring(0, 1000), // Store truncated version (full image can be large)
                        })
                        console.log('🚨 SECURITY ALERT stored in DB:', threatRecord._id)
                    } catch (threatError) {
                        console.error('Failed to store threat record (non-fatal):', threatError)
                    }
                }

                // Run fire detection
                try {
                    console.log('[PLATE API] Running fire detection...');
                    console.log('[PLATE API] Image base64 length:', imageBase64?.length || 0);
                    fireAlert = await detectFire(imageBase64, 'base64')
                    console.log('[PLATE API] Fire detection result:', fireAlert.hasFire, 'fires:', fireAlert.fires.length);
                    
                    // Store fire in database if detected
                    if (fireAlert.hasFire && fireAlert.fires.length > 0) {
                        try {
                            const alertText = `Fire detected at ${zoneName || address}. ${fireAlert.fires.length} fire instance(s) detected.`
                            
                            fireRecord = await FireModel.create({
                                timestamp: detectionTimestamp,
                                address,
                                zoneName: zoneName || address,
                                plate: normalizedPlate,
                                vehicleColor,
                                vehicleType,
                                fires: fireAlert.fires.map(f => ({
                                    label: f.label,
                                    confidence: f.score,
                                    bbox: f.box
                                })),
                                alertText: alertText,
                                hasAudio: false,
                                cameraId,
                                locationId: locationId || undefined,
                                imageBase64: imageBase64.substring(0, 1000), // Store truncated version
                            })
                            console.log('🔥 FIRE ALERT stored in DB:', fireRecord._id)

                            // Send fire alert email
                            try {
                                await sendFireAlertEmail(
                                    address,
                                    fireAlert.fires.map(f => ({ label: f.label, score: f.score })),
                                    format(detectionTimestamp, 'MMM dd, yyyy hh:mm a'),
                                    zoneName || address,
                                    normalizedPlate,
                                    vehicleColor,
                                    vehicleType,
                                    cameraId,
                                    locationId
                                )
                                console.log(`🔥 Fire alert email sent for ${normalizedPlate || 'unknown vehicle'} at ${address}`)
                            } catch (emailError) {
                                console.error('Failed to send fire alert email (non-fatal):', emailError)
                            }
                        } catch (fireError) {
                            console.error('Failed to store fire record (non-fatal):', fireError)
                        }
                    }
                } catch (fireError) {
                    // Don't fail the plate detection if fire check fails
                    console.error('Fire detection check failed (non-fatal):', fireError)
                }
            } catch (securityError) {
                // Don't fail the plate detection if security check fails
                console.error('Security check failed (non-fatal):', securityError)
            }
        }

        // Look up booking with normalized plate
        const booking = await BookingModel.findOne({
            plate: normalizedPlate,
            status: BookingStatus.BOOKED
        }).populate('locationid')

        // Calculate duration if booking exists
        let duration = null
        let overstayInfo = null
        if (booking) {
            const now = new Date()
            const startTime = new Date(booking.starttime)
            const endTime = new Date(booking.endtime)
            
            // Account for timezone offset stored in booking
            const timezoneOffset = booking.timeoffset || 0
            const adjustedNow = new Date(now.getTime() - (timezoneOffset * 60 * 1000))
            
            const durationMinutes = Math.max(0, Math.floor((adjustedNow.getTime() - startTime.getTime()) / (1000 * 60)))
            const remainingMinutes = Math.max(0, Math.floor((endTime.getTime() - adjustedNow.getTime()) / (1000 * 60)))
            
            const isWithinBooking = adjustedNow >= startTime && adjustedNow <= endTime
            const isOverstayed = adjustedNow > endTime
            
            duration = {
                minutes: durationMinutes,
                hours: Math.floor(durationMinutes / 60),
                minutesRemainder: durationMinutes % 60,
                remainingMinutes: remainingMinutes,
                remainingHours: Math.floor(remainingMinutes / 60),
                remainingMinutesRemainder: remainingMinutes % 60,
                isWithinBooking,
                isOverstayed
            }

            // Calculate overstay details if vehicle has overstayed
            if (isOverstayed) {
                const overstayTotalMinutes = Math.floor((adjustedNow.getTime() - endTime.getTime()) / (1000 * 60))
                const overstayHours = Math.floor(overstayTotalMinutes / 60)
                const overstayMinutes = overstayTotalMinutes % 60

                // Get parking location to calculate additional charge
                // Handle both populated and non-populated locationid
                let parkingLocation = null
                if (booking.locationid) {
                    if (typeof booking.locationid === 'object' && 'price' in booking.locationid) {
                        // Already populated
                        parkingLocation = booking.locationid
                    } else {
                        // Need to fetch
                        parkingLocation = await ParkingLocationModel.findById(booking.locationid).lean()
                    }
                }
                
                const hourlyRate = parkingLocation?.price?.hourly || 0
                // Calculate charge: round up to nearest hour (e.g., 2h 15min = 3 hours)
                const chargeableHours = overstayMinutes > 0 ? overstayHours + 1 : overstayHours
                const additionalCharge = chargeableHours * hourlyRate

                overstayInfo = {
                    overstayHours,
                    overstayMinutes,
                    overstayTotalMinutes,
                    additionalCharge,
                    hourlyRate,
                    chargeableHours
                }

                // Send overstay email notification
                try {
                    const locationAddress = parkingLocation?.address || address

                    await sendOverstayEmail(
                        normalizedPlate,
                        locationAddress,
                        overstayHours,
                        overstayMinutes,
                        additionalCharge,
                        format(endTime, 'MMM dd, yyyy hh:mm a'),
                        format(adjustedNow, 'MMM dd, yyyy hh:mm a'),
                        booking._id.toString()
                    )
                    console.log(`📧 Overstay email sent for plate ${normalizedPlate}: ${overstayHours}h ${overstayMinutes}m overstay, ₹${additionalCharge.toFixed(2)} charge`)
                } catch (emailError) {
                    console.error('Failed to send overstay email (non-fatal):', emailError)
                }
            }
        }

        const hasBooking = !!booking
        const isViolation = !booking

        // Store detection in database (non-blocking)
        try {
            await DetectionModel.create({
                plate: normalizedPlate,
                timestamp: detectionTimestamp,
                address,
                zoneName: zoneName || address,
                vehicleColor,
                vehicleType,
                hasBooking,
                bookingId: booking?._id,
                isViolation,
                cameraId,
                locationId: locationId || undefined,
                duration: duration ? {
                    minutes: duration.minutes,
                    hours: duration.hours,
                    isWithinBooking: duration.isWithinBooking,
                    isOverstayed: duration.isOverstayed
                } : undefined,
            })
        } catch (detectionError) {
            // Log but don't fail the request
            console.error('Failed to store detection record (non-fatal):', detectionError)
        }

        // Send violation email if no booking
        if (isViolation) {
            try {
                await sendViolationEmail(normalizedPlate, address, detectionTimestamp.toISOString())
            } catch (emailError) {
                console.error('Failed to send violation email (non-fatal):', emailError)
            }
            
            return NextResponse.json({
                message: "violation",
                hasBooking: false,
                plate: normalizedPlate,
                timestamp: detectionTimestamp.toISOString(),
                ...(securityAlert && { securityAlert }),
                ...(threatRecord && { threatId: threatRecord._id.toString() }),
                ...(fireAlert && { fireAlert }),
                ...(fireRecord && { fireId: fireRecord._id.toString() })
            }, { headers: getCorsHeaders() })
        } else {
            return NextResponse.json({
                message: "ok",
                hasBooking: true,
                plate: normalizedPlate,
                timestamp: detectionTimestamp.toISOString(),
                booking: {
                    id: booking._id.toString(),
                    plate: booking.plate,
                    starttime: booking.starttime,
                    endtime: booking.endtime,
                    bookingdate: booking.bookingdate,
                    amount: booking.amount,
                    status: booking.status
                },
                duration,
                ...(overstayInfo && { overstay: overstayInfo }),
                ...(securityAlert && { securityAlert }),
                ...(threatRecord && { threatId: threatRecord._id.toString() }),
                ...(fireAlert && { fireAlert }),
                ...(fireRecord && { fireId: fireRecord._id.toString() })
            }, { headers: getCorsHeaders() })
        }

    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500, headers: getCorsHeaders() })
    }
}
