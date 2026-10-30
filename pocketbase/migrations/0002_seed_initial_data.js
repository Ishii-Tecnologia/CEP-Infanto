migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Usuário principal do sistema
    const defaultUsers = [
      { email: 'ishii7883@gmail.com', name: 'Administrador Geral', role: 'admin' },
      { email: 'dirigente@cep.org.br', name: 'Maria Luísa (Dirigente)', role: 'dirigente' },
      {
        email: 'prof.claudia@cep.org.br',
        name: 'Cláudia Silveira (Prof. Sala A)',
        role: 'professor',
      },
      { email: 'prof.andre@cep.org.br', name: 'André Farias (Prof. Sala B)', role: 'professor' },
      { email: 'auxiliar.lucas@cep.org.br', name: 'Lucas Menezes (Auxiliar)', role: 'auxiliar' },
      {
        email: 'biblio.teresa@cep.org.br',
        name: 'Teresa Cristina (Bibliotecária)',
        role: 'bibliotecario',
      },
    ]

    for (const u of defaultUsers) {
      try {
        app.findAuthRecordByEmail('_pb_users_auth_', u.email)
      } catch (_) {
        const record = new Record(users)
        record.setEmail(u.email)
        record.setPassword('Skip@Pass')
        record.setVerified(true)
        record.set('name', u.name)
        record.set('role', u.role)
        record.set('active', true)
        app.save(record)
      }
    }

    // 2. Configurações Iniciais
    const settingsCol = app.findCollectionByNameOrId('system_settings')
    const initialSettings = [
      {
        key: 'school_year',
        value: JSON.stringify({
          year: 2027,
          startDate: '2027-03-06',
          endDate: '2027-11-27',
          ageBaseDate: '2027-03-01',
        }),
        description: 'Ano letivo ativo e datas de corte',
      },
      {
        key: 'classrooms',
        value: JSON.stringify([
          {
            id: 'A',
            name: 'Sala A',
            minAge: 3,
            maxAge: 5,
            description: 'Maternal e Jardim (3 a 5 anos completos até 01/03)',
          },
          {
            id: 'B',
            name: 'Sala B',
            minAge: 6,
            maxAge: 8,
            description: 'Ciclo 1 (6 a 8 anos completos até 01/03)',
          },
          {
            id: 'C',
            name: 'Sala C',
            minAge: 9,
            maxAge: 11,
            description: 'Ciclo 2 (9 a 11 anos completos até 01/03)',
          },
          {
            id: 'D',
            name: 'Sala D',
            minAge: 12,
            maxAge: 14,
            description: 'Juventude 1 (12 a 14 anos completos até 01/03)',
          },
        ]),
        description: 'Configuração das salas por faixa etária',
      },
      {
        key: 'holidays_2027',
        value: JSON.stringify([
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
        ]),
        description: 'Feriados e janelas de recesso para 2027',
      },
      {
        key: 'rules_library',
        value: JSON.stringify({
          maxLoansPerChild: 2,
          loanDurationDays: 7,
          renewalsAllowed: 1,
        }),
        description: 'Regras da biblioteca infantil',
      },
      {
        key: 'rules_dimdim',
        value: JSON.stringify({
          attendanceReward: 10,
          taskReward: 5,
          goodBehaviorReward: 5,
          defaultRewardCost: 20,
        }),
        description: 'Parâmetros e limites da moeda educativa DimDim',
      },
    ]

    for (const s of initialSettings) {
      try {
        app.findFirstRecordByData('system_settings', 'key', s.key)
      } catch (_) {
        const rec = new Record(settingsCol)
        rec.set('key', s.key)
        rec.set('value', s.value)
        rec.set('description', s.description)
        app.save(rec)
      }
    }

    // 3. Famílias e Crianças de Exemplo
    const famCol = app.findCollectionByNameOrId('families')
    const guardCol = app.findCollectionByNameOrId('guardians')
    const childCol = app.findCollectionByNameOrId('children')

    const familiesData = [
      {
        ref: 'Família Silva Santos',
        phone: '(11) 98765-4321',
        email: 'contato.silva@email.com',
        address: 'Rua das Flores, 120 - Santana, São Paulo',
        guardians: [
          {
            name: 'Juliana Silva Santos',
            rel: 'Mãe',
            phone: '(11) 98765-4321',
            email: 'juliana@email.com',
            emergency: true,
            photo: 'https://img.usecurling.com/ppl/medium?gender=female&seed=1',
          },
          {
            name: 'Ricardo Santos',
            rel: 'Pai',
            phone: '(11) 98765-4322',
            email: 'ricardo@email.com',
            emergency: false,
            photo: 'https://img.usecurling.com/ppl/medium?gender=male&seed=2',
          },
        ],
        children: [
          {
            name: 'Lucas Silva Santos',
            birth: '2022-05-14',
            classroom: 'A',
            photo: 'https://img.usecurling.com/ppl/medium?gender=male&seed=101',
            allergies: 'Nenhuma',
            med: '',
            imageAuth: true,
            balance: 35,
          },
          {
            name: 'Beatriz Silva Santos',
            birth: '2019-08-20',
            classroom: 'B',
            photo: 'https://img.usecurling.com/ppl/medium?gender=female&seed=102',
            allergies: 'Lactose',
            med: 'Evitar alimentos com leite integral',
            imageAuth: true,
            balance: 50,
          },
        ],
      },
      {
        ref: 'Família Oliveira Costa',
        phone: '(11) 97654-3210',
        email: 'oliveira.costa@email.com',
        address: 'Av. Paulista, 1500, Apto 42 - Bela Vista',
        guardians: [
          {
            name: 'Fernanda Oliveira Costa',
            rel: 'Mãe',
            phone: '(11) 97654-3210',
            email: 'fernanda@email.com',
            emergency: true,
            photo: 'https://img.usecurling.com/ppl/medium?gender=female&seed=3',
          },
        ],
        children: [
          {
            name: 'Gabriel Oliveira Costa',
            birth: '2016-11-10',
            classroom: 'C',
            photo: 'https://img.usecurling.com/ppl/medium?gender=male&seed=103',
            allergies: 'Picada de abelha',
            med: 'Alerta para insetos no jardim',
            imageAuth: true,
            balance: 65,
          },
        ],
      },
      {
        ref: 'Família Almeida Prado',
        phone: '(11) 96543-2109',
        email: 'almeida.prado@email.com',
        address: 'Rua Vergueiro, 890 - Vila Mariana',
        guardians: [
          {
            name: 'Carlos Almeida Prado',
            rel: 'Pai',
            phone: '(11) 96543-2109',
            email: 'carlos@email.com',
            emergency: true,
            photo: 'https://img.usecurling.com/ppl/medium?gender=male&seed=4',
          },
        ],
        children: [
          {
            name: 'Mariana Almeida Prado',
            birth: '2014-02-18',
            classroom: 'D',
            photo: 'https://img.usecurling.com/ppl/medium?gender=female&seed=104',
            allergies: '',
            med: '',
            imageAuth: true,
            balance: 80,
          },
        ],
      },
      {
        ref: 'Família Mendes Rocha',
        phone: '(11) 95432-1098',
        email: 'mendes.rocha@email.com',
        address: 'Rua Domingos de Morais, 450 - Vila Mariana',
        guardians: [
          {
            name: 'Patrícia Mendes Rocha',
            rel: 'Tia / Tutora',
            phone: '(11) 95432-1098',
            email: 'patricia@email.com',
            emergency: true,
            photo: 'https://img.usecurling.com/ppl/medium?gender=female&seed=5',
          },
        ],
        children: [
          {
            name: 'Enzo Mendes Rocha',
            birth: '2021-09-05',
            classroom: 'A',
            photo: 'https://img.usecurling.com/ppl/medium?gender=male&seed=105',
            allergies: '',
            med: 'Usa bombinha para asma se necessário',
            imageAuth: false,
            balance: 20,
          },
          {
            name: 'Sofia Mendes Rocha',
            birth: '2017-04-12',
            classroom: 'C',
            photo: 'https://img.usecurling.com/ppl/medium?gender=female&seed=106',
            allergies: '',
            med: '',
            imageAuth: true,
            balance: 45,
          },
        ],
      },
    ]

    for (const f of familiesData) {
      try {
        app.findFirstRecordByData('families', 'reference_name', f.ref)
      } catch (_) {
        const famRec = new Record(famCol)
        famRec.set('reference_name', f.ref)
        famRec.set('primary_phone', f.phone)
        famRec.set('email', f.email)
        famRec.set('address', f.address)
        app.save(famRec)

        for (const g of f.guardians) {
          const gRec = new Record(guardCol)
          gRec.set('family_id', famRec.id)
          gRec.set('name', g.name)
          gRec.set('relationship', g.rel)
          gRec.set('phone', g.phone)
          gRec.set('email', g.email)
          gRec.set('is_emergency_contact', g.emergency)
          gRec.set('photo_url', g.photo)
          app.save(gRec)
        }

        for (const c of f.children) {
          const cRec = new Record(childCol)
          cRec.set('family_id', famRec.id)
          cRec.set('name', c.name)
          cRec.set('birth_date', c.birth + ' 00:00:00.000Z')
          cRec.set('classroom', c.classroom)
          cRec.set('photo_url', c.photo)
          cRec.set('allergies', c.allergies)
          cRec.set('medical_notes', c.med)
          cRec.set('image_authorized', c.imageAuth)
          cRec.set('dimdim_balance', c.balance)
          cRec.set('active', true)
          app.save(cRec)
        }
      }
    }

    // 4. Calendário 2027 (30 Sábados Letivos) com Matriz Pedagógica
    const lessonCol = app.findCollectionByNameOrId('lessons')
    const planCol = app.findCollectionByNameOrId('lesson_plans')

    const themesData = [
      {
        num: 1,
        date: '2027-03-06',
        block: 'Deus e a Criação',
        theme: 'Deus, Pai e Criador de Todas as Coisas',
      },
      {
        num: 2,
        date: '2027-03-13',
        block: 'Deus e a Criação',
        theme: 'A Natureza e a Bondade Divina',
      },
      {
        num: 3,
        date: '2027-03-20',
        block: 'Deus e a Criação',
        theme: 'Cuidando do Nosso Planeta e dos Seres Vivos',
      },
      {
        num: 4,
        date: '2027-04-03',
        block: 'Jesus e Seus Ensinos',
        theme: 'Quem é Jesus: Nosso Mestre e Amigo',
      },
      {
        num: 5,
        date: '2027-04-10',
        block: 'Jesus e Seus Ensinos',
        theme: 'A Parábola do Bom Samaritano: Amor ao Próximo',
      },
      {
        num: 6,
        date: '2027-04-24',
        block: 'Jesus e Seus Ensinos',
        theme: 'O Sermão da Montanha: Bem-Aventurados os Mansos',
      },
      {
        num: 7,
        date: '2027-05-08',
        block: 'Família e Convivência',
        theme: 'A Importância da Família e o Respeito aos Pais',
      },
      {
        num: 8,
        date: '2027-05-15',
        block: 'Família e Convivência',
        theme: 'Paciência e Compreensão no Lar',
      },
      {
        num: 9,
        date: '2027-05-22',
        block: 'Família e Convivência',
        theme: 'Fraternidade e Amizade entre Irmãos e Colegas',
      },
      {
        num: 10,
        date: '2027-06-05',
        block: 'Mundo Espiritual e Prece',
        theme: 'A Alma e os Espíritos Protetores (Anjo Guardião)',
      },
      {
        num: 11,
        date: '2027-06-12',
        block: 'Mundo Espiritual e Prece',
        theme: 'O Poder da Prece Sincera: Falar com Deus',
      },
      {
        num: 12,
        date: '2027-06-19',
        block: 'Mundo Espiritual e Prece',
        theme: 'Pensamentos, Sentimentos e Boas Vibrações',
      },
      {
        num: 13,
        date: '2027-06-26',
        block: 'Mundo Espiritual e Prece',
        theme: 'A Lei de Reencarnação: Novas Oportunidades de Aprender',
      },
      {
        num: 14,
        date: '2027-07-03',
        block: 'Mundo Espiritual e Prece',
        theme: 'Alegria e Gratidão pelo Semestre de Aprendizado',
      },
      {
        num: 15,
        date: '2027-07-24',
        block: 'A Lei do Trabalho e Progresso',
        theme: 'Retorno e Acolhimento: O Valor do Esforço e Dedicação',
      },
      {
        num: 16,
        date: '2027-07-31',
        block: 'A Lei do Trabalho e Progresso',
        theme: 'O Trabalho no Bem e a Cooperação',
      },
      {
        num: 17,
        date: '2027-08-07',
        block: 'Virtudes e Sentimentos',
        theme: 'A Humildade e a Sinceridade de Coração',
      },
      {
        num: 18,
        date: '2027-08-14',
        block: 'Virtudes e Sentimentos',
        theme: 'O Perdão: Limpando o Coração da Mágua',
      },
      {
        num: 19,
        date: '2027-08-21',
        block: 'Virtudes e Sentimentos',
        theme: 'A Verdade e a Honestidade nas Pequenas Ações',
      },
      {
        num: 20,
        date: '2027-08-28',
        block: 'Virtudes e Sentimentos',
        theme: 'A Coragem Moral: Fazer o Bem Mesmo Quando Difícil',
      },
      {
        num: 21,
        date: '2027-09-11',
        block: 'Caridade em Ação',
        theme: 'Fora da Caridade Não Há Salvação',
      },
      {
        num: 22,
        date: '2027-09-18',
        block: 'Caridade em Ação',
        theme: 'A Caridade Moral: Ouvir, Acolher e Não Julgar',
      },
      {
        num: 23,
        date: '2027-09-25',
        block: 'Caridade em Ação',
        theme: 'A Prática do Desapego e Partilha',
      },
      {
        num: 24,
        date: '2027-10-02',
        block: 'A Lei de Causa e Efeito',
        theme: 'A Semeadura é Livre, a Colheita Obrigatória',
      },
      {
        num: 25,
        date: '2027-10-16',
        block: 'A Lei de Causa e Efeito',
        theme: 'Responsabilidade pelas Nossas Escolhas',
      },
      {
        num: 26,
        date: '2027-10-23',
        block: 'A Lei de Causa e Efeito',
        theme: 'O Autoaperfeiçoamento Diário',
      },
      {
        num: 27,
        date: '2027-11-06',
        block: 'Espiritismo e Evangelho',
        theme: 'Allan Kardec e as Obras Básicas',
      },
      {
        num: 28,
        date: '2027-11-20',
        block: 'Espiritismo e Evangelho',
        theme: 'Chico Xavier: Exemplo de Amor e Humildade',
      },
      {
        num: 29,
        date: '2027-11-27',
        block: 'Encerramento e Confraternização',
        theme: 'Celebrando os Dons da Luz e da Amizade',
      },
      {
        num: 30,
        date: '2027-12-04',
        block: 'Encerramento e Confraternização',
        theme: 'Festa de Encerramento e Apresentação Pedagógica',
      },
    ]

    for (const t of themesData) {
      let lessonRec
      try {
        lessonRec = app.findFirstRecordByData('lessons', 'date', t.date + ' 00:00:00.000Z')
      } catch (_) {
        lessonRec = new Record(lessonCol)
        lessonRec.set('date', t.date + ' 00:00:00.000Z')
        lessonRec.set('year', 2027)
        lessonRec.set('session_number', t.num)
        lessonRec.set('central_theme', t.theme)
        lessonRec.set('thematic_block', t.block)
        lessonRec.set('status', 'scheduled')
        app.save(lessonRec)

        // Gerar planos pedagógicos para salas A, B, C, D
        const classrooms = [
          {
            c: 'A',
            title: `Linguagem Lúdica: ${t.theme}`,
            obj: 'Apresentar o tema com historinhas, músicas e desenhos para os pequenos (3 a 5 anos).',
            approach:
              'Roda de acolhimento, fantoches, contação de história com figuras coloridas e atividade de pintura com giz de cera.',
            mat: 'Fantoches de pano, folhas A4 com desenhos do tema, giz de cera, aparelho de som para canções.',
          },
          {
            c: 'B',
            title: `Compreensão Ativa: ${t.theme}`,
            obj: 'Estimular o diálogo e a identificação de atitudes práticas no dia a dia escolar e familiar.',
            approach:
              'Leitura participativa, perguntas disparadoras em grupo, dramatização curta e criação de cartaz colaborativo.',
            mat: 'Cartolina, canetinhas, fichas com situações-problema ilustradas, lápis de cor.',
          },
          {
            c: 'C',
            title: `Reflexão Moral e Evangélica: ${t.theme}`,
            obj: 'Aprofundar os ensinamentos de Jesus e os princípios espíritas com analogias cotidianas.',
            approach:
              'Debate mediado, análise de trechos do Evangelho Segundo o Espiritismo e dinâmica reflexiva em duplas.',
            mat: 'Evangelho infantil/jovem, tirinhas em quadrinhos, caderno de anotações e post-its.',
          },
          {
            c: 'D',
            title: `Juventude e Vivência Espírita: ${t.theme}`,
            obj: 'Conectar o tema aos desafios da adolescência, redes sociais, ética e projeto de vida.',
            approach:
              'Roda de conversa aberta, estudo de caso atual, debate socrático e síntese em mural coletivo.',
            mat: 'Textos de apoio, projetor ou cartazes conceituais, fichas de discussão temática.',
          },
        ]

        for (const plan of classrooms) {
          const pRec = new Record(planCol)
          pRec.set('lesson_id', lessonRec.id)
          pRec.set('classroom', plan.c)
          pRec.set('title', plan.title)
          pRec.set('objective', plan.obj)
          pRec.set('approach', plan.approach)
          pRec.set('materials', plan.mat)
          app.save(pRec)
        }
      }
    }

    // 5. Biblioteca: Livros e Exemplares
    const bookCol = app.findCollectionByNameOrId('books')
    const copyCol = app.findCollectionByNameOrId('book_copies')

    const booksData = [
      {
        title: 'O Evangelho da Meninada',
        author: 'Eliseu Rigonatti',
        publisher: 'FEB',
        audience: 'Sala B / C',
        category: 'Evangelho',
        desc: 'Histórias evangélicas contadas de forma cativante e acessível para o coração infantil.',
        copies: ['TOMBO-001', 'TOMBO-002'],
      },
      {
        title: 'Pai Nosso para Crianças',
        author: 'Meimei / Chico Xavier',
        publisher: 'IDE',
        audience: 'Sala A / B',
        category: 'Prece e Oração',
        desc: 'Explicação carinhosa de cada frase da oração ensinada por Jesus.',
        copies: ['TOMBO-003', 'TOMBO-004', 'TOMBO-005'],
      },
      {
        title: 'Histórias Que Jesus Contou',
        author: 'Hermínio C. Miranda',
        publisher: 'FEB',
        audience: 'Sala B / C',
        category: 'Parábolas',
        desc: 'As mais belas parábolas com ilustrações e ensinamentos para a vida prática.',
        copies: ['TOMBO-006'],
      },
      {
        title: 'Cartilha da Natureza',
        author: 'Casimiro Cunha / Chico Xavier',
        publisher: 'FEB',
        audience: 'Sala A / B',
        category: 'Natureza e Deus',
        desc: 'Trovas poéticas que ensinam o amor aos animais, plantas e ao Criador.',
        copies: ['TOMBO-007', 'TOMBO-008'],
      },
      {
        title: 'O Menino Que Tinha Medo do Escuro',
        author: 'Adeilson Salles',
        publisher: 'Allan Kardec',
        audience: 'Sala A',
        category: 'Sentimentos',
        desc: 'Uma linda narrativa sobre confiança, o anjo protetor e a prece para acalmar o coração.',
        copies: ['TOMBO-009'],
      },
      {
        title: 'Conversa Firme com o Jovem',
        author: 'Richard Simonetti',
        publisher: 'CEAC',
        audience: 'Sala D',
        category: 'Juventude',
        desc: 'Diálogos francos sobre escolhas, amizade, sexualidade e espiritualidade na juventude.',
        copies: ['TOMBO-010', 'TOMBO-011'],
      },
    ]

    for (const b of booksData) {
      try {
        app.findFirstRecordByData('books', 'title', b.title)
      } catch (_) {
        const bRec = new Record(bookCol)
        bRec.set('title', b.title)
        bRec.set('author', b.author)
        bRec.set('publisher', b.publisher)
        bRec.set('target_audience', b.audience)
        bRec.set('category', b.category)
        bRec.set('description', b.desc)
        app.save(bRec)

        for (const tombo of b.copies) {
          const cpRec = new Record(copyCol)
          cpRec.set('book_id', bRec.id)
          cpRec.set('copy_number', tombo)
          cpRec.set('condition', 'bom')
          cpRec.set('status', 'disponivel')
          app.save(cpRec)
        }
      }
    }
  },
  (app) => {
    // down logic
  },
)
