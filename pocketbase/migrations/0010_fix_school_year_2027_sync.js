migrate(
  (app) => {
    // 1. Assegurar que school_year contenha o ano consistente com startDate (2027)
    try {
      const schoolYearRec = app.findFirstRecordByData('system_settings', 'key', 'school_year')
      schoolYearRec.set(
        'value',
        JSON.stringify({
          year: 2027,
          startDate: '2027-03-06',
          endDate: '2027-11-27',
          ageBaseDate: '2027-03-01',
          winterBreakStart: '2027-07-04',
          winterBreakEnd: '2027-07-18',
          christmasDate: '2027-12-04',
        }),
      )
      schoolYearRec.set('description', 'Ano letivo ativo e datas de corte')
      app.save(schoolYearRec)
    } catch (_) {}

    // 2. Assegurar que os feriados de 2027 estejam gravados na chave holidays_2027
    const defaultRecesses2027 = [
      { date: '2027-03-27', name: 'Sábado de Páscoa (Páscoa 28/03)' },
      { date: '2027-04-17', name: 'Sábado emenda de Tiradentes (21/04)' },
      { date: '2027-05-01', name: 'Dia do Trabalho' },
      { date: '2027-05-29', name: 'Sábado emenda de Corpus Christi (27/05)' },
      { date: '2027-07-10', name: 'Férias de Julho - Semana 1' },
      { date: '2027-07-17', name: 'Férias de Julho - Semana 2' },
      { date: '2027-09-04', name: 'Sábado emenda da Independência (07/09)' },
      { date: '2027-10-09', name: 'Sábado emenda N. Sra. Aparecida (12/10)' },
      { date: '2027-10-30', name: 'Sábado emenda Finados (02/11)' },
      { date: '2027-11-13', name: 'Sábado emenda Proclamação da República (15/11)' },
    ]

    try {
      const holRec = app.findFirstRecordByData('system_settings', 'key', 'holidays_2027')
      holRec.set('value', JSON.stringify(defaultRecesses2027))
      app.save(holRec)
    } catch (_) {}
  },
  (app) => {
    // Reversão no-op
  },
)
