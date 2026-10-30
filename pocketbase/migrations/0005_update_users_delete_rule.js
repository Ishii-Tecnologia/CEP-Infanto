migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Permitir que admins e dirigentes possam excluir operadores, além do próprio usuário se aplicável
    users.deleteRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'dirigente')"

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.deleteRule = 'id = @request.auth.id'
    app.save(users)
  },
)
