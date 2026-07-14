import { useState } from 'react'
import './styles/index.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-800 mb-8">ProcureX + Vite</h1>
      <div className="flex flex-col items-center gap-4 bg-white p-10 rounded-2xl shadow-lg">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-md transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg active:translate-y-0"
        >
          count is {count}
        </button>
        <p className="text-gray-600">
          Edit <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">src/App.jsx</code> and save to test HMR
        </p>
        <div className="mt-6 flex gap-4 text-sm">
          <a
            href="https://react.dev/learn"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Learn React
          </a>
          <a
            href="https://vite.dev/guide/"
            target="_blank"
            rel="noreferrer"
            className="text-purple-600 hover:text-purple-800 font-medium"
          >
            Learn Vite
          </a>
        </div>
      </div>
    </div>
  )
}

export default App
