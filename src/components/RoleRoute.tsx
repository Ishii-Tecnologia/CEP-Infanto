import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types'
import { RestrictedAccess } from './RestrictedAccess'

interface RoleRouteProps {
  allowedRoles: UserRole[]
  rolesDescription?: string
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, rolesDescription }) => {
  const { user, hasOriginalRole, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-muted-foreground">
        Carregando permissões do Sistema Infanto-CEP...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // A guarda de rota checa o papel EFETIVO do cadastro do operador (originalUser).
  // Se o papel do cadastro não tiver permissão, exibe a tela de "Acesso restrito".
  if (!hasOriginalRole(allowedRoles)) {
    return <RestrictedAccess requiredRolesDescription={rolesDescription} />
  }

  return <Outlet />
}

export default RoleRoute
