// Hook para interceptar envios de e-mails transacionais (redefinição de senha, verificação, alertas)
// e garantir que qualquer referência institucional em mensagens e assuntos seja substituída por "Sistema Infanto-CEP".
onMailerSend((e) => {
  if (e && e.message) {
    const replaceLegacyNames = (str) => {
      if (!str || typeof str !== 'string') return str
      return str
        .replace(/CEP-Cologação\s+Esp[ií]rita\s+Progressista/gi, 'Sistema Infanto-CEP')
        .replace(/CEP-Coligação\s+Esp[ií]rita\s+Progressista/gi, 'Sistema Infanto-CEP')
        .replace(/CEP-Coligacao\s+Espirita\s+Progressista/gi, 'Sistema Infanto-CEP')
    }

    if (e.message.subject) {
      e.message.subject = replaceLegacyNames(e.message.subject)
    }

    if (e.message.html) {
      e.message.html = replaceLegacyNames(e.message.html)
    }
  }

  e.next()
})
