import { type ReactNode, useEffect, useRef } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export default function Modal({ title, onClose, children, wide }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  /* Close on Escape */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  /* Trap focus inside modal */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable[0]?.focus();
  }, []);

  return (
    <div
      className="fixed inset-0 z-[150] overflow-y-auto bg-black/65 backdrop-blur-sm flex min-h-full items-center justify-center p-3 sm:p-6"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <section
        ref={ref}
        onMouseDown={(e) => e.stopPropagation()}
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[84vh] flex flex-col my-auto overflow-hidden text-left text-slate-900 dark:text-slate-100 transition-all duration-200 animate-in zoom-in-95`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/75 dark:bg-slate-900/80">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 m-0">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">{children}</div>
      </section>
    </div>
  );
}
