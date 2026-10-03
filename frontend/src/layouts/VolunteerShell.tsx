import Shell from './Shell'

export default function VolunteerShell() {
  return (
    <Shell
      workspace="Volunteer"
      strapline="Your community, connected"
      cta={{ to: '/initiatives/new', label: 'Propose an initiative' }}
      items={[
        { to: '/discover', label: 'Discover' },
        { to: '/activity', label: 'My activity' },
        { to: '/portfolio', label: 'My portfolio' },
        { to: '/profile', label: 'My profile' },
        { to: '/initiatives', label: 'My initiatives', end: true },
      ]}
    />
  )
}
