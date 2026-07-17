import { Link } from 'react-router-dom'

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <h1 className="text-4xl font-bold text-gray-800">403</h1>
      <p className="text-lg text-gray-600">You don't have permission to view this page.</p>
      <Link to="/" className="text-primary-600 hover:underline text-sm">
        Go back home
      </Link>
    </div>
  )
}
