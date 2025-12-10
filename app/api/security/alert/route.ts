import { processSecurityAlert } from '@/lib/security/orchestrator';
import { VehicleInfo } from '@/lib/security/types';
import { NextResponse } from 'next/server';

// CORS headers
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders()
  });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    let imageUrl = formData.get('imageUrl') as string | null;
    let imageBase64 = formData.get('imageBase64') as string | null;
    
    // Vehicle info from form data or JSON body
    const vehicleInfoJson = formData.get('vehicleInfo') as string | null;
    
    let vehicleInfo: VehicleInfo;
    
    if (vehicleInfoJson) {
      try {
        vehicleInfo = JSON.parse(vehicleInfoJson);
      } catch {
        return NextResponse.json(
          { error: 'Invalid vehicleInfo JSON' },
          { status: 400, headers: getCorsHeaders() }
        );
      }
    } else {
      // Try to get from JSON body
      try {
        const body = await req.json();
        vehicleInfo = body.vehicleInfo || {
          zoneName: body.zoneName || 'Unknown Zone',
          vehicleColor: body.vehicleColor,
          vehicleType: body.vehicleType,
          plateNumber: body.plateNumber,
        };
        
        // Re-extract image data from JSON if present
        if (body.imageBase64 && !imageBase64) {
          imageBase64 = body.imageBase64;
        }
        if (body.imageUrl && !imageUrl) {
          imageUrl = body.imageUrl;
        }
      } catch {
        return NextResponse.json(
          { error: 'vehicleInfo is required with zoneName' },
          { status: 400, headers: getCorsHeaders() }
        );
      }
    }

    if (!vehicleInfo.zoneName) {
      return NextResponse.json(
        { error: 'zoneName is required in vehicleInfo' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    let imageData: string | Buffer;
    let imageFormat: 'base64' | 'bytes' | 'url' = 'base64';

    // Handle different image input formats
    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      imageData = Buffer.from(arrayBuffer);
      imageFormat = 'bytes';
    } else if (imageUrl) {
      imageData = imageUrl;
      imageFormat = 'url';
    } else if (imageBase64) {
      imageData = imageBase64;
      imageFormat = 'base64';
    } else {
      return NextResponse.json(
        { error: 'No image provided. Send image, imageUrl, or imageBase64.' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const result = await processSecurityAlert(imageData, imageFormat, vehicleInfo);

    return NextResponse.json(result, { headers: getCorsHeaders() });
  } catch (error) {
    console.error('Error in security alert API:', error);
    return NextResponse.json(
      {
        error: 'Security alert processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        hasThreat: false,
        threats: [],
        alertText: '',
        audio: {
          base64: '',
          mimeType: 'audio/wav',
        },
      },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}


