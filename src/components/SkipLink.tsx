export function SkipLink({ label }: { label: string }) {
  return (
    <a href="#main" className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-on-primary focus:not-sr-only focus:fixed focus:start-4 focus:top-4">
      {label}
    </a>
  );
}
