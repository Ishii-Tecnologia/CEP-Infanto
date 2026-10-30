import pb from '@/lib/pocketbase/client'
import { Lesson, LessonPlan, ClassroomId } from '@/types'
import { SchoolYearConfig, RecessSaturday } from '@/contexts/AcademicContext'

export const DEFAULT_THEMES_30 = [
  { num: 1, block: 'Deus e a Criação', theme: 'Deus, Pai e Criador de Todas as Coisas' },
  { num: 2, block: 'Deus e a Criação', theme: 'A Natureza e a Bondade Divina' },
  { num: 3, block: 'Deus e a Criação', theme: 'Cuidando do Nosso Planeta e dos Seres Vivos' },
  { num: 4, block: 'Jesus e Seus Ensinos', theme: 'Quem é Jesus: Nosso Mestre e Amigo' },
  { num: 5, block: 'Jesus e Seus Ensinos', theme: 'A Parábola do Bom Samaritano: Amor ao Próximo' },
  {
    num: 6,
    block: 'Jesus e Seus Ensinos',
    theme: 'O Sermão da Montanha: Bem-Aventurados os Mansos',
  },
  {
    num: 7,
    block: 'Família e Convivência',
    theme: 'A Importância da Família e o Respeito aos Pais',
  },
  { num: 8, block: 'Família e Convivência', theme: 'Paciência e Compreensão no Lar' },
  {
    num: 9,
    block: 'Família e Convivência',
    theme: 'Fraternidade e Amizade entre Irmãos e Colegas',
  },
  {
    num: 10,
    block: 'Mundo Espiritual e Prece',
    theme: 'A Alma e os Espíritos Protetores (Anjo Guardião)',
  },
  { num: 11, block: 'Mundo Espiritual e Prece', theme: 'O Poder da Prece Sincera: Falar com Deus' },
  {
    num: 12,
    block: 'Mundo Espiritual e Prece',
    theme: 'Pensamentos, Sentimentos e Boas Vibrações',
  },
  {
    num: 13,
    block: 'Mundo Espiritual e Prece',
    theme: 'A Lei de Reencarnação: Novas Oportunidades de Aprender',
  },
  {
    num: 14,
    block: 'Mundo Espiritual e Prece',
    theme: 'Alegria e Gratidão pelo Semestre de Aprendizado',
  },
  {
    num: 15,
    block: 'A Lei do Trabalho e Progresso',
    theme: 'Retorno e Acolhimento: O Valor do Esforço e Dedicação',
  },
  { num: 16, block: 'A Lei do Trabalho e Progresso', theme: 'O Trabalho no Bem e a Cooperação' },
  { num: 17, block: 'Virtudes e Sentimentos', theme: 'A Humildade e a Sinceridade de Coração' },
  { num: 18, block: 'Virtudes e Sentimentos', theme: 'O Perdão: Limpando o Coração da Mágua' },
  {
    num: 19,
    block: 'Virtudes e Sentimentos',
    theme: 'A Verdade e a Honestidade nas Pequenas Ações',
  },
  {
    num: 20,
    block: 'Virtudes e Sentimentos',
    theme: 'A Coragem Moral: Fazer o Bem Mesmo Quando Difícil',
  },
  { num: 21, block: 'Caridade em Ação', theme: 'Fora da Caridade Não Há Salvação' },
  { num: 22, block: 'Caridade em Ação', theme: 'A Caridade Moral: Ouvir, Acolher e Não Julgar' },
  { num: 23, block: 'Caridade em Ação', theme: 'A Prática do Desapego e Partilha' },
  {
    num: 24,
    block: 'A Lei de Causa e Efeito',
    theme: 'A Semeadura é Livre, a Colheita Obrigatória',
  },
  { num: 25, block: 'A Lei de Causa e Efeito', theme: 'Responsabilidade pelas Nossas Escolhas' },
  { num: 26, block: 'A Lei de Causa e Efeito', theme: 'O Autoaperfeiçoamento Diário' },
  { num: 27, block: 'Espiritismo e Evangelho', theme: 'Allan Kardec e as Obras Básicas' },
  { num: 28, block: 'Espiritismo e Evangelho', theme: 'Chico Xavier: Exemplo de Amor e Humildade' },
  {
    num: 29,
    block: 'Encerramento e Confraternização',
    theme: 'Celebrando os Dons da Luz e da Amizade',
  },
  {
    num: 30,
    block: 'Encerramento e Confraternização',
    theme: 'Festa de Encerramento e Apresentação Pedagógica',
  },
]

export function generateSaturdaysList(
  startDateStr: string,
  recessSaturdays: RecessSaturday[],
  count = 30,
): string[] {
  const result: string[] = []
  const recessSet = new Set(recessSaturdays.map((r) => r.date))

  // Iniciar na data indicada
  const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number)
  const current = new Date(Date.UTC(startYear, startMonth - 1, startDay, 12, 0, 0))

  // Se o dia não for sábado (dia da semana 6), avança até o próximo sábado
  while (current.getUTCDay() !== 6) {
    current.setUTCDate(current.getUTCDate() + 1)
  }

  let safetyCounter = 0
  while (result.length < count && safetyCounter < 100) {
    safetyCounter++
    const y = current.getUTCFullYear()
    const m = String(current.getUTCMonth() + 1).padStart(2, '0')
    const d = String(current.getUTCDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`

    // Pula se estiver na lista de recessos / feriados
    if (!recessSet.has(dateStr)) {
      result.push(dateStr)
    }

    // Avança 7 dias para o próximo sábado
    current.setUTCDate(current.getUTCDate() + 7)
  }

  return result
}

export async function syncOrRegenerateCalendar(
  config: SchoolYearConfig,
  recesses: RecessSaturday[],
  onProgress?: (msg: string) => void,
) {
  const year = config.year || 2027
  const saturdays = generateSaturdaysList(config.startDate, recesses, 30)

  // 1. Busca todas as aulas já cadastradas para o ano
  const existingLessons = await pb.collection('lessons').getFullList<Lesson>({
    filter: `year=${year}`,
    sort: 'session_number',
  })

  // Se já temos exatamente as 30 aulas, atualiza as datas respeitando os planos e presenças existentes
  if (existingLessons.length > 0) {
    for (let i = 0; i < existingLessons.length; i++) {
      const lesson = existingLessons[i]
      const newDate = saturdays[i] || saturdays[saturdays.length - 1]
      const isoDate = `${newDate} 00:00:00.000Z`
      if (lesson.date.split('T')[0] !== newDate) {
        onProgress?.(`Atualizando Aula #${lesson.session_number} para ${newDate}...`)
        await pb.collection('lessons').update(lesson.id, {
          date: isoDate,
        })
      }
    }
    return { count: existingLessons.length, action: 'updated_dates' }
  }

  // Se não houver aulas para esse ano, cria as 30 aulas com planos pedagógicos
  onProgress?.(`Criando matriz de 30 sábados para o ano ${year}...`)
  for (let i = 0; i < saturdays.length; i++) {
    const sessionNum = i + 1
    const sDate = saturdays[i]
    const themeInfo = DEFAULT_THEMES_30[i] || {
      block: 'Pedagógico Geral',
      theme: `Encontro Temático #${sessionNum}`,
    }

    const createdLesson = await pb.collection('lessons').create({
      date: `${sDate} 00:00:00.000Z`,
      year: year,
      session_number: sessionNum,
      central_theme: themeInfo.theme,
      thematic_block: themeInfo.block,
      status: 'scheduled',
    })

    // Gera planos pedagógicos padrão para as 4 salas
    const initialPlans = [
      {
        c: 'A',
        title: `Linguagem Lúdica: ${themeInfo.theme}`,
        obj: 'Apresentar o tema com historinhas, músicas e desenhos para os pequenos.',
        approach: 'Roda de acolhimento, contação com figuras coloridas e pintura.',
        mat: 'Folhas A4 ilustradas, giz de cera, aparelho de som.',
      },
      {
        c: 'B',
        title: `Compreensão Ativa: ${themeInfo.theme}`,
        obj: 'Estimular o diálogo e a identificação de atitudes práticas no dia a dia.',
        approach: 'Leitura participativa, perguntas disparadoras e dramatização curta.',
        mat: 'Cartolina, canetinhas, fichas com situações-problema.',
      },
      {
        c: 'C',
        title: `Reflexão Moral e Evangélica: ${themeInfo.theme}`,
        obj: 'Aprofundar os ensinamentos com analogias cotidianas.',
        approach: 'Debate mediado, análise evangélica e dinâmica reflexiva em duplas.',
        mat: 'Textos evangélicos infantojuvenis, post-its, caderno.',
      },
      {
        c: 'D',
        title: `Juventude e Vivência: ${themeInfo.theme}`,
        obj: 'Conectar o tema aos desafios cotidianos, ética e convivência fraterna.',
        approach: 'Roda de conversa aberta, estudo de caso e debate mediado.',
        mat: 'Textos de apoio, mural conceitual, fichas de discussão.',
      },
    ]

    for (const p of initialPlans) {
      await pb.collection('lesson_plans').create({
        lesson_id: createdLesson.id,
        classroom: p.c,
        title: p.title,
        objective: p.obj,
        approach: p.approach,
        materials: p.mat,
      })
    }
  }

  return { count: saturdays.length, action: 'created_new' }
}
