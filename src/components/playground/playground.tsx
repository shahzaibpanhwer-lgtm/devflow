"use client";

import { SendIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";

import { CollectionsPanel } from "@/components/playground/collections-panel";
import {
  KeyValueEditor,
  emptyRow,
  rowsToRecord,
  type KeyValueRow,
} from "@/components/playground/key-value-editor";
import {
  ResponsePanel,
  type PlaygroundResponse,
  type ResponseState,
} from "@/components/playground/response-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  HTTP_METHODS,
  isAllowedPath,
  pathParameters,
  type CatalogEndpoint,
  type HttpMethod,
} from "@/lib/api-catalog";

const METHODS_WITH_BODY: readonly HttpMethod[] = ["POST", "PUT", "PATCH"];

function buildRows(pairs?: { key: string; value: string }[]): KeyValueRow[] {
  if (!pairs || pairs.length === 0) return [emptyRow()];
  return pairs.map((pair) => ({ ...pair, id: crypto.randomUUID(), enabled: true }));
}

/**
 * Request editor for DevFlow's own API.
 *
 * Requests are issued by the browser against the same origin, carrying the
 * signed-in session cookie. That is deliberate: a server-side proxy would let
 * any path typed into this box be fetched by the server, which is the classic
 * shape of a request-forgery hole. Same-origin fetch can reach nothing the
 * user could not already reach from their own devtools.
 */
export function Playground() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [path, setPath] = useState("/api/projects");
  const [queryRows, setQueryRows] = useState<KeyValueRow[]>([emptyRow()]);
  const [headerRows, setHeaderRows] = useState<KeyValueRow[]>([emptyRow()]);
  const [body, setBody] = useState("");
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [state, setState] = useState<ResponseState>({ status: "idle" });
  const [destructive, setDestructive] = useState(false);

  const supportsBody = METHODS_WITH_BODY.includes(method);
  const missingParams = pathParameters(path);

  function loadEndpoint(endpoint: CatalogEndpoint) {
    setActiveId(endpoint.id);
    setMethod(endpoint.method);
    setPath(endpoint.path);
    setQueryRows(buildRows(endpoint.query));
    setHeaderRows([emptyRow()]);
    setBody(endpoint.body ?? "");
    setBodyError(null);
    setDestructive(endpoint.destructive ?? false);
    setState({ status: "idle" });
  }

  async function send() {
    setBodyError(null);

    let url: URL;
    try {
      url = new URL(path, window.location.origin);
    } catch {
      setState({ status: "error", message: "That path could not be parsed as a URL." });
      return;
    }

    /*
     * Check the *resolved* path, not the text typed in. URL parsing collapses
     * traversal segments, so "/api/../dashboard" would satisfy a naive
     * startsWith("/api/") test while actually resolving to "/dashboard".
     * Comparing the origin too rejects an absolute URL pointing elsewhere.
     */
    if (url.origin !== window.location.origin || !isAllowedPath(url.pathname)) {
      setState({
        status: "error",
        message: "The playground only calls DevFlow's own API. Paths must start with /api/.",
      });
      return;
    }

    if (missingParams.length > 0) {
      setState({
        status: "error",
        message: `Replace ${missingParams.map((name) => `:${name}`).join(", ")} in the path with a real value before sending.`,
      });
      return;
    }

    let parsedBody: string | undefined;
    if (supportsBody && body.trim()) {
      try {
        // Re-serialising proves the body is valid JSON before it leaves the
        // browser, so a typo reads as a clear message rather than a 400.
        parsedBody = JSON.stringify(JSON.parse(body));
      } catch (error) {
        setBodyError(error instanceof Error ? error.message : "Body must be valid JSON");
        return;
      }
    }

    for (const [key, value] of Object.entries(rowsToRecord(queryRows))) {
      url.searchParams.set(key, value);
    }

    const headers: Record<string, string> = rowsToRecord(headerRows);
    if (parsedBody !== undefined && !("Content-Type" in headers)) {
      headers["Content-Type"] = "application/json";
    }

    setState({ status: "sending" });
    const startedAt = performance.now();

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: parsedBody,
      });

      const text = await response.text();
      const durationMs = Math.round(performance.now() - startedAt);

      let formatted = text;
      let isJson = false;
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2);
        isJson = true;
      } catch {
        // Not JSON; the raw text is shown as it came back.
      }

      const result: PlaygroundResponse = {
        status: response.status,
        statusText: response.statusText,
        durationMs,
        size: new TextEncoder().encode(text).length,
        headers: [...response.headers.entries()].sort(([a], [b]) => a.localeCompare(b)),
        body: formatted,
        isJson,
      };

      setState({ status: "done", response: result });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "The request could not be sent.",
      });
    }
  }

  return (
    <div className="border-line bg-surface-1 grid min-h-0 overflow-hidden rounded-lg border lg:h-[calc(100dvh-12rem)] lg:grid-cols-[16rem_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="border-line max-h-64 border-b lg:max-h-none lg:border-r lg:border-b-0">
        <CollectionsPanel activeId={activeId} onSelect={loadEndpoint} />
      </div>

      <div className="border-line flex min-h-0 flex-col border-b lg:border-r lg:border-b-0">
        <div className="border-line flex items-center gap-2 border-b p-3">
          <Select value={method} onValueChange={(value) => setMethod(value as HttpMethod)}>
            <SelectTrigger className="w-28 shrink-0 font-mono text-xs" aria-label="HTTP method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HTTP_METHODS.map((value) => (
                <SelectItem key={value} value={value} className="font-mono text-xs">
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={path}
            onChange={(event) => setPath(event.target.value)}
            aria-label="Request path"
            placeholder="/api/projects"
            className="flex-1 font-mono text-xs"
          />

          <Button type="button" onClick={() => void send()} disabled={state.status === "sending"}>
            <SendIcon aria-hidden="true" />
            Send
          </Button>
        </div>

        {destructive ? (
          <p className="border-status-warning/25 bg-status-warning/10 text-status-warning flex items-start gap-2 border-b px-3 py-2 text-xs">
            <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            This request changes real data in your workspace.
          </p>
        ) : null}

        {missingParams.length > 0 ? (
          <p className="border-line text-text-tertiary border-b px-3 py-2 text-xs">
            Replace{" "}
            {missingParams.map((name) => (
              <code key={name} className="text-foreground mr-1 font-mono">
                :{name}
              </code>
            ))}
            in the path with a real value.
          </p>
        ) : null}

        <Tabs defaultValue="body" className="flex min-h-0 flex-1 flex-col">
          <div className="border-line border-b px-3 py-2">
            <TabsList>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="query">Query</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="body" className="min-h-0 flex-1 overflow-auto p-3">
            {supportsBody ? (
              <div className="space-y-1.5">
                <Label htmlFor="request-body" className="sr-only">
                  JSON request body
                </Label>
                <Textarea
                  id="request-body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="{}"
                  spellCheck={false}
                  rows={14}
                  aria-invalid={Boolean(bodyError)}
                  className="resize-none font-mono text-xs"
                />
                {bodyError ? (
                  <p className="text-status-danger text-xs">{bodyError}</p>
                ) : (
                  <p className="text-text-tertiary text-xs">
                    Validated as JSON before sending, then again by Zod on the server.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-text-tertiary text-xs">
                {method} requests are sent without a body.
              </p>
            )}
          </TabsContent>

          <TabsContent value="query" className="min-h-0 flex-1 overflow-auto p-3">
            <KeyValueEditor
              rows={queryRows}
              onChange={setQueryRows}
              keyPlaceholder="perPage"
              valuePlaceholder="10"
              label="Parameter"
            />
          </TabsContent>

          <TabsContent value="headers" className="min-h-0 flex-1 overflow-auto p-3">
            <KeyValueEditor
              rows={headerRows}
              onChange={setHeaderRows}
              keyPlaceholder="X-Example"
              valuePlaceholder="value"
              label="Header"
            />
            <p className="text-text-tertiary mt-3 text-xs">
              Your session cookie is sent automatically, so requests run as you.
            </p>
          </TabsContent>
        </Tabs>
      </div>

      <div className="min-h-64 lg:min-h-0">
        <ResponsePanel state={state} />
      </div>
    </div>
  );
}
