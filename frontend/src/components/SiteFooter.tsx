import { Link } from 'react-router-dom'
import './SiteFooter.css'

const CONTACT = 'l.runiga@alustudent.com'

export default function SiteFooter() {
  return (
    <footer className="sitefoot">
      <p>
        Fasha is currently a student-run demo. Reach out at{' '}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>
      <div className="sitefoot__meta">
        <Link to="/privacy">Privacy</Link>
        <span aria-hidden="true">·</span>
        <span>© {new Date().getFullYear()} Fasha</span>
      </div>
    </footer>
  )
}