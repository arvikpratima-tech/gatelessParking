import { synthesizeAlertSpeechBase64 } from '@/lib/security/text-to-speech';
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
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required as a string in the request body' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const result = await synthesizeAlertSpeechBase64(text);

    if (!result) {
      return NextResponse.json(
        {
          error: 'TTS synthesis failed',
          audio: {
            base64: '',
            mimeType: 'audio/wav',
          },
        },
        { status: 500, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json(
      {
        success: true,
        audio: result,
      },
      { headers: getCorsHeaders() }
    );
  } catch (error) {
    console.error('Error in TTS API:', error);
    return NextResponse.json(
      {
        error: 'TTS synthesis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        audio: {
          base64: '',
          mimeType: 'audio/wav',
        },
      },
      { status: 500, headers: getCorsHeaders() }
    );
  }
}


