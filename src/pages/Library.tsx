import React, { useEffect, useState } from 'react'
import { libraryService } from '@/services/library'
import { childService } from '@/services/families'
import { Book, BookCopy, BookLoan, Child } from '@/types'
import { formatDate } from '@/lib/academic'
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
import {
  BookOpen,
  BookMarked,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Barcode,
  Library,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function LibraryPage() {
  const { toast } = useToast()
  const [books, setBooks] = useState<Book[]>([])
  const [loans, setLoans] = useState<BookLoan[]>([])
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal de Novo Livro / Edição de Livro
  const [newBookOpen, setNewBookOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    publisher: '',
    target_audience: 'Sala A / B',
    category: 'Evangelho',
    description: '',
    initialCopies: 1,
  })

  // Modal de Edição de Exemplar (tombo, estado, status e notas)
  const [copyEditOpen, setCopyEditOpen] = useState(false)
  const [editingCopy, setEditingCopy] = useState<BookCopy | null>(null)
  const [copyForm, setCopyForm] = useState({
    copy_number: '',
    condition: 'bom',
    status: 'disponivel',
    notes: '',
  })
  const [savingCopy, setSavingCopy] = useState(false)

  // Modal de Novo Empréstimo
  const [loanOpen, setLoanOpen] = useState(false)
  const [selectedCopyId, setSelectedCopyId] = useState('')
  const [selectedChildId, setSelectedChildId] = useState('')

  useEffect(() => {
    loadLibraryData()
  }, [])

  const loadLibraryData = async () => {
    try {
      setLoading(true)
      const [allBooks, allLoans, allChildren] = await Promise.all([
        libraryService.getAllBooks(),
        libraryService.getAllLoans(),
        childService.getAll(),
      ])

      setBooks(allBooks)
      setLoans(allLoans)
      setChildren(allChildren)
    } catch (err) {
      console.error('Erro ao carregar dados da biblioteca:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEditBook = (book: Book) => {
    setEditingBook(book)
    setBookForm({
      title: book.title || '',
      author: book.author || '',
      publisher: book.publisher || '',
      target_audience: book.target_audience || 'Sala A / B',
      category: book.category || 'Evangelho',
      description: book.description || '',
      initialCopies: 1,
    })
    setNewBookOpen(true)
  }

  const handleSaveBookEdit = async () => {
    if (!editingBook || !bookForm.title.trim()) {
      toast({
        title: 'Atenção',
        description: 'O título do livro é obrigatório.',
        variant: 'destructive',
      })
      return
    }

    try {
      await libraryService.updateBook(editingBook.id, {
        title: bookForm.title,
        author: bookForm.author,
        publisher: bookForm.publisher,
        target_audience: bookForm.target_audience,
        category: bookForm.category,
        description: bookForm.description,
      })
      toast({
        title: 'Ficha do livro atualizada!',
        description: 'As informações da obra foram salvas com sucesso.',
      })
      setNewBookOpen(false)
      setEditingBook(null)
      loadLibraryData()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar alterações',
        description: err?.message,
        variant: 'destructive',
      })
    }
  }

  const handleOpenEditCopy = (copy: BookCopy, book: Book) => {
    setEditingCopy({ ...copy, expand: { book_id: book } as any })
    setCopyForm({
      copy_number: copy.copy_number || '',
      condition: copy.condition || 'bom',
      status: copy.status || 'disponivel',
      notes: copy.notes || '',
    })
    setCopyEditOpen(true)
  }

  const handleSaveCopyEdit = async () => {
    if (!editingCopy || !copyForm.copy_number.trim()) {
      toast({
        title: 'Atenção',
        description: 'O número de tombo é obrigatório.',
        variant: 'destructive',
      })
      return
    }

    try {
      setSavingCopy(true)
      await libraryService.updateCopy(editingCopy.id, {
        copy_number: copyForm.copy_number,
        condition: copyForm.condition as any,
        status: copyForm.status as any,
        notes: copyForm.notes,
      })
      toast({
        title: 'Exemplar atualizado!',
        description: 'Tombo, estado de conservação e disponibilidade foram salvos.',
      })
      setCopyEditOpen(false)
      setEditingCopy(null)
      loadLibraryData()
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar exemplar',
        description: err?.message,
        variant: 'destructive',
      })
    } finally {
      setSavingCopy(false)
    }
  }

  const handleDeleteCopy = async (copy: BookCopy) => {
    if (copy.status !== 'disponivel') {
      toast({
        title: 'Atenção',
        description:
          'Só é possível excluir exemplares que estejam disponíveis (sem empréstimo ativo).',
        variant: 'destructive',
      })
      return
    }

    if (
      !window.confirm(
        `Excluir o exemplar de tombo ${copy.copy_number}? Esta ação não pode ser desfeita.`,
      )
    ) {
      return
    }

    try {
      await libraryService.deleteCopy(copy.id)
      toast({
        title: 'Exemplar excluído',
        description: `O tombo ${copy.copy_number} foi removido do acervo.`,
      })
      loadLibraryData()
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err?.message, variant: 'destructive' })
    }
  }

  const handleCreateBook = async () => {
    if (!bookForm.title.trim()) {
      toast({
        title: 'Atenção',
        description: 'O título do livro é obrigatório.',
        variant: 'destructive',
      })
      return
    }

    try {
      await libraryService.createBook(bookForm, bookForm.initialCopies)
      toast({
        title: 'Livro cadastrado!',
        description: 'O título e seus exemplares de tombo foram criados.',
      })
      setNewBookOpen(false)
      setBookForm({
        title: '',
        author: '',
        publisher: '',
        target_audience: 'Sala A / B',
        category: 'Evangelho',
        description: '',
        initialCopies: 1,
      })
      loadLibraryData()
    } catch (err: any) {
      toast({ title: 'Erro ao cadastrar', description: err?.message, variant: 'destructive' })
    }
  }

  const handleCreateLoan = async () => {
    if (!selectedCopyId || !selectedChildId) {
      toast({
        title: 'Atenção',
        description: 'Selecione o exemplar e a criança.',
        variant: 'destructive',
      })
      return
    }

    try {
      await libraryService.borrowBook(selectedCopyId, selectedChildId, 7)
      toast({
        title: 'Empréstimo realizado!',
        description: 'Prazo de 7 dias registrado com sucesso.',
      })
      setLoanOpen(false)
      setSelectedCopyId('')
      setSelectedChildId('')
      loadLibraryData()
    } catch (err: any) {
      toast({
        title: 'Não foi possível emprestar',
        description: err?.message || 'Verifique as regras de empréstimo.',
        variant: 'destructive',
      })
    }
  }

  const handleReturnBook = async (loanId: string) => {
    try {
      await libraryService.returnBook(loanId, 'bom')
      toast({
        title: 'Livro devolvido com sucesso!',
        description: 'O exemplar está disponível novamente no acervo.',
      })
      loadLibraryData()
    } catch (err: any) {
      toast({ title: 'Erro ao devolver', description: err?.message, variant: 'destructive' })
    }
  }

  // Coleta exemplares disponíveis para o select de empréstimo
  const availableCopies = books.flatMap((b) =>
    (b.copies || [])
      .filter((c) => c.status === 'disponivel')
      .map((c) => ({
        copyId: c.id,
        tombo: c.copy_number,
        bookTitle: b.title,
      })),
  )

  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.author || '').toLowerCase().includes(search.toLowerCase()),
  )

  const activeLoans = loans.filter((l) => l.status === 'active')
  const overdueLoans = loans.filter((l) => l.status === 'overdue')

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Biblioteca Infantil
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Acervo de literatura espírita infantil, controle de tombos e empréstimos (limite: 2
            livros por criança, 7 dias).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setLoanOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Novo Empréstimo
          </Button>

          <Button onClick={() => setNewBookOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Novo Livro
          </Button>
        </div>
      </div>

      {/* Abas: Acervo de Livros vs Empréstimos Ativos / Atrasados */}
      <Tabs defaultValue="acervo" className="space-y-4">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="acervo">Acervo ({books.length})</TabsTrigger>
          <TabsTrigger value="ativos">Ativos ({activeLoans.length})</TabsTrigger>
          <TabsTrigger value="atrasados" className="text-rose-600">
            Atrasados ({overdueLoans.length})
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: ACERVO */}
        <TabsContent value="acervo" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por título ou autor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map((book) => {
              const totalCopies = book.copies?.length || 0
              const available = (book.copies || []).filter((c) => c.status === 'disponivel').length

              return (
                <Card
                  key={book.id}
                  className="hover:border-indigo-200 transition-all flex flex-col justify-between"
                >
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-slate-100 dark:bg-slate-800"
                        >
                          {book.category || 'Geral'}
                        </Badge>
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                          {book.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {book.author ? `Por ${book.author}` : 'Autor não informado'} •{' '}
                          {book.publisher}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-3 space-y-3 text-xs flex-1">
                    <p className="text-muted-foreground line-clamp-2">
                      {book.description ||
                        'História evangélica com valores de amor e solidariedade.'}
                    </p>

                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1">
                        Exemplares e Tombos:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(book.copies || []).map((cp) => (
                          <Badge
                            key={cp.id}
                            variant="outline"
                            className={`text-[10px] cursor-pointer hover:opacity-80 ${
                              cp.status === 'disponivel'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : cp.status === 'emprestado'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-slate-100 text-slate-800'
                            }`}
                            onClick={() => handleOpenEditCopy(cp, book)}
                            title="Clique para editar o exemplar"
                          >
                            <Barcode className="h-3 w-3 mr-1" />
                            {cp.copy_number} ({cp.status})
                            <Pencil className="h-2.5 w-2.5 ml-1 opacity-60" />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Disponíveis:{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {available} de {totalCopies}
                      </strong>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEditBook(book)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 h-7 px-2"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Editar Ficha
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const firstAvail = (book.copies || []).find(
                          (c) => c.status === 'disponivel',
                        )
                        if (firstAvail) {
                          setSelectedCopyId(firstAvail.id)
                          setLoanOpen(true)
                        } else {
                          toast({
                            title: 'Atenção',
                            description: 'Nenhum exemplar disponível deste livro no momento.',
                          })
                        }
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 h-7 px-2"
                    >
                      Emprestar
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ABA 2: EMPRÉSTIMOS ATIVOS */}
        <TabsContent value="ativos" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeLoans.map((loan) => (
              <Card key={loan.id} className="p-4 space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {loan.expand?.copy_id?.expand?.book_id?.title || 'Título do Livro'}
                    </h3>
                    <p className="text-muted-foreground text-[11px]">
                      Tombo: <strong>{loan.expand?.copy_id?.copy_number}</strong>
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-sky-50 text-sky-800 border-sky-200 text-[10px]"
                  >
                    Emprestado
                  </Badge>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 space-y-1">
                  <p>
                    Aluno(a): <strong>{loan.expand?.child_id?.name || 'Criança'}</strong>
                  </p>
                  <p className="text-muted-foreground">
                    Retirada: {formatDate(loan.loan_date)} • Devolução prevista:{' '}
                    <strong>{formatDate(loan.due_date)}</strong>
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReturnBook(loan.id)}
                    className="text-xs h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Registrar Devolução
                  </Button>
                </div>
              </Card>
            ))}

            {activeLoans.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
                Nenhum empréstimo ativo no momento.
              </div>
            )}
          </div>
        </TabsContent>

        {/* ABA 3: EMPRÉSTIMOS ATRASADOS */}
        <TabsContent value="atrasados" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overdueLoans.map((loan) => (
              <Card
                key={loan.id}
                className="p-4 space-y-2 text-xs border-rose-200 dark:border-rose-900 bg-rose-50/20"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {loan.expand?.copy_id?.expand?.book_id?.title || 'Título do Livro'}
                    </h3>
                    <p className="text-muted-foreground text-[11px]">
                      Tombo: <strong>{loan.expand?.copy_id?.copy_number}</strong>
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-rose-100 text-rose-800 border-rose-300 text-[10px]"
                  >
                    Atrasado
                  </Badge>
                </div>

                <div className="p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/30 space-y-1">
                  <p>
                    Aluno(a): <strong>{loan.expand?.child_id?.name || 'Criança'}</strong>
                  </p>
                  <p className="text-rose-700 dark:text-rose-300 font-semibold">
                    Vencido em: {formatDate(loan.due_date)}
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleReturnBook(loan.id)}
                    className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Receber com Atraso
                  </Button>
                </div>
              </Card>
            ))}

            {overdueLoans.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                Nenhum empréstimo atrasado. Todos os prazos de 7 dias estão respeitados!
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal: Novo Livro / Editar Livro */}
      <Dialog
        open={newBookOpen}
        onOpenChange={(open) => {
          setNewBookOpen(open)
          if (!open) setEditingBook(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBook ? 'Editar Ficha do Livro' : 'Cadastrar Livro no Acervo'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editingBook
                ? 'Altere os dados da obra. Os exemplares físicos (tombos) continuam vinculados.'
                : 'Informe os dados da obra e a quantidade de exemplares físicos para gerar os tombos.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Título da Obra *</Label>
              <Input
                placeholder="Ex: O Evangelho da Meninada"
                value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Autor / Psicografia</Label>
                <Input
                  placeholder="Ex: Eliseu Rigonatti"
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label>Editora</Label>
                <Input
                  placeholder="Ex: FEB, IDE..."
                  value={bookForm.publisher}
                  onChange={(e) => setBookForm({ ...bookForm, publisher: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Público / Sala</Label>
                <Input
                  placeholder="Ex: Sala A / B"
                  value={bookForm.target_audience}
                  onChange={(e) => setBookForm({ ...bookForm, target_audience: e.target.value })}
                />
              </div>

              {!editingBook && (
                <div className="space-y-1">
                  <Label>Exemplares Iniciais</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={bookForm.initialCopies}
                    onChange={(e) =>
                      setBookForm({ ...bookForm, initialCopies: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label>Breve Sinopse</Label>
              <Input
                placeholder="Descrição dos temas abordados..."
                value={bookForm.description}
                onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setNewBookOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={editingBook ? handleSaveBookEdit : handleCreateBook}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {editingBook ? 'Salvar Alterações' : 'Salvar Obra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Exemplar (Tombo, Estado, Status, Notas) */}
      <Dialog open={copyEditOpen} onOpenChange={setCopyEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Exemplar</DialogTitle>
            <DialogDescription className="text-xs">
              Ajuste o tombo, o estado de conservação e a disponibilidade do exemplar físico.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Número de Tombo *</Label>
              <Input
                placeholder="Ex: T-001"
                value={copyForm.copy_number}
                onChange={(e) => setCopyForm({ ...copyForm, copy_number: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Estado de Conservação</Label>
                <Select
                  value={copyForm.condition}
                  onValueChange={(v) => setCopyForm({ ...copyForm, condition: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="bom">Bom</SelectItem>
                    <SelectItem value="gasto">Gasto</SelectItem>
                    <SelectItem value="danificado">Danificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Disponibilidade</Label>
                <Select
                  value={copyForm.status}
                  onValueChange={(v) => setCopyForm({ ...copyForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="emprestado">Emprestado</SelectItem>
                    <SelectItem value="extraviado">Extraviado</SelectItem>
                    <SelectItem value="descartado">Descartado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Observações do Exemplar</Label>
              <Input
                placeholder="Ex: capa amassada, página 12 rasgada..."
                value={copyForm.notes}
                onChange={(e) => setCopyForm({ ...copyForm, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editingCopy && handleDeleteCopy(editingCopy)}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Excluir
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCopyEditOpen(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveCopyEdit}
                disabled={savingCopy}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {savingCopy ? 'Salvando...' : 'Salvar Exemplar'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Novo Empréstimo */}
      <Dialog open={loanOpen} onOpenChange={setLoanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Empréstimo de Livro</DialogTitle>
            <DialogDescription className="text-xs">
              Selecione o exemplar e a criança. O sistema valida automaticamente o limite de 2
              livros por aluno e o prazo de 7 dias.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3 text-xs">
            <div className="space-y-1">
              <Label>Exemplar Disponível (Tombo)</Label>
              <Select value={selectedCopyId} onValueChange={setSelectedCopyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um exemplar..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCopies.map((cp) => (
                    <SelectItem key={cp.copyId} value={cp.copyId} className="text-xs">
                      {cp.tombo} — {cp.bookTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Criança / Aluno(a)</Label>
              <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a criança..." />
                </SelectTrigger>
                <SelectContent>
                  {children.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name} (Sala {c.classroom})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setLoanOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateLoan}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Confirmar Empréstimo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
