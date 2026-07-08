import { retrievePedagogyChunks } from '@/lib/pedagogy/retrieval';

const TOKEN_BUDGET = 2000;

interface PedagogyContextOpts {
  entryTitle: string;
  entryDescription: string;
  framework: string;
  childAges?: number[];
  capabilityThreads?: string[];
}

export interface PedagogySource {
  id: string;
  layer: string;
  pedagogyKey: string;
  metadata: Record<string, unknown>;
}

export interface PedagogyContextWithSources {
  prompt: string;
  sources: PedagogySource[];
}

export async function buildPedagogyContextWithSources(
  opts: PedagogyContextOpts
): Promise<PedagogyContextWithSources> {
  if (process.env.PEDAGOGY_KB_ENABLED !== 'true') {
    return { prompt: fallbackContext(opts.framework), sources: [] };
  }

  try {
    const queryText = [opts.entryTitle, (opts.entryDescription ?? '').slice(0, 200)]
      .filter(Boolean)
      .join(': ');

    const ageMin = opts.childAges?.length ? Math.min(...opts.childAges) : 0;
    const ageMax = opts.childAges?.length ? Math.max(...opts.childAges) : 18;

    const result = await retrievePedagogyChunks({
      pedagogyKey: opts.framework,
      capabilityThreads: opts.capabilityThreads ?? [],
      ageRange: { min: ageMin, max: ageMax },
      situationalSignals: [],
      loggerEntryText: queryText,
    });

    if (result.fallbackUsed || result.chunks.length === 0) {
      return { prompt: fallbackContext(opts.framework), sources: [] };
    }

    // Enforce token budget — estimate tokens as text.length / 4
    const budgetChunks = [];
    let tokenEstimate = 0;
    for (const chunk of result.chunks) {
      const chunkTokens = Math.ceil(chunk.text.length / 4);
      if (tokenEstimate + chunkTokens > TOKEN_BUDGET) break;
      budgetChunks.push(chunk);
      tokenEstimate += chunkTokens;
    }

    if (budgetChunks.length === 0) {
      return { prompt: fallbackContext(opts.framework), sources: [] };
    }

    const isEclectic = opts.framework === 'eclectic';

    const refs = budgetChunks
      .map((c) =>
        isEclectic
          ? `<reference layer="${c.layer}" id="${c.id}" tradition="${c.pedagogyKey}">\n${c.text}\n</reference>`
          : `<reference layer="${c.layer}" id="${c.id}">\n${c.text}\n</reference>`
      )
      .join('\n\n');

    const wrapper = isEclectic
      ? `The family draws on multiple pedagogical traditions rather than following a single approach. The following reference material has been retrieved across those traditions as relevant to this entry. Interpret each reference through whichever tradition's lens best fits the moment, and name the tradition when attributing specific guidance back to its source. Where a contraindication from one tradition tensions with another tradition's suggestion, surface the tension honestly rather than resolving it silently.`
      : `The family follows the ${opts.framework} pedagogical approach. The following reference material has been retrieved as relevant to this entry. Use it to inform interpretation and suggestions, attributing specific guidance back to its source where appropriate.`;

    const prompt = `<pedagogy_reference_material>
${wrapper}

${refs}

</pedagogy_reference_material>`;

    const sources: PedagogySource[] = budgetChunks.map((c) => ({
      id: c.id,
      layer: c.layer,
      pedagogyKey: c.pedagogyKey,
      metadata: c.metadata,
    }));

    return { prompt, sources };
  } catch (error) {
    console.error('[pedagogy-context] Retrieval failed, using fallback:', error);
    return { prompt: fallbackContext(opts.framework), sources: [] };
  }
}

export async function buildPedagogyContext(
  opts: PedagogyContextOpts
): Promise<string> {
  const { prompt } = await buildPedagogyContextWithSources(opts);
  return prompt;
}

function fallbackContext(framework: string): string {
  return `PEDAGOGY CONTEXT:\nFamily follows the ${framework} approach.`;
}
