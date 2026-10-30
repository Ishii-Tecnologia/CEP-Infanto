migrate(
  (app) => {
    const childCol = app.findCollectionByNameOrId('children')
    const copyCol = app.findCollectionByNameOrId('book_copies')
    const loanCol = app.findCollectionByNameOrId('book_loans')
    const dimCol = app.findCollectionByNameOrId('dimdim_transactions')
    const lessonCol = app.findCollectionByNameOrId('lessons')
    const attCol = app.findCollectionByNameOrId('attendances')

    // Buscar uma criança e uma cópia para criar um empréstimo de exemplo
    try {
      const childLucas = app.findFirstRecordByData('children', 'name', 'Lucas Silva Santos')
      const childBeatriz = app.findFirstRecordByData('children', 'name', 'Beatriz Silva Santos')
      const copy1 = app.findFirstRecordByData('book_copies', 'copy_number', 'TOMBO-001')
      const copy2 = app.findFirstRecordByData('book_copies', 'copy_number', 'TOMBO-003')

      // Empréstimo ativo para Lucas
      const loan1 = new Record(loanCol)
      loan1.set('copy_id', copy1.id)
      loan1.set('child_id', childLucas.id)
      loan1.set('loan_date', '2027-03-06 10:00:00.000Z')
      loan1.set('due_date', '2027-03-13 10:00:00.000Z')
      loan1.set('status', 'active')
      app.save(loan1)

      copy1.set('status', 'emprestado')
      app.save(copy1)

      // Empréstimo atrasado para Beatriz (para teste de alerta no painel)
      const loan2 = new Record(loanCol)
      loan2.set('copy_id', copy2.id)
      loan2.set('child_id', childBeatriz.id)
      loan2.set('loan_date', '2027-02-20 10:00:00.000Z')
      loan2.set('due_date', '2027-02-27 10:00:00.000Z')
      loan2.set('status', 'overdue')
      loan2.set('notes', 'Aguardando devolução no próximo sábado')
      app.save(loan2)

      copy2.set('status', 'emprestado')
      app.save(copy2)

      // Transações DimDim para as crianças
      const tx1 = new Record(dimCol)
      tx1.set('child_id', childLucas.id)
      tx1.set('type', 'credit')
      tx1.set('amount', 10)
      tx1.set('reason', 'Presença pontual na aula inaugural')
      tx1.set('category', 'presenca')
      app.save(tx1)

      const tx2 = new Record(dimCol)
      tx2.set('child_id', childLucas.id)
      tx2.set('type', 'credit')
      tx2.set('amount', 25)
      tx2.set('reason', 'Colaboração e dedicação nas atividades')
      tx2.set('category', 'tarefa')
      app.save(tx2)

      const tx3 = new Record(dimCol)
      tx3.set('child_id', childBeatriz.id)
      tx3.set('type', 'credit')
      tx3.set('amount', 50)
      tx3.set('reason', 'Ajudou a organizar a sala e participou com alegria')
      tx3.set('category', 'comportamento')
      app.save(tx3)

      // Registrar presenças na primeira aula (2027-03-06)
      const firstLesson = app.findFirstRecordByData('lessons', 'session_number', 1)
      if (firstLesson) {
        const att1 = new Record(attCol)
        att1.set('lesson_id', firstLesson.id)
        att1.set('child_id', childLucas.id)
        att1.set('classroom', 'A')
        att1.set('status', 'present')
        att1.set('notes', 'Participou com muito entusiasmo')
        app.save(att1)

        const att2 = new Record(attCol)
        att2.set('lesson_id', firstLesson.id)
        att2.set('child_id', childBeatriz.id)
        att2.set('classroom', 'B')
        att2.set('status', 'present')
        att2.set('notes', '')
        app.save(att2)
      }
    } catch (err) {
      console.log('Seed loan/dimdim erro ou já executado:', err)
    }
  },
  (app) => {},
)
