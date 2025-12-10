import { detectFire } from '@/lib/security/fire-detection';
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
    const imageUrl = formData.get('imageUrl') as string | null;
    const imageBase64 = formData.get('imageBase64') as string | null;

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
        { error: 'No image provided. Send image, imageUrl, or imageBase64 in form data.' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const result = await detectFire(imageData, imageFormat);

    return NextResponse.json(result, { headers: getCorsHeaders() });
  } catch (error) {
    console.error('Error in fire detection API:', error);
    return NextResponse.json(
      {
        error: 'Fire detection failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        fires: [],
        hasFire: false,
      },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}



