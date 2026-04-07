'use client';

import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-surface-body" data-admin="">
      <AdminSidebar />
      <div className="flex flex-1 flex-col ml-[200px]">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
