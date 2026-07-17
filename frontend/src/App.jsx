import { Toaster } from 'react-hot-toast'
import AppRouter from './router/AppRouter'

/**
 * user and loading are stubbed here until AuthContext is built in Day 2.
 * After Day 2: read from useAuth() inside AppRouter instead.
 */
const stubUser = null   // set to a mock user object to test the dashboard locally
const stubLoading = false

function handleLogout() {
  // Placeholder — real logout wired in Day 2
  window.location.href = '/login'
}

export default function App() {
  return (
    <>
      <AppRouter
        user={stubUser}
        loading={stubLoading}
        onLogout={handleLogout}
      />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontSize: '14px',
          },
        }}
      />
    </>
  )
}
