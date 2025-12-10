import { Document, Schema, model, models } from "mongoose";

export interface Threat extends Document {
    detectionId?: string; // Link to Detection if plate was detected
    timestamp: Date;
    address: string;
    zoneName?: string;
    plate?: string;
    vehicleColor?: string;
    vehicleType?: string;
    threats: Array<{
        label: string;
        confidence: number;
        bbox?: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }>;
    alertText: string;
    hasAudio: boolean;
    cameraId?: string;
    locationId?: string;
    imageBase64?: string; // Optional - can be large
    acknowledged: boolean;
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
}

const ThreatSchema = new Schema<Threat>({
    detectionId: { type: Schema.Types.ObjectId, ref: 'Detection', default: null },
    timestamp: { type: Date, required: true, index: true, default: Date.now },
    address: { type: String, required: true },
    zoneName: String,
    plate: { type: String, index: true },
    vehicleColor: String,
    vehicleType: String,
    threats: [{
        label: { type: String, required: true },
        confidence: { type: Number, required: true },
        bbox: {
            x: Number,
            y: Number,
            width: Number,
            height: Number
        }
    }],
    alertText: { type: String, required: true },
    hasAudio: { type: Boolean, default: false },
    cameraId: String,
    locationId: { type: Schema.Types.ObjectId, ref: 'ParkingLocation', default: null },
    imageBase64: String,
    acknowledged: { type: Boolean, default: false, index: true },
    acknowledgedAt: Date,
    acknowledgedBy: String
}, {
    timestamps: true
})

// Indexes for efficient queries
ThreatSchema.index({ timestamp: -1 })
ThreatSchema.index({ acknowledged: 1, timestamp: -1 })
ThreatSchema.index({ plate: 1, timestamp: -1 })

export const ThreatModel = models.Threat || model('Threat', ThreatSchema)



