"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useState, type ComponentProps, type HTMLAttributes } from "react";

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language?: string;
};

// Lightweight code block: no syntax highlighting, just a styled <pre> with a
// copy button. Kept minimal so the AI panel doesn't pull in a full highlighter.
export const CodeBlock = ({ code, language, className, ...props }: CodeBlockProps) => (
  <div className={cn("group relative overflow-hidden rounded-md border bg-background", className)} {...props}>
    <div className="flex items-center justify-between border-b bg-muted/80 px-3 py-1.5">
      <span className="font-mono text-xs text-muted-foreground">{language ?? "text"}</span>
      <CodeBlockCopyButton code={code} />
    </div>
    <pre className="m-0 overflow-x-auto p-3 font-mono text-xs text-foreground">
      <code>{code}</code>
    </pre>
  </div>
);

type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & { code: string };

function CodeBlockCopyButton({ code, className, ...props }: CodeBlockCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable.
    }
  }, [code]);

  const Icon = copied ? CheckIcon : CopyIcon;

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      className={cn("size-6 shrink-0 text-muted-foreground", className)}
      onClick={copy}
      {...props}
    >
      <Icon className="size-3.5" />
    </Button>
  );
}
