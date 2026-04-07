import { NextResponse } from 'next/server';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { fetchAllIssues } from '@/lib/content-qa/run';

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const url = new URL(request.url);
  const typeFilter = url.searchParams.getAll('type');
  const docTypeFilter = url.searchParams.getAll('docType');
  const packFilter = url.searchParams.get('packId');
  const severityFilter = url.searchParams.getAll('severity');

  let issues = await fetchAllIssues();

  if (typeFilter.length > 0) {
    issues = issues.filter((i) => {
      if (typeFilter.includes('missing') && i.message.startsWith('Missing required field')) return true;
      if (typeFilter.includes('weak') && i.message.startsWith('Weak field value')) return true;
      if (typeFilter.includes('broken_ref') && i.message.includes('Broken reference')) return true;
      if (typeFilter.includes('orphan') && i.message.includes('Orphan')) return true;
      if (typeFilter.includes('count_drift') && i.message.includes('Count drift')) return true;
      if (typeFilter.includes('duplicate_slug') && i.message.includes('Duplicate slug')) return true;
      return false;
    });
  }

  if (docTypeFilter.length > 0) {
    issues = issues.filter((i) => docTypeFilter.includes(i.docType));
  }

  if (packFilter) {
    issues = issues.filter((i) => i.packId === packFilter);
  }

  if (severityFilter.length > 0) {
    issues = issues.filter((i) => severityFilter.includes(i.severity));
  }

  return NextResponse.json({ issues, total: issues.length });
}
