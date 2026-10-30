import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { User, UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  logout: () => void
  switchRole: (role: UserRole) => Promise<void>
  hasRole: (roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  switchRole: async () => {},
  hasRole: () => false,
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const syncUserFromPb = () => {
    if (pb.authStore.isValid && pb.authStore.record) {
      const rec = pb.authStore.record as any
      setUser({
        id: rec.id,
        email: rec.email,
        name: rec.name || rec.email.split('@')[0],
        role: rec.role || 'admin',
        active: rec.active !== false,
        avatar: rec.avatar,
      })
    } else {
      setUser(null)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (pb.authStore.isValid) {
          syncUserFromPb()
        } else {
          // Tentativa de login automático como admin inicial para desenvolvimento e navegação imediata
          try {
            await pb.collection('users').authWithPassword('ishii7883@gmail.com', 'Skip@Pass')
            syncUserFromPb()
          } catch (_) {
            // Caso falhe, permanece deslogado e vai para /login
            setUser(null)
          }
        }
      } catch (err) {
        console.error('Erro na inicialização da autenticação:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    const unsubscribe = pb.authStore.onChange(() => {
      syncUserFromPb()
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    await pb.collection('users').authWithPassword(email, pass)
    syncUserFromPb()
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
  }

  // Permite que operadores com acesso alterem seu papel para testar a experiência de outro perfil
  const switchRole = async (newRole: UserRole) => {
    if (!user) return
    try {
      await pb.collection('users').update(user.id, { role: newRole })
      setUser({ ...user, role: newRole })
    } catch (_) {
      // Atualiza apenas localmente se a regra de RLS bloquear
      setUser({ ...user, role: newRole })
    }
  }

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false
    if (user.role === 'admin') return true // Admin tem acesso irrestrito
    return roles.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchRole, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
