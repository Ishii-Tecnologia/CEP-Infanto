import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  BookMarked,
  Coins,
  Settings,
  LogOut,
  Menu,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { UserRole } from '@/types'

export default function Layout() {
  const { user, logout, switchRole, hasRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Se não estiver logado e não estiver no login, redireciona
  React.useEffect(() => {
    if (!user && location.pathname !== '/login') {
      navigate('/login')
    }
  }, [user, location.pathname, navigate])

  if (!user && location.pathname === '/login') {
    return <Outlet />
  }

  const navItems = [
    {
      title: 'Painel',
      path: '/',
      icon: LayoutDashboard,
      roles: ['admin', 'dirigente', 'professor', 'auxiliar', 'bibliotecario'] as UserRole[],
    },
    {
      title: 'Famílias & Crianças',
      path: '/familias',
      icon: Users,
      roles: ['admin', 'dirigente', 'professor', 'auxiliar'] as UserRole[],
    },
    {
      title: 'Calendário & Planos',
      path: '/calendario',
      icon: Calendar,
      roles: ['admin', 'dirigente', 'professor', 'auxiliar'] as UserRole[],
    },
    {
      title: 'Chamada / Presença',
      path: '/presenca',
      icon: ClipboardCheck,
      roles: ['admin', 'dirigente', 'professor', 'auxiliar'] as UserRole[],
    },
    {
      title: 'Biblioteca',
      path: '/biblioteca',
      icon: BookMarked,
      roles: ['admin', 'dirigente', 'bibliotecario', 'professor'] as UserRole[],
    },
    {
      title: 'Moeda DimDim',
      path: '/dimdim',
      icon: Coins,
      roles: ['admin', 'dirigente', 'professor', 'auxiliar'] as UserRole[],
    },
    {
      title: 'Operadores & Config',
      path: '/configuracoes',
      icon: Settings,
      roles: ['admin', 'dirigente'] as UserRole[],
    },
  ]

  const filteredNavItems = navItems.filter((item) => hasRole(item.roles))

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    admin: { label: 'Administrador', color: 'bg-rose-100 text-rose-800 border-rose-200' },
    dirigente: { label: 'Dirigente', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    professor: {
      label: 'Professor(a)',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    auxiliar: { label: 'Auxiliar', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    bibliotecario: { label: 'Bibliotecário(a)', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  }

  const currentRoleInfo = user ? roleLabels[user.role] : { label: 'Usuário', color: '' }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Topo / Logotipo */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center text-white shadow-md">
          <Sparkles className="h-5 w-5 text-amber-100" />
        </div>
        <div>
          <h2 className="font-bold text-sm leading-tight text-white">Educação Espírita</h2>
          <p className="text-xs text-slate-400">
            CEP-Coligação Espírita Progressista — Infância & Juventude
          </p>
        </div>
      </div>

      {/* Navegação principal */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          )
        })}
      </div>

      {/* Rodapé do usuário e troca de papel */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
              {user?.name?.slice(0, 2) || 'US'}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-white truncate">{user?.name}</p>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 h-4 border ${currentRoleInfo.color}`}
              >
                {currentRoleInfo.label}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 pt-1">
          {/* Seletor rápido de papel para demonstração */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs h-7 text-slate-400 hover:text-white hover:bg-slate-800 px-2"
              >
                <span className="flex items-center gap-1.5">
                  <UserCheck className="h-3 w-3 text-indigo-400" />
                  Mudar papel (demo)
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Alternar Perfil</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(['admin', 'dirigente', 'professor', 'auxiliar', 'bibliotecario'] as UserRole[]).map(
                (r) => (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => switchRole(r)}
                    className={`text-xs capitalize ${user?.role === r ? 'font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600' : ''}`}
                  >
                    <ShieldCheck className="h-3 w-3 mr-2" />
                    {roleLabels[r].label}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-7 w-7 text-slate-400 hover:text-rose-400 hover:bg-slate-800 shrink-0"
            title="Sair"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-30 shadow-md">
        <SidebarContent />
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Barra superior Mobile */}
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white sticky top-0 z-20 shadow">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-lg bg-amber-400 flex items-center justify-center text-slate-900 font-bold text-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm tracking-tight">
              CEP-Coligação Espírita Progressista — Educação Infantil
            </span>
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-slate-800">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-r-slate-800">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Corpo da página */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
