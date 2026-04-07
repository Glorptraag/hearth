import type { StudioState, StudioAction, Selection } from './types';
import {
  createEmptyPack,
  createEmptyModule,
  createEmptyApproach,
  createEmptyActivity,
  createEmptyBadge,
  createEmptyStudioState,
} from './factories';

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function setNestedValue(obj: Record<string, unknown>, path: (string | number)[], value: unknown) {
  const clone = deepClone(obj);
  let current: unknown = clone;
  for (let i = 0; i < path.length - 1; i++) {
    current = (current as Record<string | number, unknown>)[path[i]];
  }
  (current as Record<string | number, unknown>)[path[path.length - 1]] = value;
  return clone;
}

function toggleInArray(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'LOAD':
      return action.payload;

    case 'SET_FIELD': {
      const updated = setNestedValue(
        state as unknown as Record<string, unknown>,
        action.path,
        action.value,
      );
      return updated as unknown as StudioState;
    }

    case 'TOGGLE_ARRAY_ITEM': {
      const current = action.path.reduce<unknown>(
        (obj, key) => (obj as Record<string | number, unknown>)[key],
        state,
      ) as string[];
      const toggled = toggleInArray(current, action.value);
      return setNestedValue(
        state as unknown as Record<string, unknown>,
        action.path,
        toggled,
      ) as unknown as StudioState;
    }

    case 'ADD_PACK':
      return { ...state, packs: [...state.packs, createEmptyPack(action.title)] };

    case 'ADD_STANDALONE_MODULE':
      return {
        ...state,
        standaloneModules: [...state.standaloneModules, createEmptyModule(action.title, true)],
      };

    case 'ADD_STANDALONE_ACTIVITY':
      return {
        ...state,
        standaloneActivities: [...state.standaloneActivities, createEmptyActivity(action.title)],
      };

    case 'ADD_MODULE': {
      const packs = deepClone(state.packs);
      packs[action.pi].modules.push(createEmptyModule(action.title));
      return { ...state, packs };
    }

    case 'ADD_APPROACH': {
      if (action.scope === 'pack') {
        const packs = deepClone(state.packs);
        packs[action.pi!].modules[action.mi].approaches.push(createEmptyApproach(action.title));
        return { ...state, packs };
      }
      const standaloneModules = deepClone(state.standaloneModules);
      standaloneModules[action.mi].approaches.push(createEmptyApproach(action.title));
      return { ...state, standaloneModules };
    }

    case 'ADD_ACTIVITY': {
      if (action.scope === 'pack') {
        const packs = deepClone(state.packs);
        packs[action.pi!].modules[action.mi].approaches[action.ai].activities.push(
          createEmptyActivity(action.title),
        );
        return { ...state, packs };
      }
      const standaloneModules = deepClone(state.standaloneModules);
      standaloneModules[action.mi].approaches[action.ai].activities.push(
        createEmptyActivity(action.title),
      );
      return { ...state, standaloneModules };
    }

    case 'ADD_BADGE': {
      const packs = deepClone(state.packs);
      packs[action.pi].badges.push(createEmptyBadge(action.title));
      return { ...state, packs };
    }

    case 'DELETE_SELECTED': {
      const sel = action.sel;
      if (sel.scope === 'pack') {
        const packs = deepClone(state.packs);
        if (sel.type === 'activity')
          packs[sel.pi].modules[sel.mi].approaches[sel.ai].activities.splice(sel.acti, 1);
        else if (sel.type === 'approach') packs[sel.pi].modules[sel.mi].approaches.splice(sel.ai, 1);
        else if (sel.type === 'module') packs[sel.pi].modules.splice(sel.mi, 1);
        else if (sel.type === 'badge') packs[sel.pi].badges.splice(sel.bi, 1);
        else if (sel.type === 'pack') packs.splice(sel.pi, 1);
        return { ...state, packs };
      }
      if (sel.scope === 'standalone-module') {
        const standaloneModules = deepClone(state.standaloneModules);
        if (sel.type === 'activity')
          standaloneModules[sel.mi].approaches[sel.ai].activities.splice(sel.acti, 1);
        else if (sel.type === 'approach') standaloneModules[sel.mi].approaches.splice(sel.ai, 1);
        else if (sel.type === 'module') standaloneModules.splice(sel.mi, 1);
        return { ...state, standaloneModules };
      }
      if (sel.scope === 'standalone-activity') {
        const standaloneActivities = deepClone(state.standaloneActivities);
        standaloneActivities.splice(sel.acti, 1);
        return { ...state, standaloneActivities };
      }
      return state;
    }

    default:
      return state;
  }
}

export function getSelectedDoc(state: StudioState, sel: Selection | null) {
  if (!sel) return null;

  if (sel.scope === 'pack') {
    const pack = state.packs[sel.pi];
    if (!pack) return null;
    if (sel.type === 'pack') return pack;
    if (sel.type === 'module') return pack.modules[sel.mi];
    if (sel.type === 'approach') return pack.modules[sel.mi]?.approaches[sel.ai];
    if (sel.type === 'activity') return pack.modules[sel.mi]?.approaches[sel.ai]?.activities[sel.acti];
    if (sel.type === 'badge') return pack.badges[sel.bi];
  }

  if (sel.scope === 'standalone-module') {
    const mod = state.standaloneModules[sel.mi];
    if (!mod) return null;
    if (sel.type === 'module') return mod;
    if (sel.type === 'approach') return mod.approaches[sel.ai];
    if (sel.type === 'activity') return mod.approaches[sel.ai]?.activities[sel.acti];
  }

  if (sel.scope === 'standalone-activity') {
    return state.standaloneActivities[sel.acti];
  }

  return null;
}

export function getNewSelectionAfterAdd(
  action: StudioAction,
  state: StudioState,
): Selection | null {
  switch (action.type) {
    case 'ADD_PACK':
      return { scope: 'pack', pi: state.packs.length - 1, type: 'pack' };
    case 'ADD_STANDALONE_MODULE':
      return { scope: 'standalone-module', mi: state.standaloneModules.length - 1, type: 'module' };
    case 'ADD_STANDALONE_ACTIVITY':
      return {
        scope: 'standalone-activity',
        acti: state.standaloneActivities.length - 1,
        type: 'activity',
      };
    case 'ADD_MODULE':
      return {
        scope: 'pack',
        pi: action.pi,
        mi: state.packs[action.pi].modules.length - 1,
        type: 'module',
      };
    case 'ADD_APPROACH': {
      if (action.scope === 'pack') {
        const mod = state.packs[action.pi!].modules[action.mi];
        return {
          scope: 'pack',
          pi: action.pi!,
          mi: action.mi,
          ai: mod.approaches.length - 1,
          type: 'approach',
        };
      }
      const sMod = state.standaloneModules[action.mi];
      return {
        scope: 'standalone-module',
        mi: action.mi,
        ai: sMod.approaches.length - 1,
        type: 'approach',
      };
    }
    case 'ADD_ACTIVITY': {
      if (action.scope === 'pack') {
        const approach = state.packs[action.pi!].modules[action.mi].approaches[action.ai];
        return {
          scope: 'pack',
          pi: action.pi!,
          mi: action.mi,
          ai: action.ai,
          acti: approach.activities.length - 1,
          type: 'activity',
        };
      }
      const sApproach = state.standaloneModules[action.mi].approaches[action.ai];
      return {
        scope: 'standalone-module',
        mi: action.mi,
        ai: action.ai,
        acti: sApproach.activities.length - 1,
        type: 'activity',
      };
    }
    case 'ADD_BADGE':
      return {
        scope: 'pack',
        pi: action.pi,
        bi: state.packs[action.pi].badges.length - 1,
        type: 'badge',
      };
    default:
      return null;
  }
}

export const INITIAL_STATE: StudioState = createEmptyStudioState();
