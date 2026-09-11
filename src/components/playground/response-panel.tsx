"use client";

import { CheckIcon, CopyIcon, Loader2Icon, TerminalIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type PlaygroundResponse = {
  status: number;
  statusText: string;
  /** Round trip measured in the browser, so it includes network time. */
  durationMs: number;
  /** Response size in bytes, from the body actually received. */
  size: number;
  headers: [string, string][];
  body: string;
  /** True when the body parsed as JSON and was re-formatted. */
  isJson: boolean;
};

export type ResponseState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "done"; response: PlaygroundResponse }
  | { status: "error"; message: string };

/** Colour by status class. These are states, so they also carry the number. */
function statusTone(status: number): string {
  if (status >= 500) return "text-status-danger";
  if (status >= 400) return "text-status-warning";
  if (status >= 300) return "text-status-info";
  return "text-status-success";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} kB`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be refused; the body is selectable either way.
    }
  }

  return (
    <Button type="button" variant="ghost" size="xs" onClick={() => void copy()}>
      {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function ResponsePanel({ state }: { state: ResponseState }) {
  if (state.status === "idle") {
    return (
      <div className="text-text-tertiary flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <TerminalIcon className="size-5" aria-hidden="true" />
        <p className="text-sm">Send a request to see the response.</p>
      </div>
    );
  }

  if (state.status === "sending") {
    return (
      <div className="text-text-tertiary flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <Loader2Icon className="size-5 animate-spin" aria-hidden="true" />
        <p className="text-sm">Sending…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-status-danger text-sm font-medium">Request failed</p>
        <p className="text-text-secondary max-w-xs text-xs text-pretty">{state.message}</p>
      </div>
    );
  }

  const { response } = state;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-line flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-3 py-2">
        <span className={cn("font-mono text-sm font-semibold", statusTone(response.status))}>
          {response.status}
          <span className="ml-1.5 text-xs font-normal">{response.statusText}</span>
        </span>
        <span className="text-text-tertiary font-mono text-xs tabular-nums">
          {response.durationMs} ms
        </span>
        <span className="text-text-tertiary font-mono text-xs tabular-nums">
          {formatSize(response.size)}
        </span>
        <div className="ml-auto">
          <CopyButton text={response.body} />
        </div>
      </div>

      <Tabs defaultValue="body" className="flex min-h-0 flex-1 flex-col">
        <div className="border-line border-b px-3 py-2">
          <TabsList>
            <TabsTrigger value="body">Body</TabsTrigger>
            <TabsTrigger value="headers">Headers ({response.headers.length})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="body" className="min-h-0 flex-1 overflow-auto">
          <pre className="text-text-secondary p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {response.body || "(empty response)"}
          </pre>
        </TabsContent>

        <TabsContent value="headers" className="min-h-0 flex-1 overflow-auto">
          <dl className="divide-line divide-y text-xs">
            {response.headers.map(([name, value]) => (
              <div key={name} className="flex gap-3 px-3 py-1.5">
                <dt className="text-text-tertiary w-40 shrink-0 font-mono break-words">{name}</dt>
                <dd className="text-text-secondary min-w-0 flex-1 font-mono break-words">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </TabsContent>
      </Tabs>
    </div>
  );
}
