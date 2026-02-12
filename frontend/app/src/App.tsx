import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { ChatPage } from './pages/ChatPage'
import { useAuth } from './state/auth'

function App() {
  const { employeeId } = useAuth()
  const isAuthenticated = Boolean(employeeId)

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/chat" replace /> : <LoginPage />}
      />
      <Route
        path="/chat"
        element={isAuthenticated ? <ChatPage /> : <Navigate to="/" replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/chat' : '/'} replace />}
      />
    </Routes>
  )
}

export default App
