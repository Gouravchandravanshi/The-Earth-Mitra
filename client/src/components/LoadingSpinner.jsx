import { LoaderCircle } from 'lucide-react';

export default function LoadingSpinner({ label = 'Loading…', className = '' }) {
  return <div role="status" aria-live="polite" className={`flex min-h-24 items-center justify-center gap-2 py-8 text-sm text-gray-500 ${className}`}>
    <LoaderCircle size={19} className="animate-spin text-[#2D5A2E]" aria-hidden="true" />
    <span>{label}</span>
  </div>;
}
