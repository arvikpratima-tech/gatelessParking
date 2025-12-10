export type DetectedThreat = {
  label: string;      // e.g. "gun", "knife", "weapon"
  score: number;      // confidence 0–1
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type VehicleInfo = {
  zoneName: string;            // e.g. "Gate 3", "VIP Parking A"
  vehicleColor?: string;       // e.g. "black"
  vehicleType?: string;        // e.g. "SUV", "sedan"
  plateNumber?: string;        // optional
};

export type SecurityAlertResponse = {
  hasThreat: boolean;
  threats: DetectedThreat[];
  alertText: string;
  audio: {
    base64: string;      // audio data, base64 encoded
    mimeType: string;    // e.g. "audio/wav" or "audio/mp3"
  };
};

export type ThreatDetectionResponse = {
  threats: DetectedThreat[];
  hasThreat: boolean;
};

export type DetectedFire = {
  label: string;      // e.g. "fire", "flame", "smoke"
  score: number;      // confidence 0–1
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type FireDetectionResponse = {
  fires: DetectedFire[];
  hasFire: boolean;
};

export type FireAlertResponse = {
  hasFire: boolean;
  fires: DetectedFire[];
  alertText: string;
  audio: {
    base64: string;      // audio data, base64 encoded
    mimeType: string;    // e.g. "audio/wav" or "audio/mp3"
  };
};






