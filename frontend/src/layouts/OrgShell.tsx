import Shell from './Shell'

export default function OrgShell() {
  return (
    <Shell
      workspace="Green Neighbourhood"
      strapline="Organisation workspace"
      cta={{ to: '/org/opportunities/new', label: 'Create opportunity' }}
      items={[
        { to: '/org', label: 'Overview', end: true },
        { to: '/org/opportunities', label: 'Opportunities', end: true },
        { to: '/org/review', label: 'Review workspace' },
        { to: '/org/attendance', label: 'Attendance' },
      ]}
    />
  )
}