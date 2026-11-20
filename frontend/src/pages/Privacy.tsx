import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { demoAccounts } from '../lib/demo'
import './Privacy.css'

const UPDATED = '20 November 2026'

/**
 * What Fasha does with people's information, in the words somebody would use
 * to ask. It is reachable without an account, because the people who most
 * need it are the ones deciding whether to make one.
 */
export default function Privacy() {
  return (
    <div className="policy">
      <header className="policy__head">
        <Link to="/signin" aria-label="Back to Fasha"><Logo size={26} /></Link>
        <span className="policy__updated">Last updated {UPDATED}</span>
      </header>

      <main className="policy__body">
        <h1>Privacy</h1>

        <p className="policy__lead">
          Fasha is a student project and the working prototype for my final-year capstone at the
          African Leadership University. It is currently being tested in one sector of Kigali and
          is not yet a finished service. This page explains what information Fasha collects, who
          can see it, where it is stored and how you can change or remove it.
        </p>

        <div className="policy__note">
          <h2>You don&rsquo;t have to share your information</h2>
          <p>
            If you want to explore Fasha without using your personal information, you can use the
            demo accounts on the sign-in page. These are shared accounts with made-up people and
            events. Anything you do in these accounts is not treated as real participation.
          </p>
          {demoAccounts ? (
            <p className="policy__demo">
              Volunteer · {demoAccounts.volunteer.email}<br />
              Organisation · {demoAccounts.organisation.email}
            </p>
          ) : (
            <p className="muted">
              Ask me for the demo sign in if the buttons are not showing on the sign in page.
            </p>
          )}
          <p style={{ marginBottom: 0 }}>
            <Link to="/signin">Go to sign in</Link>
          </p>
        </div>

        <h2>What information I collect</h2>
        <p>
          <strong>When you create an account:</strong> Your name, email address and password. Your
          password is hashed before it is stored, which means that nobody, including me, can read
          the original password.
        </p>
        <p>
          <strong>If you sign in with Google:</strong> Google shares your name, email address and
          Google account ID with Fasha so your account can be recognised next time you sign in.
          Fasha never sees your Google password or requests any other information from Google.
        </p>
        <p>
          <strong>If you complete your profile:</strong> You can add a profile picture, a short
          description, skills and interests from the available list, your usual availability,
          location and sector. All these details are optional. Fasha still works without them,
          although you may see fewer suggested opportunities.
        </p>
        <p>
          <strong>As you use Fasha:</strong> Information about opportunities you post,
          applications you submit and their contents, event check-in and check-out times, work you
          submit and the hours credited to you.
        </p>

        <h2>What I don&rsquo;t collect</h2>
        <p>
          Fasha has no advertisements, analytics services or tracking across other websites. It
          also doesn&rsquo;t use cookies for advertising or tracking. Fasha doesn&rsquo;t send
          emails, so your email address is only used to sign in.
        </p>
        <p>
          The Google sign-in button is provided by Google, and Google&rsquo;s own privacy policy
          applies to the information it collects when you use that option.
        </p>

        <h2>What is stored in your browser</h2>
        <p>Fasha stores three things in your browser:</p>
        <ul>
          <li>Your sign-in token, which keeps you logged in.</li>
          <li>
            Copies of pages you&rsquo;ve already opened, so you can still view them if your
            internet connection drops.
          </li>
          <li>Drafts of forms you haven&rsquo;t submitted yet.</li>
        </ul>
        <p>Signing out or clearing your browser data removes these items.</p>

        <h2>Who can see your information</h2>
        <p>
          <strong>Organisations:</strong> When you apply for an opportunity, the organisation can
          see your name, profile picture, skills and interests, availability, match score and a
          link to your portfolio. They can also read your application and motivation statement.
          Keep this in mind when writing anything you don&rsquo;t want an organisation to see.
        </p>
        <p>
          <strong>Anyone who visits your portfolio:</strong> Your portfolio is public, meaning
          anyone with its link can view it without signing in. It shows your name, picture,
          description, skills, interests, availability (if you&rsquo;ve added it) and the work
          you&rsquo;ve been credited for. It does not show your email address, phone number or
          location. You can remove your availability from your profile whenever you want.
        </p>
        <p>
          <strong>Community administrator:</strong> The community administrator can see the list
          of accounts, including names and email addresses, as well as content posted in the
          sector. This is needed to review and approve proposals and help users who have lost
          access to their accounts.
        </p>
        <p>Your information is not sold or shared with other organisations.</p>

        <h2>Where your information is stored</h2>
        <p>
          Fasha uses a PostgreSQL database hosted by Supabase in Frankfurt, Germany, while the
          server runs on Vercel. Both companies provide hosting services and store or process
          information on my behalf.
        </p>
        <p>
          Frankfurt is outside Rwanda. Under Rwanda&rsquo;s data protection law (Law No. 058/2021,
          Article 50), storing personal data outside the country requires approval from the
          regulator, which Fasha does not yet have. Before the project is used beyond the pilot, I
          will either obtain the required approval or move the database to a host in Rwanda.
        </p>
        <p>
          Fasha is still a prototype and has not been fully prepared for wider use. Please avoid
          putting sensitive personal information in the free-text fields.
        </p>

        <h2>How your information is used in my research</h2>
        <p>
          The pilot is meant to help me understand whether a platform like Fasha can make it
          easier for people to participate in community activities. The capstone uses general
          numbers and patterns, such as how many people registered, how many initiatives were
          proposed by residents rather than organisations, and how users rated the
          platform&rsquo;s usability.
        </p>
        <p>
          I don&rsquo;t include names, email addresses or individual user records in my research
          or submitted report.
        </p>
        <p>
          If I want to use something you&rsquo;ve written or share your personal experience as an
          example, I&rsquo;ll ask for your permission first.
        </p>

        <h2>Changing or removing your information</h2>
        <p>
          You can edit or clear the information on your profile at any time from the profile page.
        </p>
        <p>
          <strong>Deactivating your account:</strong> This closes your account without deleting
          its information. The community administrator can reactivate it if needed.
        </p>
        <p>
          <strong>Deleting your account:</strong> This removes the information that identifies
          you, including your name, email address, password, profile picture, description,
          skills, interests, availability, location, sector, Google account link and portfolio
          address. Your public portfolio will no longer be accessible.
        </p>
        <p>
          Some records will remain under the name &ldquo;Removed account&rdquo;. These include
          records of work you completed, applications and submitted work, as well as attendance
          records and hours verified by an organiser. This is because other people and
          organisations may still need these records, and removing them completely would also
          affect their records.
        </p>
        <p>
          If you want all your records removed, including those linked to your participation,
          contact me and I can remove them manually.
        </p>

        <h2>Have a question?</h2>
        <p>
          This is my project, so you can contact me directly if you have questions or want to
          change or remove your information.
        </p>
        <p>
          Email: <a href="mailto:l.runiga@alustudent.com">l.runiga@alustudent.com</a>
        </p>

        <p className="policy__back">
          <Link to="/signin">← Back to sign in</Link>
        </p>
      </main>
    </div>
  )
}