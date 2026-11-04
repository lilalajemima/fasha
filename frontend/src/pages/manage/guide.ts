import type { HelpNote } from '../../components/HelpButton'

/**
 * What somebody running opportunities needs to know, in one place, the way the
 * volunteer guide is. The pages used to explain themselves in paragraphs
 * between the controls; this is where that went.
 */
export const ORGANISER_GUIDE: HelpNote[] = [
  {
    question: 'What counts as active?',
    answer: 'A published opportunity that has not finished yet. Anything still in review, or already over, is left out of the count on Overview.',
  },
  {
    question: 'What is on the calendar?',
    answer: 'A filled dot is the day the work happens, a hollow dot is the day applications close. Virtual work shows its deliverable deadline as the day it happens. The calendar only shows what already exists; use Create opportunity to add anything.',
  },
  {
    question: 'Open or closed?',
    answer: 'Open means applications are still being taken. Closed means the deadline has passed or the work is over. In review and Not approved only happen to initiatives proposed by volunteers.',
  },
  {
    question: 'Who approves what?',
    answer: 'An organisation account publishes straight to Discover with no review step. An initiative proposed by a volunteer waits for a community reviewer, and shows as In review until they decide.',
  },
  {
    question: 'How do I review applicants?',
    answer: 'Select any row in the opportunities table. That opens the applicants for that one opportunity, where you accept or reject each person. A decision is final for that application, so read the motivation first.',
  },
  {
    question: 'What does accepting somebody do?',
    answer: 'It gives them a place, so they appear on the attendance register for the event and can check themselves in.',
  },
  {
    question: 'What is a deliverable?',
    answer: 'The proof a volunteer sends in for work with no register to sign, which is how virtual work is measured. Accepting one credits that work to their public portfolio; rejecting leaves the portfolio untouched.',
  },
  {
    question: 'How does check in work?',
    answer: 'Open check in and show the screen. The code changes every 30 seconds, so it has to be scanned at the event rather than passed on. The same code checks people out when they leave.',
  },
  {
    question: 'Somebody’s phone will not scan.',
    answer: 'Find them in the register and check them in yourself. It is recorded as by hand rather than scanned, and the same button closes them off at the end.',
  },
  {
    question: 'Why is my virtual work not in Attendance?',
    answer: 'Attendance is only for work people turn up to. Virtual work is measured by what volunteers submit, on the Deliverables page.',
  },
  {
    question: 'How do I keep a copy of a register?',
    answer: 'Export CSV opens in Excel or Sheets. Print or PDF gives you the register on its own, without the rest of the page, for a report.',
  },
]
