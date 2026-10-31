migrate(
  (app) => {
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'admin@cep.org.br')
      user.setPassword('Skip@Pass')
      user.set('role', 'admin')
      user.set('active', true)
      user.setVerified(true)
      app.save(user)
    } catch (err) {
      // Caso não exista por alguma razão, cria
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const user = new Record(usersCol)
      user.setEmail('admin@cep.org.br')
      user.setPassword('Skip@Pass')
      user.set('name', 'Admin Infanto')
      user.set('role', 'admin')
      user.set('active', true)
      user.setVerified(true)
      app.save(user)
    }
  },
  (app) => {
    // Reversão não necessária para redefinição de senha
  },
)
