import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { User, UserRole } from '@/types'

interface AuthContextType {
  user: User | null
  originalUser: User | null
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  logout: () => void
  switchRole: (role: UserRole) => void
  hasRole: (roles: UserRole[]) => boolean
  hasOriginalRole: (roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  originalUser: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  switchRole: () => {},
  hasRole: () => false,
  hasOriginalRole: () => false,
})

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [originalUser, setOriginalUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const syncUserFromPb = (overrideRole?: UserRole) => {
    if (pb.authStore.isValid && pb.authStore.record) {
      const rec = pb.authStore.record as any
      const baseUser: User = {
        id: rec.id,
        email: rec.email,
        name: rec.name || rec.email.split('@')[0],
        role: rec.role || 'professor',
        active: rec.active !== false,
        avatar: rec.avatar,
      }
      setOriginalUser(baseUser)

      // Se houver um papel temporário em memória (demonstração visual), aplica-o em user
      const effectiveRole = overrideRole || baseUser.role
      setUser({
        ...baseUser,
        role: effectiveRole,
      })
    } else {
      setOriginalUser(null)
      setUser(null)
    }
  }

  useEffect(() => {
    const initAuth = () => {
      try {
        if (pb.authStore.isValid) {
          syncUserFromPb()
        } else {
          setUser(null)
          setOriginalUser(null)
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
    setOriginalUser(null)
  }

  // Alternador de perfil/demonstração puramente visual (em memória/sessão).
  // NUNCA persiste no PocketBase nem altera o registro do operador no banco.
  const switchRole = (newRole: UserRole) => {
    if (!originalUser) return
    setUser({
      ...originalUser,
      role: newRole,
    })
  }

  // Checagem com base no papel visual ativo (para menus e prévias)
  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false
    if (user.role === 'admin') return true // Admin tem acesso irrestrito
    return roles.includes(user.role)
  }

  // Checagem estrita com base no papel REAL cadastrado no banco (para permissões e guarda de rota)
  const hasOriginalRole = (roles: UserRole[]): boolean => {
    if (!originalUser) return false
    if (originalUser.role === 'admin') return true // Admin cadastrado tem acesso irrestrito
    return roles.includes(originalUser.role)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        originalUser,
        isLoading,
        login,
        logout,
        switchRole,
        hasRole,
        hasOriginalRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
