sequenceDiagram
    actor User
    participant Page as Next.js Page<br/>[meetingId]
    participant TRPC as TRPC Client
    participant DB as Database
    participant StreamSvc as Stream.io Service
    participant StreamSDK as Stream Video SDK<br/>(Client)

    User->>Page: Navigate to /call/[meetingId]
    Page->>Page: Verify session (redirect if needed)
    Page->>TRPC: Prefetch meetings.getOne
    TRPC->>DB: Fetch meeting + metadata
    DB-->>TRPC: Meeting data
    TRPC-->>Page: Dehydrated query state
    Page->>User: Render CallView + HydrationBoundary

    rect rgb(240, 248, 255)
    Note over User,StreamSDK: User joins call flow
    User->>StreamSDK: CallProvider rendered with session
    StreamSDK->>StreamSDK: Read user session + generate avatar
    User->>StreamSDK: Enter lobby (CallUI in "lobby" mode)
    User->>StreamSDK: Grant permissions + click Join Call
    StreamSDK->>TRPC: generateToken (for current user)
    TRPC->>StreamSvc: Upsert user + create room (if first time)
    StreamSvc-->>TRPC: User token + metadata
    TRPC-->>StreamSDK: Token returned
    StreamSDK->>StreamSDK: Initialize StreamClient with token
    StreamSDK->>StreamSvc: Join call
    StreamSvc-->>StreamSDK: Call active (SpeakerLayout ready)
    StreamSDK->>User: Render CallUI in "call" mode (CallActive)
    end

    rect rgb(255, 240, 245)
    Note over User,StreamSDK: User ends call
    User->>StreamSDK: Click leave/disconnect
    StreamSDK->>StreamSvc: End call + cleanup
    StreamSDK->>StreamSDK: Switch to "ended" mode
    StreamSDK->>User: Render CallEnded (redirect option)
    end


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
