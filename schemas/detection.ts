import { Document, Schema, model, models } from "mongoose";

export interface Detection extends Document {
    plate: string;
    timestamp: Date;
    address: string;
    zoneName?: string;
    vehicleColor?: string;
    vehicleType?: string;
    hasBooking: boolean;
    bookingId?: string;
    isViolation: boolean;
    cameraId?: string;
    locationId?: string;
    imageBase64?: string; // Optional - can be large, consider storing URL instead
    duration?: {
        minutes: number;
        hours: number;
        isWithinBooking: boolean;
        isOverstayed: boolean;
    };
}

const DetectionSchema = new Schema<Detection>({
    plate: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, index: true, default: Date.now },
    address: { type: String, required: true },
    zoneName: String,
    vehicleColor: String,
    vehicleType: String,
    hasBooking: { type: Boolean, required: true, default: false },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', default: null },
    isViolation: { type: Boolean, required: true, default: false },
    cameraId: String,
    locationId: { type: Schema.Types.ObjectId, ref: 'ParkingLocation', default: null },
    imageBase64: String, // Consider storing as URL or in separate storage
    duration: {
        minutes: Number,
        hours: Number,
        isWithinBooking: Boolean,
        isOverstayed: Boolean
    }
}, {
    timestamps: true
})

// Compound index for efficient queries
DetectionSchema.index({ plate: 1, timestamp: -1 })
DetectionSchema.index({ timestamp: -1 })
DetectionSchema.index({ isViolation: 1, timestamp: -1 })

export const DetectionModel = models.Detection || model('Detection', DetectionSchema)



