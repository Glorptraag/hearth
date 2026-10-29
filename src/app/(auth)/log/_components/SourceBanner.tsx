import { format, isValid, parseISO } from 'date-fns';
import { ClipboardText } from '@/components/icons';
import type { ScaffoldData } from '@/hooks/use-scaffold-fetch';
import type { NoticeSource } from '@/lib/logger/source';
import { noticeCopy } from './noticeCopy';

interface SourceBannerProps {
  source: NoticeSource;
  scaffold: ScaffoldData | null;
  learnerName: string | null;
  threadName: string | null;
}

function sessionDate(date: string): string {
  const d = parseISO(date);
  return isValid(d) ? format(d, 'EEE d MMM') : date;
}

/**
 * "Working from" — tells the parent where this visit came from (a Hearth
 * session, a project stage, a check-in). Nothing for a plain /log visit. A
 * banner is not an action, so the icon is secondary, not ember.
 */
export function SourceBanner({ source, scaffold, learnerName, threadName }: SourceBannerProps) {
  if (source.kind === 'logger') return null;

  let title: string;
  let detail: string | null;
  if (source.kind === 'hearth_session') {
    title = noticeCopy.source.hearthTitle(scaffold?.session.hearthName ?? 'your Hearth');
    detail = scaffold
      ? noticeCopy.source.hearthDetail(scaffold.session.title, sessionDate(scaffold.session.date))
      : null;
  } else if (source.kind === 'project_stage') {
    title = noticeCopy.source.projectTitle;
    detail = noticeCopy.source.projectDetail(source.stageNumber);
  } else {
    title = noticeCopy.source.checkInTitle(learnerName, threadName);
    detail = noticeCopy.source.checkInDetail;
  }

  return (
    <div className="flex gap-md rounded-[10px] border border-border-subtle bg-surface-raised p-md">
      <ClipboardText size={18} className="mt-[1px] shrink-0 text-text-secondary" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-sans text-sm font-medium text-text-primary">{title}</p>
        {detail && <p className="mt-xs font-sans text-xs text-text-muted">{detail}</p>}
      </div>
    </div>
  );
}
