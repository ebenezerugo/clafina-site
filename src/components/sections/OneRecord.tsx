import type { ReactNode } from 'react';

/**
 * Four steps of one sale. A soft highlight walks through the steps; every step stays fully visible at rest,
 * and the highlight stops under reduced motion.
 */
export function OneRecord({ steps, visuals }: { steps: { id: string; title: string; body: string }[]; visuals: Record<string, ReactNode> }) {
  return (
    <ol className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {steps.map((step, i) => (
        <li key={step.id} data-step={step.id} className="one-record-step relative flex min-w-0 flex-col gap-4 rounded-xl border border-line bg-raised p-5" style={{ animationDelay: `${i * 1.5}s` }}>
          <span aria-hidden="true" className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">{i + 1}</span>
          <h3 className="text-lg font-bold">{step.title}</h3>
          <p className="text-muted">{step.body}</p>
          <div className="mt-auto">{visuals[step.id]}</div>
        </li>
      ))}
    </ol>
  );
}
