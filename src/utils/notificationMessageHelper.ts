import { toBengaliNumber } from './bengali';

/**
 * Formats a list of week numbers with Bengali numerals, applying "তম" strictly to the last number.
 * 
 * Rules:
 * - Single week: "৩০তম"
 * - Two weeks: "২৪ ও ২৫তম"
 * - Three weeks: "২৬, ২৭ ও ২৮তম"
 * - Four or more: "২১, ২২, ২৩, ২৪ ও ২৫তম"
 * - Never: "২৫তম, ২৬তম, ২৭তম ও ২৮তম"
 */
export function formatWeekNumbersList(weeks: number[]): string {
  if (!weeks || weeks.length === 0) return '';
  const sorted = Array.from(new Set(weeks)).sort((a, b) => a - b);
  const bnWeeks = sorted.map((w) => toBengaliNumber(w));

  if (bnWeeks.length === 1) {
    return `${bnWeeks[0]}তম`;
  }
  if (bnWeeks.length === 2) {
    return `${bnWeeks[0]} ও ${bnWeeks[1]}তম`;
  }

  const allExceptLastTwo = bnWeeks.slice(0, bnWeeks.length - 2);
  const secondLast = bnWeeks[bnWeeks.length - 2];
  const last = bnWeeks[bnWeeks.length - 1];

  return `${allExceptLastTwo.join(', ')}, ${secondLast} ও ${last}তম`;
}

export interface PaymentNotificationParams {
  clearedArrearWeeks?: number[];
  remainingDueWeeks?: number[];
  advanceWeeks?: number[];
}

/**
 * Builds the exact weekly payment notification message based strictly on:
 * - clearedArrearWeeks: পুরোনো বকেয়া সপ্তাহ যা পরিশোধ হয়েছে
 * - remainingDueWeeks: যে সপ্তাহগুলো এখনো বকেয়া রয়ে গেছে
 * - advanceWeeks: বর্তমান বা অতিরিক্ত টাকার কারণে Advance জমা হওয়া ভবিষ্যৎ সপ্তাহ
 *
 * Rules:
 * 1. Only advance:
 *    "আপনার ২৬, ২৭ ও ২৮তম সপ্তাহের টাকা অগ্রিম জমা হয়েছে। ধন্যবাদ।"
 * 2. Only arrears:
 *    "আপনার ২৪ ও ২৫তম সপ্তাহের টাকা বকেয়া রয়েছে। নির্দিষ্ট সময়ে আপনার টাকা জমা দিন।"
 * 3. Arrears cleared + advance:
 *    "আপনার ২৪ ও ২৫তম সপ্তাহের বকেয়া পরিশোধ হয়েছে। একইসাথে ২৬, ২৭ ও ২৮তম সপ্তাহের টাকা অগ্রিম জমা হয়েছে।"
 * 4. One future week:
 *    "আপনার ৩০তম সপ্তাহের টাকা অগ্রিম জমা হয়েছে। ধন্যবাদ।"
 * 5. Partial arrears:
 *    "আপনার ২১ ও ২২তম সপ্তাহের বকেয়া পরিশোধ হয়েছে। ২৩, ২৪ ও ২৫তম সপ্তাহের টাকা বকেয়া রয়েছে।"
 * 6. All arrears cleared + advance:
 *    "আপনার ২১, ২২, ২৩, ২৪ ও ২৫তম সপ্তাহের বকেয়া পরিশোধ হয়েছে। একইসাথে ২৬ ও ২৭তম সপ্তাহের টাকা অগ্রিম জমা হয়েছে।"
 * 7. "সাপ্তাহিক" শব্দটি কখনো ব্যবহার হবে না।
 */
export function buildWeeklyPaymentNotificationMessage(params: PaymentNotificationParams): string {
  const clearedArrears = (params.clearedArrearWeeks || []).filter((w) => w > 0).sort((a, b) => a - b);
  const remainingDue = (params.remainingDueWeeks || []).filter((w) => w > 0).sort((a, b) => a - b);
  const advance = (params.advanceWeeks || []).filter((w) => w > 0).sort((a, b) => a - b);

  const hasCleared = clearedArrears.length > 0;
  const hasRemaining = remainingDue.length > 0;
  const hasAdvance = advance.length > 0;

  // Case A: Cleared Arrears + Advance
  if (hasCleared && hasAdvance) {
    const clearedStr = formatWeekNumbersList(clearedArrears);
    const advanceStr = formatWeekNumbersList(advance);
    return `আপনার ${clearedStr} সপ্তাহের বকেয়া পরিশোধ হয়েছে। একইসাথে ${advanceStr} সপ্তাহের টাকা অগ্রিম জমা হয়েছে।`;
  }

  // Case B: Cleared Arrears + Still Remaining Due (Partial Arrears Cleared)
  if (hasCleared && hasRemaining) {
    const clearedStr = formatWeekNumbersList(clearedArrears);
    const dueStr = formatWeekNumbersList(remainingDue);
    return `আপনার ${clearedStr} সপ্তাহের বকেয়া পরিশোধ হয়েছে। ${dueStr} সপ্তাহের টাকা বকেয়া রয়েছে।`;
  }

  // Case C: Cleared Arrears only (All arrears cleared, no advance)
  if (hasCleared && !hasAdvance && !hasRemaining) {
    const clearedStr = formatWeekNumbersList(clearedArrears);
    return `আপনার ${clearedStr} সপ্তাহের বকেয়া পরিশোধ হয়েছে। ধন্যবাদ।`;
  }

  // Case D: Only Advance (can be one future week or multiple advance weeks)
  if (hasAdvance && !hasCleared && !hasRemaining) {
    const advanceStr = formatWeekNumbersList(advance);
    return `আপনার ${advanceStr} সপ্তাহের টাকা অগ্রিম জমা হয়েছে। ধন্যবাদ।`;
  }

  // Case E: Only Arrears / Remaining Due (e.g. marked due or inquiry)
  if (hasRemaining && !hasCleared && !hasAdvance) {
    const dueStr = formatWeekNumbersList(remainingDue);
    return `আপনার ${dueStr} সপ্তাহের টাকা বকেয়া রয়েছে। নির্দিষ্ট সময়ে আপনার টাকা জমা দিন।`;
  }

  // Case F: Fallback if advance + remaining due somehow coexists without cleared arrears
  if (hasAdvance && hasRemaining) {
    const advanceStr = formatWeekNumbersList(advance);
    const dueStr = formatWeekNumbersList(remainingDue);
    return `আপনার ${advanceStr} সপ্তাহের টাকা অগ্রিম জমা হয়েছে। তবে ${dueStr} সপ্তাহের টাকা বকেয়া রয়েছে।`;
  }

  return 'আপনার জমার তথ্য সফলভাবে সংরক্ষিত হয়েছে। ধন্যবাদ।';
}

/**
 * Derives cleared arrears, remaining due weeks, and advance weeks purely by inspecting
 * the member's existing processed weeks before and after a payment is applied.
 *
 * It uses the existing processMember52Weeks output as the single source of truth:
 * - Cleared Arrears: weeks <= currentWeek that were due before, but are now paid.
 * - Remaining Due: weeks <= currentWeek that are due after the payment.
 * - Advance: weeks > currentWeek that are paid (advance).
 */
export function generateNotificationFromLedgerState(
  beforeWeeks: Array<{ weekNumber: number; status: string }>,
  afterWeeks: Array<{ weekNumber: number; status: string }>,
  currentWeek: number
): string {
  const dueBefore = new Set<number>();
  for (const w of beforeWeeks) {
    if (w.weekNumber <= currentWeek && w.status === 'due') {
      dueBefore.add(w.weekNumber);
    }
  }

  const clearedArrears: number[] = [];
  const remainingDue: number[] = [];
  const advanceWeeks: number[] = [];

  for (const w of afterWeeks) {
    if (w.weekNumber <= currentWeek) {
      if (w.status === 'due') {
        remainingDue.push(w.weekNumber);
      } else if (w.status === 'paid' && dueBefore.has(w.weekNumber)) {
        clearedArrears.push(w.weekNumber);
      }
    } else if (w.weekNumber > currentWeek && (w.status === 'advance' || w.status === 'paid')) {
      advanceWeeks.push(w.weekNumber);
    }
  }

  return buildWeeklyPaymentNotificationMessage({
    clearedArrearWeeks: clearedArrears,
    remainingDueWeeks: remainingDue,
    advanceWeeks: advanceWeeks,
  });
}

/**
 * Returns the exact notification title based on weekly payment params:
 * 1. Due / Arrears: "সাপ্তাহিক জমা বকেয়া রয়েছে"
 * 2. Advance deposit: "অগ্রিম জমা সফল হয়েছে"
 * 3. Successful weekly deposit / cleared arrears: "সাপ্তাহিক জমা সফল হয়েছে"
 */
export function getWeeklyPaymentNotificationTitle(params: PaymentNotificationParams): string {
  const clearedArrears = (params.clearedArrearWeeks || []).filter((w) => w > 0);
  const remainingDue = (params.remainingDueWeeks || []).filter((w) => w > 0);
  const advance = (params.advanceWeeks || []).filter((w) => w > 0);

  // If there are remaining due weeks and NO arrears were cleared in this transaction, it is a due notification
  if (remainingDue.length > 0 && clearedArrears.length === 0) {
    return 'সাপ্তাহিক জমা বকেয়া রয়েছে';
  }

  // If only advance weeks are present (no arrears cleared and no remaining due)
  if (advance.length > 0 && clearedArrears.length === 0 && remainingDue.length === 0) {
    return 'অগ্রিম জমা সফল হয়েছে';
  }

  // When weekly payment is successful or arrears are cleared:
  return 'সাপ্তাহিক জমা সফল হয়েছে';
}

/**
 * Determines notification title from notification body text if explicit params are not available:
 * - If body indicates due / arrears: "সাপ্তাহিক জমা বকেয়া রয়েছে"
 * - If body indicates advance deposit: "অগ্রিম জমা সফল হয়েছে"
 * - Default / successful deposit: "সাপ্তাহিক জমা সফল হয়েছে"
 */
export function deriveNotificationTitleFromMessage(message: string): string {
  const text = (message || '').trim();
  if (!text) return 'সাপ্তাহিক জমা সফল হয়েছে';

  const isPureDue =
    (text.includes('বকেয়া রয়েছে') ||
      text.includes('বকেয়া রয়েছে') ||
      text.includes('টাকা এখনও জমা হয়নি') ||
      text.includes('বকেয়া পরিশোধ করুন') ||
      text.includes('বকেয়া পরিশোধ করুন')) &&
    !text.includes('বকেয়া পরিশোধ হয়েছে') &&
    !text.includes('বকেয়া পরিশোধ হয়েছে');

  if (isPureDue) {
    return 'সাপ্তাহিক জমা বকেয়া রয়েছে';
  }

  const isAdvance =
    (text.includes('অগ্রিম জমা হয়েছে') ||
      text.includes('অগ্রিম জমা আছে')) &&
    !text.includes('বকেয়া') &&
    !text.includes('বকেয়া');

  if (isAdvance) {
    return 'অগ্রিম জমা সফল হয়েছে';
  }

  return 'সাপ্তাহিক জমা সফল হয়েছে';
}

export function generateNotificationTitleFromLedgerState(
  beforeWeeks: Array<{ weekNumber: number; status: string }>,
  afterWeeks: Array<{ weekNumber: number; status: string }>,
  currentWeek: number
): string {
  const dueBefore = new Set<number>();
  for (const w of beforeWeeks) {
    if (w.weekNumber <= currentWeek && w.status === 'due') {
      dueBefore.add(w.weekNumber);
    }
  }

  const clearedArrears: number[] = [];
  const remainingDue: number[] = [];
  const advanceWeeks: number[] = [];

  for (const w of afterWeeks) {
    if (w.weekNumber <= currentWeek) {
      if (w.status === 'due') {
        remainingDue.push(w.weekNumber);
      } else if (w.status === 'paid' && dueBefore.has(w.weekNumber)) {
        clearedArrears.push(w.weekNumber);
      }
    } else if (w.weekNumber > currentWeek && (w.status === 'advance' || w.status === 'paid')) {
      advanceWeeks.push(w.weekNumber);
    }
  }

  return getWeeklyPaymentNotificationTitle({
    clearedArrearWeeks: clearedArrears,
    remainingDueWeeks: remainingDue,
    advanceWeeks: advanceWeeks,
  });
}

