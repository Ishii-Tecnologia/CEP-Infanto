migrate(
  (app) => {
    const childCol = app.findCollectionByNameOrId('children')
    const famCol = app.findCollectionByNameOrId('families')
    const attCol = app.findCollectionByNameOrId('attendances')
    const lessonCol = app.findCollectionByNameOrId('lessons')

    // 1. Cadastrar algumas crianças a mais nas salas B, C e D se não existirem
    try {
      const famSilva = app.findFirstRecordByData(
        'families',
        'reference_name',
        'Família Silva Santos',
      )

      const extraChildren = [
        {
          name: 'Thiago Farias',
          birth: '2019-03-12',
          classroom: 'B',
          balance: 30,
          famId: famSilva.id,
          photo: 'https://img.usecurling.com/ppl/medium?gender=male&seed=107',
        },
        {
          name: 'Helena Castro',
          birth: '2020-01-25',
          classroom: 'B',
          balance: 40,
          famId: famSilva.id,
          photo: 'https://img.usecurling.com/ppl/medium?gender=female&seed=108',
        },
        {
          name: 'Pedro Henrique Lima',
          birth: '2015-06-30',
          classroom: 'D',
          balance: 60,
          famId: famSilva.id,
          photo: 'https://img.usecurling.com/ppl/medium?gender=male&seed=109',
        },
        {
          name: 'Camila Duarte',
          birth: '2022-07-19',
          classroom: 'A',
          balance: 25,
          famId: famSilva.id,
          photo: 'https://img.usecurling.com/ppl/medium?gender=female&seed=110',
        },
      ]

      for (const item of extraChildren) {
        try {
          app.findFirstRecordByData('children', 'name', item.name)
        } catch (_) {
          const rec = new Record(childCol)
          rec.set('family_id', item.famId)
          rec.set('name', item.name)
          rec.set('birth_date', item.birth + ' 00:00:00.000Z')
          rec.set('classroom', item.classroom)
          rec.set('photo_url', item.photo)
          rec.set('dimdim_balance', item.balance)
          rec.set('image_authorized', true)
          rec.set('active', true)
          app.save(rec)
        }
      }
    } catch (e) {
      console.log('Erro ao criar crianças extras:', e)
    }

    // 2. Marcar uma aula como cancelada para testar o requisito de não contar aulas canceladas
    try {
      const lesson5 = app.findFirstRecordByData('lessons', 'session_number', 5)
      if (lesson5 && lesson5.getString('status') !== 'canceled') {
        lesson5.set('status', 'canceled')
        lesson5.set('cancel_reason', 'Chuva torrencial e manutenção na sede')
        app.save(lesson5)
      }
    } catch (e) {
      console.log('Erro ao atualizar aula 5:', e)
    }

    // 3. Gerar chamadas para as aulas 1, 2, 3 e 4 nas diferentes salas
    try {
      const lessons = app.findRecordsByFilter(
        'lessons',
        'session_number <= 4',
        'session_number',
        4,
        0,
      )
      const allChildren = app.findRecordsByFilter('children', 'active = true', 'name', 50, 0)

      for (const les of lessons) {
        const sessNum = les.getInt('session_number')

        for (const ch of allChildren) {
          const chId = ch.id
          const chRoom = ch.getString('classroom')
          const chName = ch.getString('name')

          // Verificar se já existe registro
          const existing = app.findRecordsByFilter(
            'attendances',
            `lesson_id = "${les.id}" && child_id = "${chId}"`,
            '',
            1,
            0,
          )
          if (existing.length > 0) continue

          let status = 'present'
          let just = ''
          let note = ''

          // Simulação com casos ricos:
          // Enzo Mendes Rocha (Sala A): muitas faltas para testar destaque de < 70% ou faltas consecutivas
          if (chName.includes('Enzo')) {
            if (sessNum >= 2) {
              status = sessNum === 3 ? 'justified' : 'absent'
              just = sessNum === 3 ? 'Gripe forte com atestado' : ''
              note = sessNum === 4 ? 'A família avisou que não compareceria' : ''
            }
          } else if (chName.includes('Camila')) {
            if (sessNum === 2) {
              status = 'absent'
              note = 'Sem aviso'
            }
          } else if (chName.includes('Thiago')) {
            if (sessNum === 2 || sessNum === 4) {
              status = sessNum === 2 ? 'absent' : 'justified'
              just = sessNum === 4 ? 'Viagem com os avós' : ''
            }
          } else if (chName.includes('Beatriz')) {
            if (sessNum === 3) {
              status = 'justified'
              just = 'Consulta com nutricionista'
            }
          } else if (chName.includes('Pedro Henrique')) {
            if (sessNum === 1 || sessNum === 3) {
              status = 'absent'
              note = 'Faltou sem contato prévio'
            }
          }

          const att = new Record(attCol)
          att.set('lesson_id', les.id)
          att.set('child_id', chId)
          att.set('classroom', chRoom)
          att.set('status', status)
          att.set('justification', just)
          att.set('notes', note)
          app.save(att)
        }
      }
    } catch (e) {
      console.log('Erro ao criar presenças na migration 0006:', e)
    }
  },
  (app) => {},
)
