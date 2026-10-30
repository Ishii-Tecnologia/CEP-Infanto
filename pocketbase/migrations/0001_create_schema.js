migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Adicionar campo role e active se não existirem
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'dirigente', 'professor', 'auxiliar', 'bibliotecario'],
          maxSelect: 1,
        }),
      )
    }

    if (!users.fields.getByName('active')) {
      users.fields.add(
        new BoolField({
          name: 'active',
        }),
      )
    }

    app.save(users)

    // Configurações do sistema (ano letivo, feriados, regras)
    const systemSettings = new Collection({
      name: 'system_settings',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'key', type: 'text', required: true },
        { name: 'value', type: 'json' },
        { name: 'description', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_system_settings_key ON system_settings (key)'],
    })
    app.save(systemSettings)

    // Famílias
    const families = new Collection({
      name: 'families',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'reference_name', type: 'text', required: true },
        { name: 'primary_phone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'address', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_families_ref_name ON families (reference_name)'],
    })
    app.save(families)

    const familiesId = families.id

    // Responsáveis
    const guardians = new Collection({
      name: 'guardians',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'family_id',
          type: 'relation',
          collectionId: familiesId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'relationship', type: 'text' }, // Pai, Mãe, Avô, etc.
        { name: 'phone', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'is_emergency_contact', type: 'bool' },
        { name: 'photo_url', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_guardians_family ON guardians (family_id)'],
    })
    app.save(guardians)

    // Crianças
    const children = new Collection({
      name: 'children',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'family_id',
          type: 'relation',
          collectionId: familiesId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        { name: 'name', type: 'text', required: true },
        { name: 'birth_date', type: 'date', required: true },
        {
          name: 'classroom',
          type: 'select',
          values: ['A', 'B', 'C', 'D'],
          maxSelect: 1,
          required: true,
        },
        { name: 'photo_url', type: 'text' },
        { name: 'allergies', type: 'text' },
        { name: 'medical_notes', type: 'text' },
        { name: 'image_authorized', type: 'bool' },
        { name: 'dimdim_balance', type: 'number' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_children_family ON children (family_id)',
        'CREATE INDEX idx_children_classroom ON children (classroom)',
      ],
    })
    app.save(children)

    const childrenId = children.id

    // Aulas (Sábados Letivos)
    const lessons = new Collection({
      name: 'lessons',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'date', type: 'date', required: true },
        { name: 'year', type: 'number', required: true },
        { name: 'session_number', type: 'number' },
        { name: 'central_theme', type: 'text', required: true },
        { name: 'thematic_block', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['scheduled', 'completed', 'canceled'],
          maxSelect: 1,
          required: true,
        },
        { name: 'cancel_reason', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_lessons_date ON lessons (date)',
        'CREATE INDEX idx_lessons_year ON lessons (year)',
      ],
    })
    app.save(lessons)

    const lessonsId = lessons.id

    // Planos Pedagógicos por Sala
    const lessonPlans = new Collection({
      name: 'lesson_plans',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'lesson_id',
          type: 'relation',
          collectionId: lessonsId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'classroom',
          type: 'select',
          values: ['A', 'B', 'C', 'D'],
          maxSelect: 1,
          required: true,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'objective', type: 'text' },
        { name: 'approach', type: 'text' },
        { name: 'materials', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_lesson_plans_lesson_classroom ON lesson_plans (lesson_id, classroom)',
      ],
    })
    app.save(lessonPlans)

    // Presenças
    const attendances = new Collection({
      name: 'attendances',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'lesson_id',
          type: 'relation',
          collectionId: lessonsId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'child_id',
          type: 'relation',
          collectionId: childrenId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'classroom',
          type: 'select',
          values: ['A', 'B', 'C', 'D'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          values: ['present', 'absent', 'justified'],
          maxSelect: 1,
          required: true,
        },
        { name: 'justification', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_attendances_lesson_child ON attendances (lesson_id, child_id)',
      ],
    })
    app.save(attendances)

    // Livros da Biblioteca
    const books = new Collection({
      name: 'books',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'author', type: 'text' },
        { name: 'publisher', type: 'text' },
        { name: 'target_audience', type: 'text' }, // Ex: Sala A/B, Infantil, etc.
        { name: 'category', type: 'text' },
        { name: 'description', type: 'text' },
        { name: 'cover_url', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_books_title ON books (title)'],
    })
    app.save(books)

    const booksId = books.id

    // Exemplares Físicos (por Tombo)
    const bookCopies = new Collection({
      name: 'book_copies',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'book_id',
          type: 'relation',
          collectionId: booksId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        { name: 'copy_number', type: 'text', required: true }, // Número de tombo
        {
          name: 'condition',
          type: 'select',
          values: ['novo', 'bom', 'regular', 'danificado'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          values: ['disponivel', 'emprestado', 'extraviado', 'manutencao'],
          maxSelect: 1,
          required: true,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_book_copies_number ON book_copies (copy_number)',
        'CREATE INDEX idx_book_copies_book ON book_copies (book_id)',
      ],
    })
    app.save(bookCopies)

    const bookCopiesId = bookCopies.id

    // Empréstimos da Biblioteca
    const bookLoans = new Collection({
      name: 'book_loans',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'copy_id',
          type: 'relation',
          collectionId: bookCopiesId,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'child_id',
          type: 'relation',
          collectionId: childrenId,
          maxSelect: 1,
          required: true,
        },
        { name: 'loan_date', type: 'date', required: true },
        { name: 'due_date', type: 'date', required: true },
        { name: 'return_date', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['active', 'returned', 'overdue'],
          maxSelect: 1,
          required: true,
        },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_book_loans_child ON book_loans (child_id)',
        'CREATE INDEX idx_book_loans_status ON book_loans (status)',
      ],
    })
    app.save(bookLoans)

    // Transações DimDim
    const dimdimTransactions = new Collection({
      name: 'dimdim_transactions',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'child_id',
          type: 'relation',
          collectionId: childrenId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'type',
          type: 'select',
          values: ['credit', 'debit', 'reversal'],
          maxSelect: 1,
          required: true,
        },
        { name: 'amount', type: 'number', required: true },
        { name: 'reason', type: 'text', required: true },
        {
          name: 'category',
          type: 'select',
          values: ['presenca', 'tarefa', 'comportamento', 'premiacao', 'outros'],
          maxSelect: 1,
        },
        { name: 'reversal_of_id', type: 'text' },
        { name: 'notes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_dimdim_child ON dimdim_transactions (child_id)'],
    })
    app.save(dimdimTransactions)
  },
  (app) => {
    const toDelete = [
      'dimdim_transactions',
      'book_loans',
      'book_copies',
      'books',
      'attendances',
      'lesson_plans',
      'lessons',
      'children',
      'guardians',
      'families',
      'system_settings',
    ]

    for (const name of toDelete) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
