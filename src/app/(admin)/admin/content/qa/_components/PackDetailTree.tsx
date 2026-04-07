'use client';

import { useState } from 'react';
import type { TreeNode } from '@/lib/content-qa/run';

interface Props {
  tree: TreeNode[];
  onSelectNode: (node: TreeNode) => void;
}

const DOC_EMOJI: Record<string, string> = {
  pack: '\uD83D\uDCE6',     // 📦
  module: '\uD83D\uDCDA',   // 📚
  approach: '\uD83C\uDFAF', // 🎯
  activity: '\uD83D\uDCDD', // 📝
  badge: '\uD83C\uDFC5',    // 🏅
};

function statusIcon(node: TreeNode): string {
  if (node.errors.length > 0) return '\u274C'; // ❌
  if (node.warnings.length > 0) return '\u26A0\uFE0F'; // ⚠️
  return '\u2705'; // ✅
}

function completenessColor(pct: number): string {
  if (pct >= 90) return 'text-sage';
  if (pct >= 70) return 'text-text-muted';
  return 'text-ember';
}

export default function PackDetailTree({ tree, onSelectNode }: Props) {
  return (
    <div className="rounded-lg border border-border-subtle overflow-hidden">
      {tree.map((node, i) => (
        <TreeRow
          key={node.docId}
          node={node}
          depth={0}
          isLast={i === tree.length - 1}
          onSelectNode={onSelectNode}
        />
      ))}
    </div>
  );
}

function TreeRow({
  node,
  depth,
  isLast,
  onSelectNode,
}: {
  node: TreeNode;
  depth: number;
  isLast: boolean;
  onSelectNode: (node: TreeNode) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const indent = depth * 24;

  return (
    <>
      <div
        className={`flex items-center gap-sm px-md py-xs hover:bg-surface-hover transition-colors duration-200 cursor-pointer ${
          !isLast ? 'border-b border-border-subtle' : ''
        }`}
        style={{ paddingLeft: `${16 + indent}px` }}
        onClick={() => onSelectNode(node)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="font-sans text-xs text-text-muted hover:text-text-primary w-4 text-center flex-shrink-0"
          >
            {expanded ? '\u25BE' : '\u25B8'}
          </button>
        )}
        {!hasChildren && <span className="w-4 flex-shrink-0" />}

        <span className="text-sm flex-shrink-0">
          {DOC_EMOJI[node.docType] ?? ''}
        </span>

        <span className="text-xs flex-shrink-0">
          {statusIcon(node)}
        </span>

        <span className="font-serif text-sm text-text-primary truncate flex-1">
          {node.title}
        </span>

        <span className={`font-sans text-xs font-semibold ${completenessColor(node.completeness)} flex-shrink-0`}>
          {node.completeness}%
        </span>

        {(node.errors.length > 0 || node.warnings.length > 0) && (
          <span className="font-sans text-[0.6rem] text-text-muted flex-shrink-0">
            {node.errors.length > 0 && (
              <span className="text-ember">{node.errors.length}E</span>
            )}
            {node.errors.length > 0 && node.warnings.length > 0 && ' '}
            {node.warnings.length > 0 && (
              <span>{node.warnings.length}W</span>
            )}
          </span>
        )}
      </div>

      {expanded && hasChildren && (
        <>
          {node.children.map((child, i) => (
            <TreeRow
              key={child.docId}
              node={child}
              depth={depth + 1}
              isLast={i === node.children.length - 1 && isLast}
              onSelectNode={onSelectNode}
            />
          ))}
        </>
      )}
    </>
  );
}
