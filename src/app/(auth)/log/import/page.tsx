'use client';

import { useRouter } from 'next/navigation';
import { CsvImportForm } from '@/components/logger/CsvImportForm';

/**
 * CSV import — bring a spreadsheet of past moments into Hearth. Own route so
 * the Logger stays a single short form; linked from its footer.
 */
export default function CsvImportPage() {
  const router = useRouter();
  const done = () => router.push('/log');

  return (
    <div className="mx-auto w-full min-w-0 max-w-[560px] px-md py-lg xl:max-w-[600px]">
      <h1 className="mb-lg font-serif text-[1.1rem] font-semibold text-text-primary">Import a CSV</h1>
      <CsvImportForm onComplete={done} onCancel={done} />
    </div>
  );
}
