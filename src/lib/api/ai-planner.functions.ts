import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  income: z.number().min(0).max(10_000_000),
  province: z.string().min(2).max(3),
  age: z.number().int().min(16).max(100),
  rrspRoom: z.number().min(0).max(1_000_000),
  fhsaRoom: z.number().min(0).max(40_000),
  tfsaRoom: z.number().min(0).max(200_000),
  goals: z.string().max(800).optional().default(""),
});

export const getTaxPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI gateway not configured");

    const system = `You are a Canadian tax planning assistant for tax year 2025.
Give practical, plain-English guidance grounded in CRA rules: RRSP, FHSA, TFSA, marginal brackets, OAS clawback, CCB, capital gains inclusion. Always note that this is general information, not personalized advice. Keep answers under 350 words. Use short paragraphs and bullet points.`;

    const user = `Client profile:
- Province: ${data.province}
- Age: ${data.age}
- Gross income: $${data.income.toLocaleString("en-CA")}
- RRSP room: $${data.rrspRoom.toLocaleString("en-CA")}
- FHSA room: $${data.fhsaRoom.toLocaleString("en-CA")}
- TFSA room: $${data.tfsaRoom.toLocaleString("en-CA")}
- Goals: ${data.goals || "(not specified)"}

Provide a tax plan for 2025: recommended RRSP vs FHSA vs TFSA split (with $ amounts), expected federal+provincial marginal tax savings, and 3 specific next steps.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Rate limit reached. Please try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please contact the workspace owner.");
    if (!res.ok) throw new Error(`AI gateway error: ${res.status}`);
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content ?? "";
    return { text };
  });
