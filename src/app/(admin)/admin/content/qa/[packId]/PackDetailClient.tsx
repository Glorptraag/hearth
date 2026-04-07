'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PackDetailTree from '../_components/PackDetailTree';
import ReadinessBanner from '../_components/ReadinessBanner';
import QAFieldChecklist from '../_components/QAFieldChecklist';
import type { PackDetail, TreeNode } from '@/lib/content-qa/run';

interface Props {
  packId: string;
}

export default function PackDetailClient({ packId }: Props) {
  const [detail, setDetail] = useState<PackDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [rechecking, setRechecking] = useState(false);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/qa/packs/${packId}`);
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } finally {
      setLoading(false);
    }
  }, [packId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  async function handleRecheck() {
    setRechecking(true);
    try {
      const res = await fetch(`/api/admin/qa/packs/${packId}/recheck`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
      }
    } finally {
      setRechecking(false);
    }
  }

  if (loading) {
    return (
      <div className="p-lg">
        <p className="font-sans text-sm text-text-muted">Loading pack detail...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-lg">
        <p className="font-sans text-sm text-text-muted">Pack not found.</p>
        <Link
          href="/admin/content/qa"
          className="font-sans text-xs text-ember hover:underline mt-sm inline-block"
        >
          Back to QA
        </Link>
      </div>
    );
  }

  const allErrors = detail.issues.filter((i) => i.severity === 'error');

  return (
    <div className="p-lg">
      {/* Header */}
      <div className="flex items-center gap-sm mb-xs">
        <Link
          href="/admin/content/qa"
          className="font-sans text-xs text-text-muted hover:text-text-primary transition-colors duration-200"
        >
          QA
        </Link>
        <span className="font-sans text-xs text-text-muted">/</span>
      </div>

      <div className="flex items-center justify-between mb-md">
        <div>
          <h1 className="font-serif text-xl font-semibold text-text-primary">
            {detail.pack.title}
          </h1>
          <div className="flex items-center gap-md mt-xs">
            <span className="font-sans text-xs text-text-muted">
              {detail.pack.moduleCount} modules \u00B7 {detail.pack.activityCount} activities
            </span>
            <span className={`font-sans text-sm font-semibold ${
              detail.pack.completeness >= 90 ? 'text-sage' :
              detail.pack.completeness >= 70 ? 'text-text-muted' : 'text-ember'
            }`}>
              {detail.pack.completeness}% complete
            </span>
          </div>
        </div>

        <button
          onClick={handleRecheck}
          disabled={rechecking}
          className="rounded-md bg-ember px-md py-sm font-sans text-[0.8rem] font-semibold text-text-inverse hover:bg-ember-hover disabled:opacity-50 transition-all duration-200"
        >
          {rechecking ? 'Rechecking...' : 'Run Integrity Check'}
        </button>
      </div>

      {/* Readiness banner */}
      <div className="mb-lg">
        <ReadinessBanner
          readinessState={detail.readinessState}
          errorCount={detail.pack.errorCount}
          warningCount={detail.pack.warningCount}
          errors={allErrors}
        />
      </div>

      {/* Tree view */}
      <PackDetailTree
        tree={detail.tree}
        onSelectNode={setSelectedNode}
      />

      {/* Field checklist slide-over */}
      {selectedNode && (
        <QAFieldChecklist
          docId={selectedNode.docId}
          docTitle={selectedNode.title}
          docType={selectedNode.docType}
          completeness={selectedNode.completeness}
          errors={selectedNode.errors}
          warnings={selectedNode.warnings}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
