migrate(
  (app) => {
    // 1. Assegurar que a configuração ativa de school_year aponte para 2027
    const settingsCol = app.findCollectionByNameOrId('system_settings')
    let schoolYearRec
    try {
      schoolYearRec = app.findFirstRecordByData('system_settings', 'key', 'school_year')
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
    } catch (_) {
      schoolYearRec = new Record(settingsCol)
      schoolYearRec.set('key', 'school_year')
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
    }

    // 2. Limpar eventuais registros órfãos ou incompletos do ano de teste 2026 gerados durante o rate limit
    // Note: Attendances e dados reais históricos de 2027 estão intactos e vinculados às aulas de 2027.
    try {
      const lessons2026 = app.findRecordsByFilter(
        'lessons',
        'year = 2026',
        'session_number',
        100,
        0,
      )
      for (const l of lessons2026) {
        // Remove planos associados
        const plans = app.findRecordsByFilter('lesson_plans', 'lesson_id = {:lid}', '', 100, 0, {
          lid: l.id,
        })
        for (const p of plans) {
          app.delete(p)
        }
        app.delete(l)
      }
    } catch (e) {
      console.log('Cleanup 2026 lessons check:', e)
    }
  },
  (app) => {
    // Reversão no-op
  },
)
