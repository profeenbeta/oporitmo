import { cn } from "@/lib/utils";

export function Credit({ className }: { className?: string }) {
  return (
    <p className={cn("mt-8 text-center text-xs text-muted", className)}>
      Creado por{" "}
      <a
        href="https://profeenbeta.es"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-ink underline-offset-4 hover:underline"
      >
        Profe en Beta
      </a>
    </p>
  );
}