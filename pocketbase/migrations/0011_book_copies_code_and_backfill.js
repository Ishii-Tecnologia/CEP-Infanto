migrate(
  (app) => {
    // 1. Remover índice UNIQUE global idx_book_copies_number se existir
    const bookCopiesCol = app.findCollectionByNameOrId('book_copies')
    try {
      bookCopiesCol.removeIndex('idx_book_copies_number')
      app.save(bookCopiesCol)
    } catch (_) {}

    // 2. Função auxiliar para extrair prefixo de iniciais do título
    function getTitleInitials(title) {
      if (!title || typeof title !== 'string') return 'EX'
      const clean = title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .trim()

      if (!clean) return 'EX'

      const stopWords = new Set([
        'A',
        'O',
        'AS',
        'OS',
        'UM',
        'UMA',
        'UNS',
        'UMAS',
        'DE',
        'DO',
        'DA',
        'DOS',
        'DAS',
        'EM',
        'NO',
        'NA',
        'NOS',
        'NAS',
        'POR',
        'PARA',
        'COM',
        'E',
        'QUE',
      ])

      const words = clean.split(/\s+/).filter(Boolean)
      const meaningful = words.filter((w) => !stopWords.has(w.toUpperCase()))
      const chosen = meaningful.length > 0 ? meaningful : words

      let initials = chosen
        .slice(0, 4)
        .map((w) => w[0].toUpperCase())
        .join('')

      if (!initials) initials = 'EX'
      return initials
    }

    // 3. Backfill idempotente:
    // Para cada livro, buscar seus exemplares e padronizar copy_number para INICIAIS-sequencial (ex: PP-1, PP-2)
    // se o exemplar ainda contiver 'TOMBO' ou 'T-'
    let books = []
    try {
      books = app.findRecordsByFilter('books', '', 'created', 1000, 0)
    } catch (_) {
      books = []
    }

    // Mapear prefixos usados por outros livros para evitar duplicatas globais se desejado
    const usedPrefixCount = {}

    for (const book of books) {
      const bookId = book.id
      const bookTitle = book.getString('title')
      let prefix = getTitleInitials(bookTitle)

      // Garantir prefixo base único por livro se dois livros gerarem o mesmo prefixo
      if (usedPrefixCount[prefix] !== undefined) {
        usedPrefixCount[prefix] += 1
        prefix = `${prefix}${usedPrefixCount[prefix]}`
      } else {
        usedPrefixCount[prefix] = 1
      }

      let copies = []
      try {
        copies = app.findRecordsByFilter(
          'book_copies',
          `book_id = "${bookId}"`,
          'created,copy_number',
          500,
          0,
        )
      } catch (_) {
        copies = []
      }

      let seq = 1
      for (const copy of copies) {
        const currentNum = copy.getString('copy_number')
        // Se ainda estiver no formato antigo de tombo ou vazio, atualiza para prefix-seq
        if (
          !currentNum ||
          currentNum.toUpperCase().includes('TOMBO') ||
          currentNum.toUpperCase().startsWith('T-')
        ) {
          const newCode = `${prefix}-${seq}`
          copy.set('copy_number', newCode)
          app.save(copy)
        }
        seq++
      }
    }

    // 4. Criar índice único composto (book_id, copy_number) para garantir unicidade por obra
    try {
      bookCopiesCol.addIndex('idx_book_copies_book_number', true, 'book_id, copy_number', '')
      app.save(bookCopiesCol)
    } catch (_) {}
  },
  (app) => {
    // Reverter índice se necessário
    try {
      const bookCopiesCol = app.findCollectionByNameOrId('book_copies')
      bookCopiesCol.removeIndex('idx_book_copies_book_number')
      bookCopiesCol.addIndex('idx_book_copies_number', true, 'copy_number', '')
      app.save(bookCopiesCol)
    } catch (_) {}
  },
)
