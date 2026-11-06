'use client';

/** Prints one document on the page: the print styles hide everything but `[data-print="<target>"]`. */
export function PrintButton({ target, label }: { target: string; label: string }) {
  const print = () => {
    document.body.dataset.printing = target;
    const done = () => { delete document.body.dataset.printing; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
  };
  return <button type="button" onClick={print} className="inline-flex min-h-11 items-center rounded-control bg-primary px-5 font-semibold text-on-primary hover:bg-primary-hover">{label}</button>;
}
