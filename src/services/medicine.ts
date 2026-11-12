import type { CfMed, Medicine } from '../types';

/** Converts a stored medicine into an editor row (3-slot frequencies widen to 4 slots). */
export function cfNormalize(m: Medicine): CfMed {
  const f = String(m.frequency || '');
  const bits = f.split('-');
  const isPattern = bits.length === 3 || bits.length === 4;
  return {
    name: m.name,
    dosage: m.dosage || '',
    frequency: bits.length === 4 ? f : bits.length === 3 ? [bits[0], bits[1], bits[2], '0'].join('-') : '0-0-0-0',
    customMode: !isPattern && !!f,
    customValue: !isPattern ? f : '',
    mealTiming: m.mealTiming || '',
    instructions: m.instructions || '',
    unit: m.unit || 'Days',
    duration: m.duration !== '' && m.duration != null ? String(m.duration) : '3',
  };
}

/** Converts an editor row back into a stored medicine. */
export function cfPersist(m: CfMed): Medicine {
  return {
    name: m.name,
    dosage: m.dosage,
    frequency: m.customMode ? m.customValue || 'Custom' : m.frequency,
    duration: m.duration ? +m.duration : '',
    unit: m.unit,
    mealTiming: m.mealTiming || '',
    instructions: m.instructions || '',
  };
}

export function cfNew(name: string, dose?: string): CfMed {
  return { name, dosage: dose || '1 tablet', frequency: '0-0-0-0', customMode: false, customValue: '', duration: '3', unit: 'Days', mealTiming: '', instructions: '' };
}

export function cfSummary(m: CfMed): string {
  return (
    m.name + ' · ' + (m.dosage || '—') + ' · ' + (m.customMode ? m.customValue || 'Custom' : m.frequency) + ' · ' + m.duration + ' ' + m.unit +
    (m.mealTiming ? ' · ' + m.mealTiming : '') + (m.instructions ? ' · ' + m.instructions : '')
  );
}

export const durationText = (m: Medicine) => (m.duration ? m.duration + ' ' + m.unit : '—');
