import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { demoAccounts } from '../lib/demo'
import './Privacy.css'

const UPDATED = '7 November 2026'

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
          Fasha is a student project. It is the working prototype for my final year capstone at
          the African Leadership University, and it is running as a small pilot in one sector of
          Kigali, not as a finished service. This page says plainly what it collects, who can see
          it, and how to get rid of it.
        </p>

        <div className="policy__note">
          <h2>You do not have to give me anything</h2>
          <p>
            If you want to look around without handing over your details, use the demo accounts on
            the sign in page. They are shared accounts filled with made up people and made up
            events, and nothing you do in them is treated as real.
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

        <h2>What I collect</h2>
        <p>
          When you make an account: your name, your email address and your password. The password
          is hashed before it is stored, so nobody, me included, can read it back.
        </p>
        <p>
          If you fill in a profile, whatever you choose to put there: a picture, a short
          description of yourself, the skills and interests you pick from the list, the times of
          the week you are usually free, and your sector. All of it is optional, and the app works
          without any of it except a thinner list of suggestions.
        </p>
        <p>
          As you use Fasha: the opportunities you post, the applications you send and what you
          wrote in them, the times you checked in and out of an event, the work you submitted and
          the hours you were credited with.
        </p>

        <h2>What I do not collect</h2>
        <p>
          There is no advertising, no analytics service, no tracking across other websites and no
          cookies for any of that. The only thing Fasha puts in your browser is the token that
          keeps you signed in, and clearing your browser data removes it. Fasha sends no email at
          all, so your address is only ever used to sign you in.
        </p>

        <h2>Who can see it</h2>
        <p>
          <strong>Organisers you apply to</strong> see your name, your picture, the skills and
          interests on your profile, when you are free, how well the two of you match and a link
          to your portfolio. That is the point of applying, but it is worth knowing before you
          write anything in a motivation statement that you would not want them to read.
        </p>
        <p>
          <strong>Your portfolio page is public.</strong> Anyone with the link can open it without
          signing in, which is what makes it useful to show an employer. It carries your name,
          your picture, your description, the skills and interests you claim, and the work you
          have been credited for. Nothing else on your account is on it.
        </p>
        <p>
          <strong>The community admin</strong> can see the list of accounts, including names and
          email addresses, and everything posted in the district. That is how proposals get
          approved and how somebody locked out of their account gets a new password.
        </p>
        <p>
          <strong>Nobody else.</strong> Your information is not sold, shared or handed to any
          other organisation.
        </p>

        <h2>Where it is kept</h2>
        <p>
          In a PostgreSQL database hosted by Supabase in Frankfurt, with the server running on
          Vercel. Both are ordinary commercial hosts, and both hold the data on my behalf rather
          than for their own purposes.
        </p>
        <p>
          This is a prototype rather than a hardened system. Please do not put anything genuinely
          sensitive into the free text boxes.
        </p>

        <h2>How it is used for my research</h2>
        <p>
          The point of the pilot is to find out whether a platform like this helps people take
          part. What goes in the capstone is counts and patterns: how many people signed up, how
          many initiatives were proposed by residents rather than organisations, how usable people
          found it. No names, no email addresses and no individual's record appear in anything I
          write or submit.
        </p>
        <p>
          If I ever want to quote something you wrote or use your story, I will ask you first.
        </p>

        <h2>Changing or removing your information</h2>
        <p>
          Everything on your profile can be edited or emptied from the profile page at any time.
        </p>
        <p>
          <strong>Deactivating</strong> an account closes it without removing anything, and the
          community admin can switch it back on.
        </p>
        <p>
          <strong>Deleting</strong> removes what identifies you: your name, your email address,
          your password and your portfolio address, which stops working. The record of the work
          itself stays, with nobody's name on it, because other people's attendance registers and
          the hours an organiser verified are their records too and erasing yours would rewrite
          theirs. If that is not what you want, ask me and I will take the whole thing out by hand
          instead.
        </p>

        <h2>Asking me something</h2>
        <p>
          The project is mine, so the answer comes from me rather than a support desk. Write to{' '}
          <a href="mailto:l.runiga@alustudent.com">l.runiga@alustudent.com</a> and say what you
          want to know, changed or removed.
        </p>

        <p className="policy__back">
          <Link to="/signin">← Back to sign in</Link>
        </p>
      </main>
    </div>
  )
}
