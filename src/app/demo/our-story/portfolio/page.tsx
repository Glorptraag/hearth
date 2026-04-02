'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ChildSelector } from '@/components/ui/child-selector';
import LearnerAvatar from '@/components/ui/LearnerAvatar';
import DomainChip, { DOMAIN_LABELS } from '@/components/ui/DomainChip';
import SectionHeader from '@/components/ui/SectionHeader';
import { mockLearners, mockPortfolioEntries } from '../../mock-data';

export default function DemoPortfolio() {
  const searchParams = useSearchParams();
  const initialSelectedId = searchParams.get('child') || 'learner-1';
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [searchText, setSearchText] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const filteredEntries = useMemo(() => {
    let entries = mockPortfolioEntries.filter((e) => e.learnerIds.includes(selectedId));

    if (searchText) {
      entries = entries.filter(
        (e) =>
          e.title.toLowerCase().includes(searchText.toLowerCase()) ||
          e.description.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedSubjects.length > 0) {
      entries = entries.filter((e) =>
        e.subjects.some((s) => selectedSubjects.includes(s))
      );
    }

    return entries.sort((a, b) => new Date(b.dateOccurred).getTime() - new Date(a.dateOccurred).getTime());
  }, [selectedId, searchText, selectedSubjects]);

  const allSubjectsForChild = useMemo(() => {
    const subjects = new Set<string>();
    mockPortfolioEntries
      .filter((e) => e.learnerIds.includes(selectedId))
      .forEach((e) => e.subjects.forEach((s) => subjects.add(s)));
    return Array.from(subjects).sort();
  }, [selectedId]);

  const groupedByMonth = useMemo(() => {
    const groups: Record<string, typeof filteredEntries> = {};
    filteredEntries.forEach((entry) => {
      const month = format(parseISO(entry.dateOccurred), 'MMMM yyyy');
      if (!groups[month]) groups[month] = [];
      groups[month].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  const toggleSubject = (subject: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-md py-lg lg:py-2xl">
      {/* Child Selector */}
      <ChildSelector learners={mockLearners} selectedId={selectedId} onChange={setSelectedId} />

      <SectionHeader overline="PORTFOLIO" title="Learning Journey" />

      {/* Search Input */}
      <div className="mt-xl mb-lg">
        <input
          type="text"
          placeholder="Search moments..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full rounded-md border border-border-subtle bg-surface-raised px-md py-sm font-sans text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-border-medium focus:ring-1 focus:ring-ember/30 transition-all duration-200"
        />
      </div>

      {/* Subject Filter Chips */}
      {allSubjectsForChild.length > 0 && (
        <div className="mb-xl">
          <p className="mb-sm font-sans text-xs font-medium text-text-muted uppercase tracking-[0.08em]">
            Filter by subject
          </p>
          <div className="flex gap-sm flex-wrap">
            {allSubjectsForChild.map((subject) => (
              <button
                key={subject}
                onClick={() => toggleSubject(subject)}
                className={`rounded-full px-sm py-xs font-sans text-xs font-medium transition-all duration-200 border ${
                  selectedSubjects.includes(subject)
                    ? 'border-border-medium bg-surface-raised text-text-primary'
                    : 'border-border-subtle bg-transparent text-text-secondary hover:border-border-medium'
                }`}
              >
                {DOMAIN_LABELS[subject] || subject}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Entry Count */}
      <div className="mb-2xl">
        <p className="font-sans text-sm font-semibold text-text-secondary">
          {filteredEntries.length} moment{filteredEntries.length !== 1 ? 's' : ''} captured
        </p>
      </div>

      {/* Entries Grouped by Month */}
      {Object.entries(groupedByMonth).length === 0 ? (
        <div className="rounded-lg border border-border-subtle bg-surface-panel p-lg text-center">
          <p className="font-sans text-sm text-text-muted">No moments yet. Start logging to build the portfolio!</p>
        </div>
      ) : (
        Object.entries(groupedByMonth).map(([month, entries]) => (
          <div key={month} className="mb-3xl">
            <h3 className="mb-lg font-serif text-lg font-semibold text-text-primary">{month}</h3>
            <div className="space-y-md">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-border-subtle bg-surface-panel p-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:translate-y-[-2px] hover:border-border-medium hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                >
                  <h4 className="mb-sm font-serif font-semibold text-text-primary">{entry.title}</h4>
                  <p className="mb-md line-clamp-2 font-serif text-sm text-text-secondary">
                    {entry.description}
                  </p>

                  {/* Subject Chips */}
                  {entry.subjects.length > 0 && (
                    <div className="mb-md flex gap-xs flex-wrap">
                      {entry.subjects.map((subject) => (
                        <DomainChip key={subject} subject={subject} size="sm" />
                      ))}
                    </div>
                  )}

                  {/* Date and Evidence Type */}
                  <div className="mb-md flex items-center justify-between">
                    <div className="flex items-center gap-sm">
                      <span className="font-sans text-xs text-text-muted">
                        {format(parseISO(entry.dateOccurred), 'd MMM yyyy')}
                      </span>
                      <span className="text-lg">{entry.evidenceType === 'photo' ? '📷' : entry.evidenceType === 'artwork' ? '🎨' : entry.evidenceType === 'note' ? '📓' : '📄'}</span>
                    </div>
                  </div>

                  {/* Learner Avatars */}
                  {entry.learnerIds.length > 0 && (
                    <div className="flex gap-sm">
                      {entry.learnerIds.map((learnerId) => {
                        const learner = mockLearners.find((l) => l.id === learnerId);
                        return learner ? (
                          <LearnerAvatar
                            key={learnerId}
                            name={learner.name}
                            colourToken={learner.colourToken}
                            size="sm"
                          />
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
