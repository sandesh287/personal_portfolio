import { ExternalLink } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface BlogArticleContentProps {
  content: string;
}

export function BlogArticleContent({ content }: BlogArticleContentProps) {
  return (
    <div className="min-w-0 text-[0.95rem] leading-7 text-foreground sm:text-base sm:leading-8">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h2 className="mb-4 mt-10 break-words text-2xl font-semibold text-foreground first:mt-0">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h2 className="mb-4 mt-10 break-words text-xl font-semibold text-foreground first:mt-0 sm:text-2xl">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 mt-8 break-words text-lg font-semibold text-foreground sm:text-xl">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="my-5 text-muted-foreground">{children}</p>,
          a: ({ children, href }) => {
            const isExternal = href?.startsWith("http://") || href?.startsWith("https://");

            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer" : undefined}
                className="inline-flex items-baseline gap-1 break-all font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
              >
                {children}
                {isExternal ? (
                  <ExternalLink className="inline h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                ) : null}
              </a>
            );
          },
          ul: ({ children }) => (
            <ul className="my-5 list-disc space-y-2 pl-6 text-muted-foreground marker:text-primary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-5 list-decimal space-y-2 pl-6 text-muted-foreground marker:font-medium marker:text-primary">
              {children}
            </ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l-4 border-primary bg-primary/5 px-4 py-1 text-foreground">
              {children}
            </blockquote>
          ),
          pre: ({ children }) => (
            <pre className="my-6 max-w-full overflow-x-auto rounded-md border border-border bg-surface p-4 text-sm leading-6 text-foreground">
              {children}
            </pre>
          ),
          code: ({ children, className }) => (
            <code
              className={
                className
                  ? `${className} font-mono`
                  : "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
              }
            >
              {children}
            </code>
          ),
          table: ({ children }) => (
            <table className="my-6 block w-full overflow-x-auto border-collapse text-left text-sm">
              {children}
            </table>
          ),
          th: ({ children }) => (
            <th className="whitespace-nowrap border border-border bg-muted px-3 py-2 font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="min-w-32 border border-border px-3 py-2 text-muted-foreground">
              {children}
            </td>
          ),
          hr: () => <hr className="my-10 border-border" />,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
