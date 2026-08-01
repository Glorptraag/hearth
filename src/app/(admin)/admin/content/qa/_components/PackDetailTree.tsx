'use client';

import { useState, type ComponentType } from 'react';
import type { TreeNode } from '@/lib/content-qa/run';
import {
  Package, Books, Target, Note, Medal,
  XCircle, WarningCircle, CheckCircle, CaretDown,
} from '@/components/icons';

type IconC = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

interface Props {
  tree: TreeNode[];
  onSelectNode: (node: TreeNode) => void;
}

const DOC_ICON: Record<string, IconC> = {
  pack:     Package,
  module:   Books,
  approach: Target,
  activity: Note,
  badge:    Medal,
};

function statusMeta(node: TreeNode): { Icon: IconC; colour: string } {
  if (node.errors.length > 0)   return { Icon: XCircle,      colour: 'text-red-400' };
  if (node.warnings.length > 0) return { Icon: WarningCircle, colour: 'text-amber-400' };
  return { Icon: CheckCircle, colour: 'text-sage' };
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
        className={`flex items-center gap-sm px-md py-xs hover:bg-surface-hover transition-colors duration-[var(--motion-quick)] cursor-pointer ${
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
            className="text-text-muted hover:text-text-primary w-4 flex justify-center flex-shrink-0"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <CaretDown size={12} className={`transition-transform duration-[var(--motion-quick)] ${expanded ? '' : '-rotate-90'}`} aria-hidden="true" />
          </button>
        )}
        {!hasChildren && <span className="w-4 flex-shrink-0" />}

        <span className="flex-shrink-0 inline-flex text-text-secondary" aria-hidden="true">
          {(() => {
            const Icon = DOC_ICON[node.docType] ?? Note;
            return <Icon size={14} />;
          })()}
        </span>

        <span className="flex-shrink-0 inline-flex" aria-hidden="true">
          {(() => {
            const { Icon, colour } = statusMeta(node);
            return <span className={colour}><Icon size={14} /></span>;
          })()}
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
