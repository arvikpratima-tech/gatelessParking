This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Environment keys
You must configure these before running the app. Watch the video on my youtube channel on how to get them.

NEXT_PUBLIC_MAPS_API_KEY=<GOOGLE_MAPS>

MONGODB_URI=<MONGODB>

NEXT_PUBLIC_STRIPE_APPLICATION_ID=<STRIPE_PUBLIC_KEY>
STRIPE_SECRET_KEY=<STRIPE_PRIVATE_KEY>

RESEND_API_KEY=<RESEND>

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<CLERK_PUBLIC>
CLERK_SECRET_KEY=<CLERK_PRIVATE>
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

APP_KEY=<YOUR_APP_KEY_FOR_ALPR_API>

# Email Notifications
VIOLATION_EMAIL=<YOUR_EMAIL_FOR_VIOLATION_NOTIFICATIONS>
OVERSTAY_EMAIL=<YOUR_EMAIL_FOR_OVERSTAY_NOTIFICATIONS> (Optional - falls back to VIOLATION_EMAIL if not set)

# Security Features (Optional)
HF_API_TOKEN=<YOUR_HUGGINGFACE_TOKEN>
THREAT_DETECTION_MODEL=Subh775/Threat-Detection-YOLOv8n
TTS_MODEL=ai4bharat/indic-parler-tts

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Security Features

This application includes integrated weapon/threat detection, fire detection, and text-to-speech security alerts. See [SECURITY_FEATURES.md](./SECURITY_FEATURES.md) for details.

- **Threat Detection**: Detects weapons in images using YOLOv8
- **Fire Detection**: Detects fire, flames, and smoke in images using YOLOv8
- **Text-to-Speech**: Generates audio alerts using Indian English TTS
- **API Endpoints**: 
  - `/api/security/threat-detection` - Threat/weapon detection
  - `/api/security/fire-detection` - Fire detection
  - `/api/security/text-to-speech` - Text-to-speech conversion
  - `/api/security/alert` - Combined security alert pipeline

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
