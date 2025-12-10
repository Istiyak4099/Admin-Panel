// Summarize system activity logs, identify anomalies, and summarize events that require attention.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeActivityLogsInputSchema = z.object({
  logs: z.string().describe('System activity logs to analyze.'),
});

export type SummarizeActivityLogsInput = z.infer<typeof SummarizeActivityLogsInputSchema>;

const SummarizeActivityLogsOutputSchema = z.object({
  summary: z.string().describe('A summary of the system activity logs, highlighting anomalies and important events, formatted from most to least important.'),
});

export type SummarizeActivityLogsOutput = z.infer<typeof SummarizeActivityLogsOutputSchema>;

export async function summarizeActivityLogs(input: SummarizeActivityLogsInput): Promise<SummarizeActivityLogsOutput> {
  return summarizeActivityLogsFlow(input);
}

const summarizeActivityLogsPrompt = ai.definePrompt({
  name: 'summarizeActivityLogsPrompt',
  input: {schema: SummarizeActivityLogsInputSchema},
  output: {schema: SummarizeActivityLogsOutputSchema},
  prompt: `You are an expert system administrator. Analyze the following system activity logs, identify any anomalies, and summarize the events that require immediate attention. Format the summary from most to least important based on context. Be concise and clear.

System Activity Logs:
{{{logs}}}`,
});

const summarizeActivityLogsFlow = ai.defineFlow({
    name: 'summarizeActivityLogsFlow',
    inputSchema: SummarizeActivityLogsInputSchema,
    outputSchema: SummarizeActivityLogsOutputSchema,
  },
  async input => {
    const {output} = await summarizeActivityLogsPrompt(input);
    return output!;
  }
);
