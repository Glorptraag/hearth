import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { learningEntries } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { SUBJECTS } from '@/types';
import { enrichEntry } from '@/lib/ai/enrich';
import { rebuildSnapshot } from '@/lib/ai/snapshot-rebuild';

// CSV format expected:
// title,dateOccurred,subjects,description
// "Maths with blocks",2026-03-15,"mathematics,science","We counted and sorted..."

const VALID_SUBJECTS = new Set(SUBJECTS);

function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseSubjects(raw: string): string[] {
  return raw
    .split(/[,;]/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => VALID_SUBJECTS.has(s as (typeof SUBJECTS)[number]));
}

function validateDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return trimmed;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const body = await request.json() as { csv: string };
  if (!body.csv || typeof body.csv !== 'string') {
    return NextResponse.json({ error: 'csv field required' }, { status: 400 });
  }

  const lines = body.csv.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return NextResponse.json({ error: 'CSV must have header row + at least one data row' }, { status: 400 });
  }

  // Parse header to find column positions
  const header = parseCSVRow(lines[0]).map((h) => h.toLowerCase().trim());
  const titleIdx = header.indexOf('title');
  const dateIdx = header.indexOf('dateoccurred') !== -1 ? header.indexOf('dateoccurred') : header.indexOf('date');
  const subjectsIdx = header.indexOf('subjects');
  const descIdx = header.indexOf('description');

  if (titleIdx === -1) {
    return NextResponse.json({ error: 'CSV must have a "title" column' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];
  const saved: string[] = [];
  const errors: { row: number; reason: string }[] = [];

  const dataLines = lines.slice(1);

  for (let i = 0; i < dataLines.length; i++) {
    const fields = parseCSVRow(dataLines[i]);
    const title = fields[titleIdx]?.trim();
    if (!title) {
      errors.push({ row: i + 2, reason: 'Missing title' });
      continue;
    }

    const rawDate = dateIdx !== -1 ? fields[dateIdx] : undefined;
    const dateOccurred = rawDate ? validateDate(rawDate) ?? today : today;

    const rawSubjects = subjectsIdx !== -1 ? fields[subjectsIdx] : '';
    const subjects = rawSubjects ? parseSubjects(rawSubjects) : [];

    const description = descIdx !== -1 ? fields[descIdx]?.trim() || null : null;

    try {
      const [inserted] = await db.insert(learningEntries).values({
        familyId: family.id,
        title: title.slice(0, 200),
        description,
        dateOccurred,
        subjects: subjects.length > 0 ? subjects : null,
        status: 'complete',
        source: 'logger',
      }).returning({ id: learningEntries.id });

      saved.push(inserted.id);

      // Fire enrichment async (non-blocking)
      enrichEntry({ entryId: inserted.id, familyId: family.id }).catch(() => {});
    } catch {
      errors.push({ row: i + 2, reason: 'Database error' });
    }
  }

  // Rebuild snapshot once after all imports
  if (saved.length > 0) {
    rebuildSnapshot({ familyId: family.id, trigger: 'entry_saved' }).catch(() => {});
  }

  return NextResponse.json({
    imported: saved.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
