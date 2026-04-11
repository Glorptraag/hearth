import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { retrievePedagogyChunks } from '@/lib/pedagogy/retrieval';

const retrievalSchema = z.object({
  pedagogyKey: z.string(),
  capabilityThreads: z.array(z.string()).default([]),
  ageRange: z.object({ min: z.number(), max: z.number() }),
  activityType: z.string().optional(),
  situationalSignals: z.array(z.string()).default([]),
  loggerEntryText: z.string().optional(),
  topN: z.number().min(1).max(20).optional(),
});

export async function POST(request: NextRequest) {
  const secret = process.env.PEDAGOGY_RETRIEVAL_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'Server misconfiguration: missing auth secret' },
      { status: 500 }
    );
  }
  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = retrievalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await retrievePedagogyChunks(parsed.data);
  return NextResponse.json(result);
}
