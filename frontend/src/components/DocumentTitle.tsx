import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const TITLES: { path: string; title: string }[] = [
  { path: '/discover', title: 'Discover' },
  { path: '/activity', title: 'My activity' },
  { path: '/portfolio', title: 'My portfolio' },
  { path: '/profile', title: 'My profile' },
  { path: '/initiatives/new', title: 'Propose an initiative' },
  { path: '/initiatives', title: 'My initiatives' },
  { path: '/opportunities/', title: 'Opportunity' },
  { path: '/check-in', title: 'Check in' },
  { path: '/notifications', title: 'Notifications' },
  { path: '/manage/opportunities/new', title: 'Create an opportunity' },
  { path: '/manage/opportunities', title: 'Opportunities' },
  { path: '/manage/attendance', title: 'Attendance' },
  { path: '/manage/review', title: 'Deliverables' },
  { path: '/manage', title: 'Overview' },
  { path: '/admin/approvals', title: 'Approvals' },
  { path: '/admin/users', title: 'Users' },
  { path: '/admin/activity', title: 'Activity' },
  { path: '/admin', title: 'Oversight' },
  { path: '/privacy', title: 'Privacy' },
  { path: '/signin', title: 'Sign in' },
  { path: '/signup', title: 'Create an account' },
  { path: '/p/', title: 'Volunteer portfolio' },
]

function titleFor(pathname: string): string {
  const match = TITLES.find(entry => pathname.startsWith(entry.path))

  return match ? `${match.title} · Fasha` : 'Fasha'
}

export default function DocumentTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = titleFor(pathname)
  }, [pathname])

  return null
}
