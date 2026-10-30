migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Permitir que admins e dirigentes gerenciem os usuários (incluindo redefinir senha sem oldPassword)
    // E permitir que admins e dirigentes atualizem registros de usuários
    users.listRule = "@request.auth.id != ''"
    users.viewRule = "@request.auth.id != ''"
    users.updateRule =
      "@request.auth.id != '' && (id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'dirigente')"
    users.manageRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'dirigente')"

    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.updateRule = 'id = @request.auth.id'
    users.manageRule = null
    app.save(users)
  },
)
