import pb from '@/lib/pocketbase/client'
import { Book, BookCopy, BookLoan, LoanStatus } from '@/types'

export const libraryService = {
  async getAllBooks(): Promise<Book[]> {
    const books = await pb.collection('books').getFullList<Book>({
      sort: 'title',
    })

    const copies = await pb.collection('book_copies').getFullList<BookCopy>()
    const copyMap = new Map<string, BookCopy[]>()
    for (const c of copies) {
      const list = copyMap.get(c.book_id) || []
      list.push(c)
      copyMap.set(c.book_id, list)
    }

    return books.map((b) => ({
      ...b,
      copies: copyMap.get(b.id) || [],
    }))
  },

  async getCopies(): Promise<BookCopy[]> {
    return pb.collection('book_copies').getFullList<BookCopy>({
      expand: 'book_id',
      sort: 'copy_number',
    })
  },

  async createBook(bookData: Partial<Book>, initialCopies = 1): Promise<Book> {
    const book = await pb.collection('books').create<Book>(bookData)

    const copies: BookCopy[] = []
    for (let i = 1; i <= Math.max(1, initialCopies); i++) {
      const tombo = `TOMBO-${Date.now().toString().slice(-4)}-${i}`
      const copy = await pb.collection('book_copies').create<BookCopy>({
        book_id: book.id,
        copy_number: tombo,
        condition: 'novo',
        status: 'disponivel',
      })
      copies.push(copy)
    }

    return { ...book, copies }
  },

  async addCopy(
    bookId: string,
    copyNumber: string,
    condition: 'novo' | 'bom' | 'regular' | 'danificado' = 'novo',
  ): Promise<BookCopy> {
    return pb.collection('book_copies').create<BookCopy>({
      book_id: bookId,
      copy_number: copyNumber,
      condition,
      status: 'disponivel',
    })
  },

  async updateBook(id: string, data: Partial<Book>): Promise<Book> {
    return pb.collection('books').update<Book>(id, data)
  },

  async updateCopy(id: string, data: Partial<BookCopy>): Promise<BookCopy> {
    return pb.collection('book_copies').update<BookCopy>(id, data)
  },

  async deleteCopy(id: string): Promise<boolean> {
    await pb.collection('book_copies').delete(id)
    return true
  },

  async deleteBook(id: string): Promise<boolean> {
    await pb.collection('books').delete(id)
    return true
  },

  async getAllLoans(): Promise<BookLoan[]> {
    const loans = await pb.collection('book_loans').getFullList<BookLoan>({
      sort: '-created',
      expand: 'copy_id.book_id,child_id',
    })

    // Atualiza status se vencido
    const now = new Date()
    for (const l of loans) {
      if (l.status === 'active' && l.due_date && new Date(l.due_date) < now) {
        l.status = 'overdue'
      }
    }

    return loans
  },

  async getActiveLoansForChild(childId: string): Promise<BookLoan[]> {
    return pb.collection('book_loans').getFullList<BookLoan>({
      filter: `child_id = "${childId}" && (status = "active" || status = "overdue")`,
      expand: 'copy_id.book_id',
    })
  },

  async borrowBook(copyId: string, childId: string, durationDays = 7): Promise<BookLoan> {
    // 1. Verificar se a criança já tem 2 empréstimos ativos
    const activeLoans = await this.getActiveLoansForChild(childId)
    if (activeLoans.length >= 2) {
      throw new Error(
        'A criança já possui o limite máximo de 2 livros emprestados simultaneamente.',
      )
    }

    // 2. Verificar disponibilidade do exemplar
    const copy = await pb.collection('book_copies').getOne<BookCopy>(copyId)
    if (copy.status !== 'disponivel') {
      throw new Error(`Este exemplar não está disponível (situação atual: ${copy.status}).`)
    }

    const loanDate = new Date()
    const dueDate = new Date()
    dueDate.setDate(loanDate.getDate() + durationDays)

    const loan = await pb.collection('book_loans').create<BookLoan>({
      copy_id: copyId,
      child_id: childId,
      loan_date: loanDate.toISOString(),
      due_date: dueDate.toISOString(),
      status: 'active',
    })

    // Atualizar status do exemplar
    await pb.collection('book_copies').update(copyId, {
      status: 'emprestado',
    })

    return loan
  },

  async returnBook(
    loanId: string,
    condition?: 'novo' | 'bom' | 'regular' | 'danificado',
  ): Promise<BookLoan> {
    const loan = await pb.collection('book_loans').getOne<BookLoan>(loanId)
    const returnDate = new Date().toISOString()

    const updatedLoan = await pb.collection('book_loans').update<BookLoan>(loanId, {
      return_date: returnDate,
      status: 'returned',
    })

    if (loan.copy_id) {
      const copyUpdate: Record<string, any> = { status: 'disponivel' }
      if (condition) copyUpdate.condition = condition
      await pb.collection('book_copies').update(loan.copy_id, copyUpdate)
    }

    return updatedLoan
  },
}
