// Hook de segurança para proteção de usuários e operadores:
// 1. Bloqueia qualquer tentativa de um usuário se promover ou alterar seu próprio papel.
// 2. Impede que qualquer operador não-admin promova alguém a 'admin' (nem dirigente pode criar/promover a admin).
// 3. Garante que apenas admin e dirigente gerenciem operadores e configurações.

onRecordUpdate((e) => {
  const authRecord = e.auth
  const record = e.record

  // Se a alteração for disparada por uma requisição HTTP autenticada
  if (authRecord) {
    const callerRole = authRecord.getString('role')
    const callerId = authRecord.id
    const targetId = record.id

    const originalRole = record.original() ? record.original().getString('role') : ''
    const newRole = record.getString('role')

    // Se o papel está sendo alterado
    if (originalRole !== newRole) {
      // Bloqueia auto-promoção / auto-alteração de papel
      if (callerId === targetId) {
        throw new ForbiddenError(
          'Operadores não possuem permissão para alterar o próprio papel no Sistema Infanto-CEP.',
        )
      }

      // Apenas Admin pode promover alguém a 'admin'
      if (newRole === 'admin' && callerRole !== 'admin') {
        throw new ForbiddenError(
          'Apenas administradores podem promover ou definir um usuário como Administrador.',
        )
      }

      // Apenas Admin e Dirigente podem alterar papéis
      if (callerRole !== 'admin' && callerRole !== 'dirigente') {
        throw new ForbiddenError(
          'Apenas Administrador e Dirigente possuem permissão para gerenciar papéis de operadores.',
        )
      }
    }
  }

  e.next()
}, 'users')

onRecordCreate((e) => {
  const authRecord = e.auth
  const record = e.record

  if (authRecord) {
    const callerRole = authRecord.getString('role')
    const requestedRole = record.getString('role')

    // Apenas admin e dirigente podem criar novos operadores
    if (callerRole !== 'admin' && callerRole !== 'dirigente') {
      throw new ForbiddenError(
        'Apenas Administrador e Dirigente possuem permissão para cadastrar operadores.',
      )
    }

    // Apenas Admin pode criar outro usuário com papel 'admin'
    if (requestedRole === 'admin' && callerRole !== 'admin') {
      throw new ForbiddenError(
        'Apenas administradores podem cadastrar novos operadores com perfil Administrador.',
      )
    }
  }

  e.next()
}, 'users')
