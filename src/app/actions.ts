"use server";

import { summarizeActivityLogs } from "@/ai/flows/summarize-activity-logs";
import { z } from "zod";

const AnalyzeLogsSchema = z.object({
  logs: z.string().min(50, { message: "Please provide at least 50 characters of logs for a meaningful analysis." }),
});

export interface AnalyzeLogsState {
  summary?: string;
  error?: string | null;
}

export async function analyzeLogsAction(
  prevState: AnalyzeLogsState,
  formData: FormData
): Promise<AnalyzeLogsState> {
  const validatedFields = AnalyzeLogsSchema.safeParse({
    logs: formData.get("logs"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.logs?.[0] || "Invalid input.",
    };
  }

  try {
    const result = await summarizeActivityLogs({ logs: validatedFields.data.logs });
    if (result.summary) {
      return { summary: result.summary };
    }
    return { error: "Failed to generate a summary." };
  } catch (e) {
    console.error(e);
    return { error: "An unexpected error occurred. Please try again." };
  }
}
