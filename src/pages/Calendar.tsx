import React, { useEffect, useState } from 'react'
import { lessonService } from '@/services/lessons'
import { Lesson, LessonPlan, ClassroomId } from '@/types'
import { formatDate, getClassroomBadge } from '@/lib/academic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Calendar,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  Edit3,
  CalendarCheck,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function CalendarPage() {
  const { toast } = useToast()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  // Modal de Cancelamento de Aula
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('Recesso / Feriado')

  // Modal de Edição de Plano Pedagógico
  const [editingPlan, setEditingPlan] = useState<LessonPlan | null>(null)
  const [planForm, setPlanForm] = useState({
    title: '',
    objective: '',
    approach: '',
    materials: '',
  })

  useEffect(() => {
    loadLessons()
  }, [])

  const loadLessons = async () => {
    try {
      setLoading(true)
      const data = await lessonService.getAll(2027)
      setLessons(data)
      if (data.length > 0 && !selectedLesson) {
        setSelectedLesson(data[0])
      }
    } catch (err) {
      console.error('Erro ao carregar aulas:', err)
      toast({
        title: 'Erro ao carregar calendário',
        description: 'Não foi possível carregar os sábados letivos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelLesson = async () => {
    if (!selectedLesson) return
    try {
      await lessonService.cancelLesson(selectedLesson.id, cancelReason)
      toast({
        title: 'Aula cancelada',
        description:
          'A aula foi marcada como cancelada. O plano pedagógico foi mantido como histórico.',
      })
      setCancelOpen(false)
      loadLessons()
      setSelectedLesson({
        ...selectedLesson,
        status: 'canceled',
        cancel_reason: cancelReason,
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível cancelar a aula.',
        variant: 'destructive',
      })
    }
  }

  const handleReactivateLesson = async () => {
    if (!selectedLesson) return
    try {
      await lessonService.reactivateLesson(selectedLesson.id)
      toast({
        title: 'Aula reativada!',
        description: 'A aula e seus planos pedagógicos voltaram ao status de agendada.',
      })
      loadLessons()
      setSelectedLesson({
        ...selectedLesson,
        status: 'scheduled',
        cancel_reason: '',
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível reativar a aula.',
        variant: 'destructive',
      })
    }
  }

  const handleOpenEditPlan = (plan: LessonPlan) => {
    setEditingPlan(plan)
    setPlanForm({
      title: plan.title,
      objective: plan.objective || '',
      approach: plan.approach || '',
      materials: plan.materials || '',
    })
  }

  const handleSavePlan = async () => {
    if (!editingPlan || !selectedLesson) return
    try {
      const updated = await lessonService.updatePlan(editingPlan.id, planForm)
      toast({ title: 'Plano pedagógico atualizado com sucesso!' })

      const updatedPlans = (selectedLesson.plans || []).map((p) =>
        p.id === updated.id ? updated : p,
      )
      setSelectedLesson({ ...selectedLesson, plans: updatedPlans })
      setEditingPlan(null)
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o plano.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Calendário e Matriz Pedagógica
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            30 Sábados letivos de 2027 (março a novembro), excluindo feriados e com planos por sala.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs py-1 px-3"
          >
            Ano Letivo 2027 • 30 Sábados
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna da Esquerda: Lista de Sábados do Ano */}
        <div className="lg:col-span-5 space-y-3">
          <Card className="h-[700px] flex flex-col">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>Lista de Sábados Letivos</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {lessons.length} encontros
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-2 flex-1 overflow-y-auto space-y-1.5">
              {lessons.map((lesson) => {
                const isSelected = selectedLesson?.id === lesson.id
                const isCanceled = lesson.status === 'canceled'

                return (
                  <div
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-200'
                    } ${isCanceled ? 'opacity-60 bg-slate-50 dark:bg-slate-900/30' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          #{lesson.session_number} • {formatDate(lesson.date)}
                        </span>
                      </div>

                      {isCanceled ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-rose-50 text-rose-700 border-rose-200"
                        >
                          Cancelada
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          Agendada
                        </Badge>
                      )}
                    </div>

                    <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {lesson.central_theme}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Bloco: {lesson.thematic_block}
                    </p>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Coluna da Direita: Detalhe do Sábado e Planos por Sala */}
        <div className="lg:col-span-7 space-y-4">
          {selectedLesson ? (
            <div className="space-y-4">
              <Card className="border-indigo-100 dark:border-indigo-950 shadow-sm">
                <CardHeader className="bg-indigo-50/40 dark:bg-indigo-950/20 pb-4 border-b">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-600 text-white text-xs">
                        Aula #{selectedLesson.session_number}
                      </Badge>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {formatDate(selectedLesson.date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedLesson.status === 'canceled' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleReactivateLesson}
                          className="h-8 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1" />
                          Reativar Aula
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCancelOpen(true)}
                          className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Cancelar Aula
                        </Button>
                      )}
                    </div>
                  </div>

                  <CardTitle className="text-xl font-bold mt-2">
                    {selectedLesson.central_theme}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                    Bloco Temático: <strong>{selectedLesson.thematic_block}</strong>
                  </CardDescription>

                  {selectedLesson.status === 'canceled' && (
                    <div className="mt-2 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded text-xs text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>
                        <strong>Aula cancelada:</strong>{' '}
                        {selectedLesson.cancel_reason || 'Motivo não informado'}. Os planos
                        permanecem salvos como histórico.
                      </span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-indigo-600" />
                      Planos de Aula por Sala (A, B, C e D)
                    </h3>
                  </div>

                  {/* Abas com planos pedagógicos de cada sala */}
                  <Tabs defaultValue="A" className="w-full">
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="A">Sala A</TabsTrigger>
                      <TabsTrigger value="B">Sala B</TabsTrigger>
                      <TabsTrigger value="C">Sala C</TabsTrigger>
                      <TabsTrigger value="D">Sala D</TabsTrigger>
                    </TabsList>

                    {(['A', 'B', 'C', 'D'] as ClassroomId[]).map((cId) => {
                      const plan = (selectedLesson.plans || []).find((p) => p.classroom === cId)
                      const badge = getClassroomBadge(cId)

                      return (
                        <TabsContent key={cId} value={cId} className="pt-3 space-y-3">
                          {plan ? (
                            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 text-xs">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className={`font-semibold ${badge.color}`}>
                                  {badge.name}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenEditPlan(plan)}
                                  className="h-7 text-xs text-indigo-600 hover:text-indigo-800"
                                >
                                  <Edit3 className="h-3.5 w-3.5 mr-1" />
                                  Editar Plano
                                </Button>
                              </div>

                              <div>
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                                  Título da Aula
                                </span>
                                <p className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                                  {plan.title}
                                </p>
                              </div>

                              <div>
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                                  Objetivo Pedagógico
                                </span>
                                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                                  {plan.objective || 'Não preenchido'}
                                </p>
                              </div>

                              <div>
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                                  Abordagem Metodológica
                                </span>
                                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                                  {plan.approach || 'Não preenchido'}
                                </p>
                              </div>

                              <div>
                                <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                                  Recursos e Materiais
                                </span>
                                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                                  {plan.materials || 'Não preenchido'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="p-6 text-center text-muted-foreground text-xs">
                              Nenhum plano cadastrado para a {badge.name}.
                            </div>
                          )}
                        </TabsContent>
                      )
                    })}
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="p-8 text-center text-muted-foreground text-xs">
              Selecione um sábado letivo à esquerda para visualizar seu tema e planos de aula.
            </Card>
          )}
        </div>
      </div>

      {/* Modal: Cancelar Aula */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Aula do Sábado</DialogTitle>
            <DialogDescription className="text-xs">
              Informe o motivo do cancelamento (ex: feriado prolongado, recesso, evento CEP). O
              plano pedagógico continuará preservado no histórico.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <Label htmlFor="cancel_reason" className="text-xs">
              Motivo do Cancelamento
            </Label>
            <Input
              id="cancel_reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ex: Feriado prolongado de Páscoa"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCancelOpen(false)}>
              Voltar
            </Button>
            <Button size="sm" variant="destructive" onClick={handleCancelLesson}>
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Plano Pedagógico */}
      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Plano de Aula — Sala {editingPlan?.classroom}</DialogTitle>
            <DialogDescription className="text-xs">
              Ajuste o objetivo, a dinâmica e os materiais necessários para a turma.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Título da Aula</Label>
              <Input
                value={planForm.title}
                onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Objetivo Pedagógico</Label>
              <Textarea
                rows={2}
                value={planForm.objective}
                onChange={(e) => setPlanForm({ ...planForm, objective: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Abordagem / Dinâmica da Sala</Label>
              <Textarea
                rows={3}
                value={planForm.approach}
                onChange={(e) => setPlanForm({ ...planForm, approach: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Recursos e Materiais</Label>
              <Input
                value={planForm.materials}
                onChange={(e) => setPlanForm({ ...planForm, materials: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingPlan(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSavePlan}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Salvar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
