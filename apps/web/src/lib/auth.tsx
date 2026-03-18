"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface User {
  id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  player_id: string | null
  club_id: string | null
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register: (email: string, password: string, fullName: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load token from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("padel_token")
    if (stored) {
      setToken(stored)
      // Validate token by calling /me
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then((res) => {
          if (res.ok) return res.json()
          throw new Error("Invalid token")
        })
        .then((u: User) => setUser(u))
        .catch(() => {
          localStorage.removeItem("padel_token")
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return { ok: false, error: data.detail || "Erreur de connexion" }
      }
      const data = await res.json()
      localStorage.setItem("padel_token", data.access_token)
      setToken(data.access_token)
      setUser(data.user)
      return { ok: true }
    } catch {
      return { ok: false, error: "Erreur réseau" }
    }
  }, [])

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return { ok: false, error: data.detail || "Erreur d'inscription" }
      }
      const data = await res.json()
      localStorage.setItem("padel_token", data.access_token)
      setToken(data.access_token)
      setUser(data.user)
      return { ok: true }
    } catch {
      return { ok: false, error: "Erreur réseau" }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem("padel_token")
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
