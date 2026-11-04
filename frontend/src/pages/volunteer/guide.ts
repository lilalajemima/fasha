import type { HelpNote } from '../../components/HelpButton'

/**
 * What a volunteer needs to know, in one place. This used to be printed onto
 * the pages themselves as tinted cards and stray paragraphs; it lives behind
 * the help button now, so the pages only carry the work.
 */
export const VOLUNTEER_GUIDE: HelpNote[] = [
  {
    question: 'Where do opportunities come from?',
    answer: 'Local organisations post directly. Neighbours can propose initiatives too, and those appear in Discover once a community reviewer approves them.',
  },
  {
    question: 'Why is this one at the top of Discover?',
    answer: 'Discover is ordered by how well an opportunity matches the skills and interests on your profile. Keep those up to date and the order follows you.',
  },
  {
    question: 'What happens when I apply?',
    answer: 'The organiser sees your name, your profile and the motivation you wrote. They accept or reject it, usually within a few days, and you can withdraw at any point before the day.',
  },
  {
    question: 'How do I check in at an event?',
    answer: 'Open check in on your phone at the event and scan the code the organiser is showing, or type it. It changes every 30 seconds, so it has to be done there rather than from home. Scan again when you leave.',
  },
  {
    question: 'What about work with nothing to turn up to?',
    answer: 'Virtual work is measured by what you send in. Put a link to what you produced under Deliverables and the organiser reviews it.',
  },
  {
    question: 'When do hours reach my portfolio?',
    answer: 'After the organiser confirms them, either by closing your check out or by accepting your deliverable. Nothing pending or rejected is counted.',
  },
  {
    question: 'Who can see my portfolio?',
    answer: 'Anybody with the link. It shows your name and your verified contributions only, never your email, your motivation letters or anything you have not had confirmed.',
  },
  {
    question: 'Can I run something myself?',
    answer: 'Yes. Propose an initiative and it waits for a community reviewer before it appears in Discover. Until then it sits in My initiatives as awaiting approval, and if it is turned down the reviewer leaves a note saying why.',
  },
]
