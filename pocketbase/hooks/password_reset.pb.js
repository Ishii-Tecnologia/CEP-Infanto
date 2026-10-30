routerAdd(
  'POST',
  '/backend/v1/reset-operator-password',
  (e) => {
    const authRecord = e.auth
    if (!authRecord) {
      throw new ForbiddenError('Acesso não autorizado.')
    }

    const role = authRecord.getString('role')
    if (role !== 'admin' && role !== 'dirigente') {
      throw new ForbiddenError(
        'Apenas administradores e dirigentes podem redefinir senhas de operadores.',
      )
    }

    const body = e.bindBody({})
    const userId = body.userId
    const newPassword = body.newPassword

    if (!userId || !newPassword) {
      throw new BadRequestError('userId e newPassword são obrigatórios.')
    }

    if (newPassword.length < 8) {
      throw new BadRequestError('A nova senha deve ter no mínimo 8 caracteres.')
    }

    try {
      const targetUser = e.app.findRecordById('users', userId)
      targetUser.setPassword(newPassword)
      e.app.save(targetUser)

      return e.json(200, {
        success: true,
        message: 'Senha redefinida com sucesso.',
        userId: targetUser.id,
        email: targetUser.getString('email'),
      })
    } catch (err) {
      throw new BadRequestError('Usuário não encontrado ou erro ao salvar: ' + (err.message || err))
    }
  },
  $apis.requireAuth('users'),
)
