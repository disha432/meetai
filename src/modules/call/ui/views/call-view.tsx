"use client";

import { ErrorState } from "@/components/error-state";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CallProvider } from "../components/call-provider";

interface Props {
  meetingId: string;
}

export const CallView = ({ meetingId }: Props) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.meetings.getOne.queryOptions({
      id: meetingId,
    })
  );

  // ❌ Meeting ended → show error
  if (data.status === "completed") {
    return (
      <div className="flex h-screen items-center justify-center">
        <ErrorState
          title="Meeting has ended"
          description="You can no longer join this meeting."
        />
      </div>
    );
  }

  // ✅ Active meeting → show agent + call
  return (
    <div className="flex flex-col h-screen">
      
      {/* 🤖 Fake Agent Banner */}
      {data.agent && (
        <div className="flex items-center gap-3 px-4 py-2 border-b bg-muted">
          <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">
            🤖
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {data.agent.name}
            </span>
            <span className="text-xs text-muted-foreground">
              AI Agent • Active
            </span>
          </div>
        </div>
      )}

      {/* Actual Call UI */}
      <CallProvider
        meetingId={meetingId}
        meetingName={data.name}
      />
    </div>
  );
};


// "use client";

// import { ErrorState } from "@/components/error-state";
// import { useTRPC } from "@/trpc/client";
// import { useSuspenseQuery } from "@tanstack/react-query";
// import { CallProvider } from "../components/call-provider";

// interface Props {
//   meetingId: string;
// }

// export const CallView = ({ meetingId }: Props) => {
//   const trpc = useTRPC();
//   const { data } = useSuspenseQuery(
//     trpc.meetings.getOne.queryOptions({
//       id: meetingId,
//     })
//   );

//   if (data.status === "completed") {
   

//     //OG Code
//    return (
//         <div className="flex h-screen items-center justify-center">
//             <ErrorState
//                 title="Meeting has ended"
//                 description="You can no longer join this meeting."
//             />
//         </div>
//     )
//   }

//   return <CallProvider
//     meetingId={meetingId}
//     meetingName={data.name}
//   />; 
// };