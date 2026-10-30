import React, { useEffect, useState } from 'react'
import { settingsService } from '@/services/settings'
import { User, UserRole } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { KeyRound, UserPlus, Calendar, BookOpen, Coins, Trash2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function SettingsPage() {
  const { toast } = useToast()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  // Modal de Novo Operador
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userForm, setUserForm] = useState<{
    name: string
    email: string
    role: UserRole
    password: string
  }>({
    name: '',
    email: '',
    role: 'professor',
    password: 'Skip@Pass',
  })

  // Modal de Redefinição de Senha
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('Skip@Pass')

  // Modal de Exclusão de Operador
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Configurações editáveis
  const [rulesLibrary, setRulesLibrary] = useState({
    maxLoansPerChild: 2,
    loanDurationDays: 7,
  })

  const [rulesDimDim, setRulesDimDim] = useState({
    attendanceReward: 10,
    taskReward: 5,
    goodBehaviorReward: 5,
    defaultRewardCost: 20,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [allUsers, allSettings] = await Promise.all([
        settingsService.getAllUsers(),
        settingsService.getSettings(),
      ])

      setUsers(allUsers)
      setSettings(allSettings)

      if (allSettings.rules_library) {
        setRulesLibrary({
          maxLoansPerChild: allSettings.rules_library.maxLoansPerChild || 2,
          loanDurationDays: allSettings.rules_library.loanDurationDays || 7,
        })
      }

      if (allSettings.rules_dimdim) {
        setRulesDimDim({
          attendanceReward: allSettings.rules_dimdim.attendanceReward || 10,
          taskReward: allSettings.rules_dimdim.taskReward || 5,
          goodBehaviorReward: allSettings.rules_dimdim.goodBehaviorReward || 5,
          defaultRewardCost: allSettings.rules_dimdim.defaultRewardCost || 20,
        })
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!userForm.name || !userForm.email) {
      toast({
        title: 'Atenção',
        description: 'Nome e e-mail são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    try {
      await settingsService.createUser(userForm)
      toast({ title: 'Operador criado com sucesso!' })
      setUserModalOpen(false)
      setUserForm({ name: '', email: '', role: 'professor', password: 'Skip@Pass' })
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro ao criar', description: err?.message, variant: 'destructive' })
    }
  }

  const handleToggleUserStatus = async (user: User) => {
    try {
      await settingsService.updateUser(user.id, { active: !user.active })
      toast({
        title: user.active ? 'Operador desativado' : 'Operador reativado',
      })
      loadData()
    } catch (err: any) {
      toast({ title: 'Erro', description: err?.message, variant: 'destructive' })
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return
    if (!newPassword || newPassword.length < 8) {
      toast({
        title: 'Atenção',
        description: 'A nova senha deve ter no mínimo 8 caracteres.',
        variant: 'destructive',
      })
      return
    }

    try {
      await settingsService.resetUserPassword(selectedUser.id, newPassword)
      toast({
        title: 'Senha redefinida com sucesso!',
        description: `Nova senha definida para ${selectedUser.name}: ${newPassword}`,
      })
      setResetModalOpen(false)
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || 'Falha ao atualizar registro de usuário.'
      toast({ title: 'Erro ao redefinir senha', description: errMsg, variant: 'destructive' })
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    if (currentUser && userToDelete.id === currentUser.id) {
      toast({
        title: 'Operação não permitida',
        description: 'Você não pode excluir a sua própria conta logada.',
        variant: 'destructive',
      })
      setDeleteModalOpen(false)
      setUserToDelete(null)
      return
    }

    try {
      setDeleting(true)
      await settingsService.deleteUser(userToDelete.id)
      toast({
        title: 'Operador excluído com sucesso!',
        description: `A conta de ${userToDelete.name} foi removida da plataforma CEP-Coligação Espírita Progressista.`,
      })
      setDeleteModalOpen(false)
      setUserToDelete(null)
      loadData()
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || 'Falha ao excluir o operador.'
      toast({
        title: 'Erro ao excluir operador',
        description: errMsg,
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleSaveLibraryRules = async () => {
    try {
      await settingsService.updateSetting(
        'rules_library',
        rulesLibrary,
        'Regras de empréstimos da biblioteca',
      )
      toast({ title: 'Regras da biblioteca salvas!' })
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err?.message, variant: 'destructive' })
    }
  }

  const handleSaveDimDimRules = async () => {
    try {
      await settingsService.updateSetting(
        'rules_dimdim',
        rulesDimDim,
        'Parâmetros e limites da moeda educativa DimDim',
      )
      toast({ title: 'Regras da moeda DimDim salvas!' })
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err?.message, variant: 'destructive' })
    }
  }

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

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Operadores e Configurações
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gestão de contas de acesso, papéis de permissão, ano letivo 2027, feriados e regras do
            sistema.
          </p>
        </div>

        <Button
          onClick={() => setUserModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Operador
        </Button>
      </div>

      <Tabs defaultValue="operadores" className="space-y-4">
        <TabsList className="grid grid-cols-2 max-w-sm">
          <TabsTrigger value="operadores">Operadores e Papéis</TabsTrigger>
          <TabsTrigger value="parametros">Regras e Parâmetros</TabsTrigger>
        </TabsList>

        {/* ABA 1: OPERADORES */}
        <TabsContent value="operadores" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map((u) => {
              const rInfo = roleLabels[u.role] || { label: u.role, color: '' }
              const isActive = u.active !== false

              return (
                <Card
                  key={u.id}
                  className={`p-4 space-y-3 ${!isActive ? 'opacity-60 bg-slate-50 dark:bg-slate-900/40' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {u.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>

                    <Badge variant="outline" className={`text-xs ${rInfo.color}`}>
                      {rInfo.label}
                    </Badge>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between text-xs">
                    <span
                      className={
                        isActive ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'
                      }
                    >
                      {isActive ? 'Ativo' : 'Inativo'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedUser(u)
                          setNewPassword('Skip@Pass')
                          setResetModalOpen(true)
                        }}
                        className="h-7 text-xs text-indigo-600 hover:text-indigo-800"
                        title="Redefinir senha"
                      >
                        <KeyRound className="h-3 w-3 mr-1" />
                        Senha
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleUserStatus(u)}
                        className={`h-7 text-xs ${isActive ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'}`}
                        title={isActive ? 'Desativar operador' : 'Reativar operador'}
                      >
                        {isActive ? 'Desativar' : 'Reativar'}
                      </Button>

                      {/* Botão de Excluir Operador definitivo */}
                      {currentUser?.id !== u.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setUserToDelete(u)
                            setDeleteModalOpen(true)
                          }}
                          className="h-7 px-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700"
                          title="Excluir operador definitivamente"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ABA 2: REGRAS E PARÂMETROS */}
        <TabsContent value="parametros" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Parâmetros da Biblioteca */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-sky-600" />
                  Regras da Biblioteca Infantil
                </CardTitle>
                <CardDescription className="text-xs">
                  Limites de empréstimos simultâneos e prazo padrão de devolução
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="space-y-1">
                  <Label>Máximo de livros simultâneos por criança</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={rulesLibrary.maxLoansPerChild}
                    onChange={(e) =>
                      setRulesLibrary({
                        ...rulesLibrary,
                        maxLoansPerChild: parseInt(e.target.value) || 2,
                      })
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Padrão CEP-Coligação Espírita Progressista: 2 exemplares
                  </p>
                </div>

                <div className="space-y-1">
                  <Label>Prazo padrão de empréstimo (dias)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={rulesLibrary.loanDurationDays}
                    onChange={(e) =>
                      setRulesLibrary({
                        ...rulesLibrary,
                        loanDurationDays: parseInt(e.target.value) || 7,
                      })
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Padrão CEP-Coligação Espírita Progressista: 7 dias (de um sábado ao outro)
                  </p>
                </div>

                <Button
                  onClick={handleSaveLibraryRules}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                >
                  Salvar Regras da Biblioteca
                </Button>
              </CardContent>
            </Card>

            {/* Parâmetros do DimDim */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Coins className="h-4 w-4 text-amber-500" />
                  Parâmetros da Moeda DimDim
                </CardTitle>
                <CardDescription className="text-xs">
                  Valores sugeridos para premiação pedagógica e feirinha
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Crédito por Presença</Label>
                    <Input
                      type="number"
                      value={rulesDimDim.attendanceReward}
                      onChange={(e) =>
                        setRulesDimDim({
                          ...rulesDimDim,
                          attendanceReward: parseInt(e.target.value) || 10,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Crédito por Tarefa</Label>
                    <Input
                      type="number"
                      value={rulesDimDim.taskReward}
                      onChange={(e) =>
                        setRulesDimDim({
                          ...rulesDimDim,
                          taskReward: parseInt(e.target.value) || 5,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Custo Padrão na Feirinha de Prêmios</Label>
                  <Input
                    type="number"
                    value={rulesDimDim.defaultRewardCost}
                    onChange={(e) =>
                      setRulesDimDim({
                        ...rulesDimDim,
                        defaultRewardCost: parseInt(e.target.value) || 20,
                      })
                    }
                  />
                </div>

                <Button
                  onClick={handleSaveDimDimRules}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                >
                  Salvar Parâmetros do DimDim
                </Button>
              </CardContent>
            </Card>

            {/* Ano Letivo e Feriados 2027 */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  Ano Letivo 2027 e Janelas de Feriados
                </CardTitle>
                <CardDescription className="text-xs">
                  Datas carregadas automaticamente para o calendário dos 30 sábados de 2027
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border space-y-1.5">
                  <div className="flex justify-between font-semibold">
                    <span>Início do Ano Letivo:</span>
                    <span>06 de Março de 2027</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Encerramento:</span>
                    <span>27 de Novembro de 2027</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Data de Corte para Idade:</span>
                    <span>01 de Março de 2027</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Feriados e Recessos Excluídos do Calendário:
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    Sábado de Páscoa (27/03), Tiradentes (17/04), Dia do Trabalho (01/05), Corpus
                    Christi (29/05), Férias de Julho (10/07 e 17/07), Independência (04/09), N. Sra.
                    Aparecida (09/10), Finados (30/10) e Proclamação da República (13/11).
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: Novo Operador */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Operador</DialogTitle>
            <DialogDescription className="text-xs">
              Defina o nome, e-mail e papel de acesso do educador ou dirigente.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Nome Completo *</Label>
              <Input
                placeholder="Ex: Cláudia Silveira"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>E-mail de Acesso *</Label>
              <Input
                type="email"
                placeholder="prof.claudia@cep.org.br"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Papel no Sistema *</Label>
              <Select
                value={userForm.role}
                onValueChange={(val) => setUserForm({ ...userForm, role: val as UserRole })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador (Acesso Total)</SelectItem>
                  <SelectItem value="dirigente">
                    Dirigente (Gestão Pedagógica e Operadores)
                  </SelectItem>
                  <SelectItem value="professor">
                    Professor(a) (Chamada, Planos e Famílias)
                  </SelectItem>
                  <SelectItem value="auxiliar">Auxiliar (Chamada e Apoio)</SelectItem>
                  <SelectItem value="bibliotecario">
                    Bibliotecário(a) (Acervo e Empréstimos)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Senha Inicial</Label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateUser}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Cadastrar Operador
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Redefinir Senha */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha do Operador</DialogTitle>
            <DialogDescription className="text-xs">
              Altere a senha de acesso para <strong>{selectedUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2 text-xs">
            <Label>Nova Senha</Label>
            <Input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setResetModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleResetPassword}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Confirmar Nova Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmar Exclusão Definitiva de Operador */}
      <Dialog
        open={deleteModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteModalOpen(false)
            setUserToDelete(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Excluir Operador Definitivamente
            </DialogTitle>
            <DialogDescription className="text-xs">
              Você está prestes a remover o operador <strong>{userToDelete?.name}</strong> (
              {userToDelete?.email}) da plataforma institucional do{' '}
              <strong>CEP-Coligação Espírita Progressista</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 space-y-1.5">
              <p className="font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Esta ação é irreversível e definitiva.
              </p>
              <ul className="list-disc list-inside text-rose-700 dark:text-rose-400 space-y-1 text-[11px]">
                <li>O login e o acesso deste operador serão permanentemente revogados.</li>
                <li>
                  Os registros históricos (presenças, planos de aula, empréstimos e lançamentos de
                  DimDim) permanecerão intactos no banco de dados.
                </li>
              </ul>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Deseja realmente confirmar a exclusão deste operador?
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteModalOpen(false)
                setUserToDelete(null)
              }}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleting ? 'Excluindo...' : 'Sim, Excluir Operador'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
