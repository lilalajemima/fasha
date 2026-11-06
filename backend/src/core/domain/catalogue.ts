/**
 * The vocabulary Fasha matches on.
 *
 * Matching compares a volunteer's tags with an opportunity's tags, so both
 * sides have to use the same words. When either side could type its own,
 * "Graphic design", "graphics" and "designing posters" were three different
 * tags and the score meant nothing. Everything in the app now picks from here,
 * and the server refuses anything that is not in these lists.
 */

export const INTERESTS = [
  'Healthcare',
  'Climate and environment',
  'Education',
  'Arts and culture',
  'Entrepreneurship',
  "Women's empowerment",
  'Youth and children',
  'Sports and recreation',
  'Technology and digital skills',
  'Community infrastructure',
  'Food security and agriculture',
  'Disability inclusion',
] as const

export const SKILLS = [
  'Web development',
  'Mobile app development',
  'Graphic design',
  'Photography',
  'Videography',
  'Video and image editing',
  'Social media and communications',
  'Writing and translation',
  'Teaching and tutoring',
  'Public speaking and facilitation',
  'Event planning',
  'Fundraising and grant writing',
  'Data entry and analysis',
  'First aid',
  'Construction and manual work',
  'Gardening and planting',
  'Cooking and catering',
  'Accounting and bookkeeping',
  'Project management',
  'Driving and logistics',
] as const

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const
export const PARTS = ['MORNING', 'AFTERNOON', 'EVENING'] as const

/**
 * Availability is stored as tokens such as SAT_MORNING rather than as a
 * sentence, so it can be read by the app as well as by a person. The order is
 * the order of the week, which is the order the grid draws.
 */
export const AVAILABILITY_SLOTS: string[] = DAYS.flatMap(day =>
  PARTS.map(part => `${day}_${part}`),
)

export function isInterest(value: string): boolean {
  return (INTERESTS as readonly string[]).includes(value)
}

export function isSkill(value: string): boolean {
  return (SKILLS as readonly string[]).includes(value)
}

export function isAvailabilitySlot(value: string): boolean {
  return AVAILABILITY_SLOTS.includes(value)
}
