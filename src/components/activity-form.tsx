"use client";

import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { analyzeLogsAction, type AnalyzeLogsState } from "@/app/actions";
import { Wand2, LoaderCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Wand2 className="mr-2 h-4 w-4" />
      )}
      Analyze Logs
    </Button>
  );
}

export function ActivityForm() {
  const initialState: AnalyzeLogsState = { summary: "", error: null };
  const [state, formAction] = useActionState(analyzeLogsAction, initialState);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={formAction}>
        <Card>
          <CardHeader>
            <CardTitle>System Log Analyzer</CardTitle>
            <CardDescription>
              Paste system activity logs below to identify anomalies and summarize
              events that may need admin attention.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full gap-2">
              <Label htmlFor="logs">Activity Logs</Label>
              <Textarea
                id="logs"
                name="logs"
                placeholder="[2024-07-21 14:35:01] USER_LOGIN SUCCESS: admin"
                rows={15}
                required
              />
              {state.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </Card>
      </form>
      <Card>
        <CardHeader>
          <CardTitle>Analysis Summary</CardTitle>
          <CardDescription>
            An AI-generated summary of important events, ordered by priority.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.summary ? (
            <div className="prose prose-sm prose-invert max-w-none whitespace-pre-wrap rounded-md bg-muted p-4">
              {state.summary}
            </div>
          ) : (
             <Alert>
              <Wand2 className="h-4 w-4" />
              <AlertTitle>Awaiting Analysis</AlertTitle>
              <AlertDescription>
                Enter your logs and click "Analyze" to see the summary here.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
