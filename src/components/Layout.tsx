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
      shortTitle: 'Painel',
      path: '/',
      icon: LayoutDashboard,
      roles: ['admin', 'dirigente', 'professor', 'auxiliar', 'bibliotecario'] as UserRole[],
    },
    {
      title: 'Famílias & Crianças',
      shortTitle: 'Famílias',
      path: '/familias',
      icon: Users,
      roles: ['admin', 'dirigente', 'professor', 'auxiliar'] as UserRole[],
    },
    {
      title: 'Calendário & Planos',
      shortTitle: 'Calendário',
      path: '/calendario',
      icon: Calendar,
      roles: ['admin', 'dirigente', 'professor', 'auxiliar'] as UserRole[],
    },
    {
      title: 'Chamada / Presença',
      shortTitle: 'Presença',
      path: '/presenca',
      icon: ClipboardCheck,
      roles: ['admin', 'dirigente', 'professor', 'auxiliar'] as UserRole[],
    },
    {
      title: 'Biblioteca',
      shortTitle: 'Biblioteca',
      path: '/biblioteca',
      icon: BookMarked,
      roles: ['admin', 'dirigente', 'bibliotecario', 'professor'] as UserRole[],
    },
    {
      title: 'Moeda DimDim',
      shortTitle: 'DimDim',
      path: '/dimdim',
      icon: Coins,
      roles: ['admin', 'dirigente', 'professor', 'auxiliar'] as UserRole[],
    },
    {
      title: 'Configurações',
      shortTitle: 'Configurações',
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

  const MobileDrawerContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Topo / Logotipo no menu móvel */}
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center text-white shadow-md shrink-0">
          <Sparkles className="h-5 w-5 text-amber-100" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-sm leading-tight text-white truncate">Educação Espírita</h2>
          <p className="text-[11px] text-slate-400 leading-tight">
            CEP-Coligação Espírita Progressista
          </p>
        </div>
      </div>

      {/* Navegação principal */}
      <div className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
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
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          )
        })}
      </div>

      {/* Rodapé do usuário e troca de papel */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/70">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5 overflow-hidden">
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

        <div className="flex items-center space-x-1.5 pt-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 justify-between text-xs h-8 text-slate-300 hover:text-white hover:bg-slate-800 px-2"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <UserCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  Mudar papel
                </span>
                <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs">Alternar Perfil (Demo)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(['admin', 'dirigente', 'professor', 'auxiliar', 'bibliotecario'] as UserRole[]).map(
                (r) => (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => switchRole(r)}
                    className={`text-xs capitalize ${user?.role === r ? 'font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600' : ''}`}
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-2" />
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
            className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-slate-800 shrink-0"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Barra de Navegação Superior (Menu Superior Horizontal) */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between min-h-[3.75rem] py-2 gap-2 sm:gap-3">
            {/* Lado Esquerdo: Identidade Institucional CEP */}
            <NavLink
              to="/"
              className="flex items-center space-x-2.5 shrink-0 hover:opacity-95 transition-opacity"
              title="Página Inicial"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-400 to-indigo-500 flex items-center justify-center text-white shadow-md shrink-0">
                <Sparkles className="h-5 w-5 text-amber-100" />
              </div>
              <div className="min-w-0">
                <h1 className="font-bold text-xs sm:text-sm leading-tight text-white tracking-tight">
                  CEP-Coligação Espírita Progressista
                </h1>
                <p className="text-[10px] sm:text-[11px] text-slate-400 leading-tight hidden xs:block">
                  Educação Espírita Infantil & Juventude
                </p>
              </div>
            </NavLink>

            {/* Centro / Itens de Navegação no Desktop (sem rolagem horizontal, sempre visíveis) */}
            <nav
              aria-label="Menu principal"
              className="hidden lg:flex items-center flex-wrap justify-center gap-1 sm:gap-1.5 py-1"
            >
              {filteredNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-1.5 px-2.5 xl:px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    {/* Em telas menores de 1280px (lg), exibe título conciso para caber com folga; em xl+, exibe completo */}
                    <span className="hidden xl:inline">{item.title}</span>
                    <span className="inline xl:hidden">{item.shortTitle}</span>
                  </NavLink>
                )
              })}
            </nav>

            {/* Lado Direito: Usuário, Papel, Alternar Perfil e Sair (Desktop & Mobile) */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              {/* Usuário e Perfil em telas médias/grandes */}
              <div className="hidden md:flex items-center space-x-2 pr-1 border-r border-slate-800">
                <div className="h-7 w-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
                  {user?.name?.slice(0, 2) || 'US'}
                </div>
                <div className="text-right max-w-[110px] xl:max-w-[130px] truncate">
                  <p className="text-xs font-medium text-white truncate leading-none">
                    {user?.name}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1 py-0 h-3.5 mt-0.5 border ${currentRoleInfo.color}`}
                  >
                    {currentRoleInfo.label}
                  </Badge>
                </div>
              </div>

              {/* Menu rápido de papel (demo) */}
              <div className="hidden sm:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 text-slate-300 hover:text-white hover:bg-slate-800 px-2 gap-1.5"
                      title="Alternar perfil de acesso"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="hidden 2xl:inline">Papel</span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="text-xs">
                      Alternar Perfil (Demo)
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(
                      ['admin', 'dirigente', 'professor', 'auxiliar', 'bibliotecario'] as UserRole[]
                    ).map((r) => (
                      <DropdownMenuItem
                        key={r}
                        onClick={() => switchRole(r)}
                        className={`text-xs capitalize ${user?.role === r ? 'font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600' : ''}`}
                      >
                        <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                        {roleLabels[r].label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Botão de Logout */}
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="hidden sm:inline-flex h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                title="Sair do sistema"
              >
                <LogOut className="h-4 w-4" />
              </Button>

              {/* Botão Hamburguer para Mobile e Tablets pequenos (abaixo de md) */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-white hover:bg-slate-800 h-9 w-9"
                    aria-label="Abrir menu de navegação"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="top"
                  className="p-0 max-h-[85vh] border-b-slate-800 bg-slate-900 text-slate-100"
                >
                  <MobileDrawerContent />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Sub-barra de navegação para telas intermediárias (md até lg):
              Flex-wrap para exibir TODAS as opções de uma vez, organizadas sem qualquer barra de rolagem horizontal */}
          <nav
            aria-label="Menu de opções secundário em telas intermediárias"
            className="hidden md:flex lg:hidden flex-wrap items-center justify-center gap-1.5 py-2 border-t border-slate-800"
          >
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.title}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Conteúdo Principal ocupando toda a largura abaixo do menu superior */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
