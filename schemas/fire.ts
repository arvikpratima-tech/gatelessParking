import { Document, Schema, model, models } from "mongoose";

export interface Fire extends Document {
    detectionId?: string; // Link to Detection if plate was detected
    timestamp: Date;
    address: string;
    zoneName?: string;
    plate?: string;
    vehicleColor?: string;
    vehicleType?: string;
    fires: Array<{
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

const FireSchema = new Schema<Fire>({
    detectionId: { type: Schema.Types.ObjectId, ref: 'Detection', default: null },
    timestamp: { type: Date, required: true, index: true, default: Date.now },
    address: { type: String, required: true },
    zoneName: String,
    plate: { type: String, index: true },
    vehicleColor: String,
    vehicleType: String,
    fires: [{
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
FireSchema.index({ timestamp: -1 })
FireSchema.index({ acknowledged: 1, timestamp: -1 })
FireSchema.index({ plate: 1, timestamp: -1 })

export const FireModel = models.Fire || model('Fire', FireSchema)



