import { PROJECT_INFO } from "@/lib/project-info";

const foundationItems = [
  {
    label: "Documentation first",
    detail: "Approved product, engineering, QA, and security baselines.",
  },
  {
    label: "Quality gates",
    detail:
      "Lint, types, unit tests, production build, and E2E smoke coverage.",
  },
  {
    label: `Version ${PROJECT_INFO.version}`,
    detail:
      "Semantic versioning and automated release foundations are configured.",
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--surface)] text-[var(--foreground)]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-between px-6 py-10 sm:px-10 sm:py-14">
        <header className="flex items-center justify-between border-b border-[var(--line)] pb-5">
          <span className="text-sm font-semibold tracking-tight">
            TestPilot AI
          </span>
          <span className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs font-medium text-[var(--muted)] shadow-sm">
            M0 · Foundation
          </span>
        </header>

        <section className="py-16 sm:py-24" aria-labelledby="foundation-title">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Project foundation ready
          </p>
          <h1
            id="foundation-title"
            className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl"
          >
            A maintainable base for PRD-grounded QA workflows.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
            The application shell, validation toolchain, testing infrastructure,
            and release controls are in place. Product workflows begin in later
            milestones.
          </p>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {foundationItems.map((item) => (
              <article
                key={item.label}
                className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)]"
              >
                <h2 className="font-semibold tracking-tight">{item.label}</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        <footer className="border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)]">
          MVP business workflows are intentionally not implemented in M0.
        </footer>
      </div>
    </main>
  );
}
