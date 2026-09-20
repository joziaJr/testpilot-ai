import { getUploadPolicy } from "@/config/upload";
import { PrdUpload } from "@/components/prd-upload";
export const dynamic = "force-dynamic";
export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--surface)] px-6 py-8 text-[var(--foreground)] sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-[var(--line)] pb-6 text-lg font-semibold tracking-tight">
          TestPilot <span className="text-[var(--accent)]">AI</span>
        </header>
        <section className="py-12 sm:py-20" aria-labelledby="upload-title">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--accent)]">
            Start with your requirements
          </p>
          <h1
            id="upload-title"
            className="text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            Upload your PRD
          </h1>
          <p className="mt-5 max-w-xl leading-7 text-[var(--muted)]">
            Choose your product requirements document. We’ll validate and
            extract it, then let you start a source-grounded AI analysis.
          </p>
          <PrdUpload {...getUploadPolicy()} />
        </section>
        <footer className="border-t border-[var(--line)] py-5 text-sm text-[var(--muted)]">
          Your document is processed in memory and is not stored permanently.
        </footer>
      </div>
    </main>
  );
}
