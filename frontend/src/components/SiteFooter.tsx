import { Link } from 'react-router-dom'
import Icon from './Icon'
import './SiteFooter.css'

const CONTACT = 'l.runiga@alustudent.com'

// Fixed to the bottom of every signed-in page, so it is always in view.
export default function SiteFooter() {
  return (
    <footer className="sitefoot">
      <p className="sitefoot__notice">
        Fasha is currently a student-run demo.
      </p>
      <div className="sitefoot__links">
        <span className="sitefoot__contact">
          <Icon name="review" size={18} />
          <span>
            <span className="sitefoot__lead">Reach out at </span>
            <a href={`mailto:${CONTACT}`}>{CONTACT}</a>
          </span>
        </span>
        <Link to="/privacy">Privacy policy</Link>
        <span className="sitefoot__year">© {new Date().getFullYear()} Fasha</span>
      </div>
    </footer>
  )
}