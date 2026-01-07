import { db } from "@/db";
import { agents, meetings, user } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { eq, inArray } from "drizzle-orm";
import JSONL from "jsonl-parse-stringify";

export const meetingsProcessing = inngest.createFunction(
  { id: "meetings/processing" },
  { event: "meetings/processing" },
  async ({ event, step }) => {
    // 1️⃣ Fetch transcript
    const response = await step.run("fetch-transcript", async () => {
      const res = await fetch(event.data.transcriptUrl);
      return res.text();
    });

    // 2️⃣ Parse transcript
    const transcript = await step.run("parse-transcript", async () => {
      return JSONL.parse<StreamTranscriptItem>(response);
    });

    // 3️⃣ Add speaker info
    const transcriptWithSpeakers = await step.run("add-speakers", async () => {
      const speakerIds = [...new Set(transcript.map((item) => item.speaker_id))];

      const userSpeakers = await db
        .select()
        .from(user)
        .where(inArray(user.id, speakerIds));

      const agentSpeakers = await db
        .select()
        .from(agents)
        .where(inArray(agents.id, speakerIds));

      const speakers = [...userSpeakers, ...agentSpeakers];

      return transcript.map((item) => {
        const speaker = speakers.find((s) => s.id === item.speaker_id);
        return {
          ...item,
          user: { name: speaker?.name ?? "Unknown" },
        };
      });
    });

    // 4️⃣ Generate summary (FAKE if no OpenAI)
    let summary: string;
    if (process.env.OPENAI_API_KEY) {
      // Optional: integrate OpenAI SDK here if you have a key
      summary = "[OpenAI summary placeholder]";
    } else {
      // Dev / no key fallback
      summary = transcriptWithSpeakers
        .slice(0, 5)
        .map((t) => `${t.user.name}: ${t.text.slice(0, 50)}`)
        .join("\n");
    }

    // 5️⃣ Save summary & mark meeting completed
    await step.run("save-summary", async () => {
      return db.update(meetings)
        .set({ summary, status: "completed" })
        .where(eq(meetings.id, event.data.meetingId))
        .returning();
    });
  }
);


//OG Code
// import { db } from "@/db";
// import { agents, meetings, user } from "@/db/schema";
// import { inngest } from "@/inngest/client";
// import { StreamTranscriptItem } from "@/modules/meetings/types";
// import { eq, inArray } from "drizzle-orm";
// import JSONL from "jsonl-parse-stringify";
// import { createAgent, openai, TextMessage } from "@inngest/agent-kit";

// const summarizer = createAgent({
//   name: "Summarizer",
//   system: `
//     You are an expert summarizer. You write readable, concise, simple content. You are given a transcript of a meeting and you need to summarize it.

// Use the following markdown structure for every output:

// ### Overview
// Provide a detailed, engaging summary of the session's content. Focus on major features, user workflows, and any key takeaways. Write in a narrative style, using full sentences. Highlight unique or powerful aspects of the product, platform, or discussion.

// ### Notes
// Break down key content into thematic sections with timestamp ranges. Each section should summarize key points, actions, or demos in bullet format.

// Example:
// #### Section Name
// - Main point or demo shown here
// - Another key insight or interaction
// - Follow-up tool or explanation provided

// #### Next Section
// - Feature X automatically does Y
// - Mention of integration with Z
//   `.trim(),
//   model: openai({
//     model: "gpt-4o", // Use the GPT-4o model
//     apiKey: process.env.OPENAI_API_KEY,
//   }),
// });

// export const meetingsProcessing = inngest.createFunction(
//   { id: "meetings/processing" },
//   { event: "meetings/processing" },
//   async ({ event, step }) => {
//     const response = await step.run("fetch-transcript", async () => {
//       return fetch(event.data.transcriptUrl).then((res) => res.text());
//     });

//     const transcript = await step.run("Parse transcription", async () => {
//       return JSONL.parse<StreamTranscriptItem>(response);
//     });

//     const transcriptWithSpeakers = await step.run("add-speakers", async () => {
//       const speakerIds = [
//         ...new Set(transcript.map((item) => item.speaker_id)),
//       ];

//       const userSpeakers = await db
//         .select()
//         .from(user)
//         .where(inArray(user.id, speakerIds))
//         .then((users) =>
//           users.map((user) => ({
//             ...user,
//           }))
//         );

//       const agentSpeakers = await db
//         .select()
//         .from(agents)
//         .where(inArray(agents.id, speakerIds))
//         .then((agents) =>
//           agents.map((agent) => ({
//             ...agent,
//           }))
//         );

//       const speakers = [...userSpeakers, ...agentSpeakers];

//       return transcript.map((item) => {
//         const speaker = speakers.find(
//           (speaker) => speaker.id === item.speaker_id
//         );

//         if (!speaker) {
//           return {
//             ...item,
//             user: {
//               name: "Unknown",
//             },
//           };
//         }

//         return {
//           ...item,
//           user: {
//             name: speaker.name,
//           },
//         };
//       });
//     });

//     const { output } = await summarizer.run(
//       "Summarize the following transcript" +
//         JSON.stringify(transcriptWithSpeakers)
//     );

//     await step.run("save-summary", async () => {
//       return db
//         .update(meetings)
//         .set({
//           summary: (output[0] as TextMessage).content as string,
//           status: "completed",
//         })
//         .where(eq(meetings.id, event.data.meetingId))
//         .returning();
//     });
//   }
// );