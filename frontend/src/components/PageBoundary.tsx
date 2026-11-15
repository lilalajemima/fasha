import { Component, Suspense, type ReactNode } from 'react'
import { Loading, Problem } from './Loader'

// The messages browsers give when a page's code file cannot be fetched.
const MISSING_CODE = /dynamically imported module|Importing a module script failed|error loading dynamically imported module/i

type Props = { children: ReactNode; resetOn?: string }
type State = { error: Error | null; at: string | undefined }

/**
 * Each page's code is fetched the first time it is opened. While it arrives
 * this shows a loading line; if it never arrives, it says why and offers to
 * try again, rather than leaving a blank screen. `resetOn` clears a failure
 * once somebody moves to another page.
 */
class Boundary extends Component<Props, State> {
  state: State = { error: null, at: this.props.resetOn }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetOn === state.at ? null : { error: null, at: props.resetOn }
  }

  render() {
    const { error } = this.state

    if (!error) return this.props.children

    const message = MISSING_CODE.test(error.message)
      ? navigator.onLine
        ? 'Fasha has been updated since this page was opened. Reload to get the new version.'
        : 'This page needs a connection the first time it is opened. Try again once you are back online.'
      : 'Something went wrong showing this page.'

    return <Problem message={message} onRetry={() => window.location.reload()} />
  }
}

export default function PageBoundary({ children, resetOn }: Props) {
  return (
    <Boundary resetOn={resetOn}>
      <Suspense fallback={<Loading what="this page" />}>{children}</Suspense>
    </Boundary>
  )
}
