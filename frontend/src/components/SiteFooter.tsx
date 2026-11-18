import { Link } from 'react-router-dom'
import './SiteFooter.css'

const CONTACT = 'l.runiga@alustudent.com'

// Fixed to the bottom of every signed-in page, so it is always in view.
export default function SiteFooter() {
  return (
    <footer className="sitefoot">
      <span className="sitefoot__brand" aria-hidden="true">
        fasha<span className="sitefoot__dot" />
      </span>
      <span className="sitefoot__note">Fasha is currently a student-run demo.</span>
      <span className="sitefoot__contact">
        <span className="sitefoot__lead">Reach out at </span>
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
      </span>
      <span className="sitefoot__meta">
        <Link to="/privacy">Privacy</Link>
        <span className="sitefoot__year">· © {new Date().getFullYear()} Fasha</span>
      </span>
    </footer>
  )
}