migrate(
  (app) => {
    // 1. Atualizar regras da coleção 'users' (_pb_users_auth_)
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // create: apenas admin e dirigente podem cadastrar novos operadores
    users.createRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente')"

    // update:
    // - admin pode atualizar qualquer usuário (incluindo papéis)
    // - dirigente pode atualizar usuários desde que não promova a admin (@request.body.role != 'admin')
    // - usuário comum pode atualizar apenas seu próprio registro (id = @request.auth.id),
    //   mas NUNCA alterar seu papel (@request.body.role:changed = false)
    users.updateRule =
      "@request.auth.id != '' && (" +
      "@request.auth.role = 'admin' || " +
      "(@request.auth.role = 'dirigente' && @request.body.role != 'admin') || " +
      '(id = @request.auth.id && @request.body.role:changed = false)' +
      ')'

    // delete: apenas admin e dirigente podem excluir usuários (usuário comum não pode)
    users.deleteRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente')"

    // manageRule: apenas admin e dirigente
    users.manageRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente')"

    app.save(users)

    // 2. Atualizar regras de 'system_settings': apenas admin e dirigente gerenciam configurações
    const systemSettings = app.findCollectionByNameOrId('system_settings')
    systemSettings.listRule = "@request.auth.id != ''"
    systemSettings.viewRule = "@request.auth.id != ''"
    systemSettings.createRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente')"
    systemSettings.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente')"
    systemSettings.deleteRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente')"
    app.save(systemSettings)

    // 3. Atualizar regras de coleções da biblioteca (books, book_copies, book_loans)
    // - list/view: qualquer operador autenticado pode consultar o acervo
    // - create/update/delete: admin, dirigente, bibliotecario e professor
    const books = app.findCollectionByNameOrId('books')
    books.listRule = "@request.auth.id != ''"
    books.viewRule = "@request.auth.id != ''"
    books.createRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente' || @request.auth.role = 'bibliotecario' || @request.auth.role = 'professor')"
    books.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente' || @request.auth.role = 'bibliotecario' || @request.auth.role = 'professor')"
    books.deleteRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente' || @request.auth.role = 'bibliotecario' || @request.auth.role = 'professor')"
    app.save(books)

    const bookCopies = app.findCollectionByNameOrId('book_copies')
    bookCopies.listRule = "@request.auth.id != ''"
    bookCopies.viewRule = "@request.auth.id != ''"
    bookCopies.createRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente' || @request.auth.role = 'bibliotecario' || @request.auth.role = 'professor')"
    bookCopies.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente' || @request.auth.role = 'bibliotecario' || @request.auth.role = 'professor')"
    bookCopies.deleteRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente' || @request.auth.role = 'bibliotecario' || @request.auth.role = 'professor')"
    app.save(bookCopies)

    const bookLoans = app.findCollectionByNameOrId('book_loans')
    bookLoans.listRule = "@request.auth.id != ''"
    bookLoans.viewRule = "@request.auth.id != ''"
    bookLoans.createRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente' || @request.auth.role = 'bibliotecario' || @request.auth.role = 'professor')"
    bookLoans.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente' || @request.auth.role = 'bibliotecario' || @request.auth.role = 'professor')"
    bookLoans.deleteRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente' || @request.auth.role = 'bibliotecario' || @request.auth.role = 'professor')"
    app.save(bookLoans)

    // 4. Coleções pedagógicas (families, guardians, children, lessons, lesson_plans, attendances, dimdim_transactions)
    // Bibliotecário acessa apenas biblioteca, não gerencia famílias/chamadas/dimdim.
    // Admin, dirigente, professor e auxiliar gerenciam.
    const pedagogicalCols = [
      'families',
      'guardians',
      'children',
      'lessons',
      'lesson_plans',
      'attendances',
      'dimdim_transactions',
    ]

    for (const colName of pedagogicalCols) {
      try {
        const col = app.findCollectionByNameOrId(colName)
        col.listRule = "@request.auth.id != ''"
        col.viewRule = "@request.auth.id != ''"
        col.createRule =
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente' || @request.auth.role = 'professor' || @request.auth.role = 'auxiliar')"
        col.updateRule =
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente' || @request.auth.role = 'professor' || @request.auth.role = 'auxiliar')"
        col.deleteRule =
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente' || @request.auth.role = 'professor' || @request.auth.role = 'auxiliar')"
        app.save(col)
      } catch (_) {}
    }
  },
  (app) => {
    // Reversão
  },
)
