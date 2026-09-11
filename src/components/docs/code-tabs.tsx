"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CODE_LANGUAGES, type CodeLanguage } from "@/lib/docs";

/**
 * Code samples in four languages.
 *
 * The samples are generated from one description of the request, so they
 * cannot drift apart the way hand-written examples do.
 */
export function CodeTabs({ samples }: { samples: Record<CodeLanguage, string> }) {
  const [language, setLanguage] = useState<CodeLanguage>("javascript");
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(samples[language]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be refused; the sample stays selectable.
    }
  }

  return (
    <Tabs value={language} onValueChange={(value) => setLanguage(value as CodeLanguage)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList className="w-max">
            {CODE_LANGUAGES.map((entry) => (
              <TabsTrigger key={entry.id} value={entry.id}>
                {entry.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <Button type="button" variant="ghost" size="xs" onClick={() => void copy()}>
          {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {CODE_LANGUAGES.map((entry) => (
        <TabsContent key={entry.id} value={entry.id}>
          <pre className="border-line bg-surface-0 text-text-secondary overflow-x-auto rounded-md border p-3 font-mono text-xs leading-relaxed">
            <code>{samples[entry.id]}</code>
          </pre>
        </TabsContent>
      ))}
    </Tabs>
  );
}
