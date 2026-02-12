import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type AuthContextValue = {
  email: string | null
  employeeId: string | null
  login: (data: { email: string; employeeId: string }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'ea-auth'

function loadStoredAuth(): { email: string | null; employeeId: string | null } {
  if (typeof window === 'undefined') return { email: null, employeeId: null }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { email: null, employeeId: null }
    const parsed = JSON.parse(raw) as { email?: string; employeeId?: string }
    return {
      email: parsed.email ?? null,
      employeeId: parsed.employeeId ?? null,
    }
  } catch {
    return { email: null, employeeId: null }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [employeeId, setEmployeeId] = useState<string | null>(null)

  useEffect(() => {
    const stored = loadStoredAuth()
    setEmail(stored.email)
    setEmployeeId(stored.employeeId)
  }, [])

  const login = useCallback((data: { email: string; employeeId: string }) => {
    setEmail(data.email)
    setEmployeeId(data.employeeId)
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ email: data.email, employeeId: data.employeeId }),
      )
    } catch {
    }
  }, [])

  const logout = useCallback(() => {
    setEmail(null)
    setEmployeeId(null)
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
    }
  }, [])

  const value = useMemo(
    () => ({ email, employeeId, login, logout }),
    [email, employeeId, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

