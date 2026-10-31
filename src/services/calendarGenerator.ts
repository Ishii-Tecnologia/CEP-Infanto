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

// Helper para normalizar qualquer representação de data (ISO YYYY-MM-DD ou BR DD/MM/AAAA)
function toIsoDateOnly(dateStr?: string): string {
  if (!dateStr) return ''
  const trimmed = dateStr.trim().split('T')[0].split(' ')[0]
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }
  const matchBR = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (matchBR) {
    const [, d, m, y] = matchBR
    return `${y}-${m}-${d}`
  }
  return trimmed
}

// Pequena pausa para evitar estourar o rate limit de requisições por segundo
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Executa operação com retry automático para erros transitórios (ex: 429 Too Many Requests)
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 4, baseDelay = 350): Promise<T> {
  let attempt = 0
  while (true) {
    try {
      return await fn()
    } catch (err: any) {
      attempt++
      const status = err?.status || err?.statusCode || err?.data?.code
      const isRateLimit = status === 429 || String(err?.message || '').includes('Too Many Requests')
      if (attempt <= maxRetries && isRateLimit) {
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100
        await sleep(delay)
        continue
      }
      throw err
    }
  }
}

export function generateSaturdaysList(
  startDateStr: string,
  recessSaturdays: RecessSaturday[],
  count = 30,
): string[] {
  const result: string[] = []
  const recessSet = new Set(
    (recessSaturdays || []).map((r) => toIsoDateOnly(r.date)).filter(Boolean),
  )

  const cleanStart = toIsoDateOnly(startDateStr)
  if (!cleanStart) {
    throw new Error('Data de início do ano letivo não informada ou inválida.')
  }

  // Iniciar na data indicada
  const [startYear, startMonth, startDay] = cleanStart.split('-').map(Number)
  if (!startYear || !startMonth || !startDay) {
    throw new Error(
      `Data de início inválida: "${startDateStr}". Utilize o formato dd/mm/aaaa ou aaaa-mm-dd.`,
    )
  }

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
  const startDate = toIsoDateOnly(config.startDate)
  if (!startDate) {
    throw new Error('A data de início das aulas é obrigatória para sincronizar o calendário.')
  }

  const saturdays = generateSaturdaysList(startDate, recesses, 30)

  // 1. Busca todas as aulas já cadastradas para o ano
  const existingLessons = await withRetry(() =>
    pb.collection('lessons').getFullList<Lesson>({
      filter: `year=${year}`,
      sort: 'session_number',
    }),
  )

  // Caso A: Se já existem aulas para este ano (completas ou parciais),
  // atualizamos as datas das aulas existentes respeitando temas, planos e presenças
  // e completamos eventuais sessões faltantes até 30.
  if (existingLessons.length > 0) {
    onProgress?.(`Ajustando datas para o ano letivo ${year}...`)

    // Passo 1: Atualizar datas das aulas existentes
    for (let i = 0; i < existingLessons.length; i++) {
      const lesson = existingLessons[i]
      const sessionIdx = (lesson.session_number || i + 1) - 1
      const newDate = saturdays[sessionIdx] || saturdays[i] || saturdays[saturdays.length - 1]
      const isoDate = `${newDate} 00:00:00.000Z`

      const currentLessonDate = toIsoDateOnly(lesson.date)
      if (currentLessonDate !== newDate) {
        onProgress?.(`Atualizando Aula #${lesson.session_number} para ${newDate}...`)
        await withRetry(() =>
          pb.collection('lessons').update(lesson.id, {
            date: isoDate,
          }),
        )
        await sleep(100)
      }
    }

    // Passo 2: Se por algum motivo o ano tinha menos de 30 aulas (ex: 26 aulas geradas antes de um rate limit),
    // completa as sessões faltantes preservando as que já existem.
    const existingSessionNumbers = new Set(existingLessons.map((l) => l.session_number))
    let createdMissingCount = 0

    for (let i = 0; i < saturdays.length; i++) {
      const sessionNum = i + 1
      if (!existingSessionNumbers.has(sessionNum)) {
        createdMissingCount++
        const sDate = saturdays[i]
        const themeInfo = DEFAULT_THEMES_30[i] || {
          block: 'Pedagógico Geral',
          theme: `Encontro Temático #${sessionNum}`,
        }

        onProgress?.(`Completando Aula #${sessionNum} (${sDate})...`)
        const createdLesson = await withRetry(() =>
          pb.collection('lessons').create({
            date: `${sDate} 00:00:00.000Z`,
            year: year,
            session_number: sessionNum,
            central_theme: themeInfo.theme,
            thematic_block: themeInfo.block,
            status: 'scheduled',
          }),
        )
        await sleep(100)

        // Cria planos pedagógicos para a aula que faltava
        const plans = createDefaultPlans(themeInfo.theme)
        for (const p of plans) {
          await withRetry(() =>
            pb.collection('lesson_plans').create({
              lesson_id: createdLesson.id,
              classroom: p.classroom,
              title: p.title,
              objective: p.objective,
              approach: p.approach,
              materials: p.materials,
            }),
          )
          await sleep(60)
        }
      }
    }

    const totalCount = existingLessons.length + createdMissingCount
    return {
      count: totalCount,
      action: createdMissingCount > 0 ? 'completed_matrix' : 'updated_dates',
    }
  }

  // Caso B: Se não houver nenhuma aula para este ano, cria as 30 aulas com planos pedagógicos
  onProgress?.(`Criando matriz de 30 sábados para o ano ${year}...`)
  for (let i = 0; i < saturdays.length; i++) {
    const sessionNum = i + 1
    const sDate = saturdays[i]
    const themeInfo = DEFAULT_THEMES_30[i] || {
      block: 'Pedagógico Geral',
      theme: `Encontro Temático #${sessionNum}`,
    }

    onProgress?.(`Criando Aula #${sessionNum} de 30 (${sDate})...`)
    const createdLesson = await withRetry(() =>
      pb.collection('lessons').create({
        date: `${sDate} 00:00:00.000Z`,
        year: year,
        session_number: sessionNum,
        central_theme: themeInfo.theme,
        thematic_block: themeInfo.block,
        status: 'scheduled',
      }),
    )
    await sleep(100)

    // Gera planos pedagógicos padrão para as 4 salas
    const initialPlans = createDefaultPlans(themeInfo.theme)
    for (const p of initialPlans) {
      await withRetry(() =>
        pb.collection('lesson_plans').create({
          lesson_id: createdLesson.id,
          classroom: p.classroom,
          title: p.title,
          objective: p.objective,
          approach: p.approach,
          materials: p.materials,
        }),
      )
      await sleep(60)
    }
  }

  return { count: saturdays.length, action: 'created_new' }
}

function createDefaultPlans(theme: string) {
  return [
    {
      classroom: 'A',
      title: `Linguagem Lúdica: ${theme}`,
      objective: 'Apresentar o tema com historinhas, músicas e desenhos para os pequenos.',
      approach: 'Roda de acolhimento, contação com figuras coloridas e pintura.',
      materials: 'Folhas A4 ilustradas, giz de cera, aparelho de som.',
    },
    {
      classroom: 'B',
      title: `Compreensão Ativa: ${theme}`,
      objective: 'Estimular o diálogo e a identificação de atitudes práticas no dia a dia.',
      approach: 'Leitura participativa, perguntas disparadoras e dramatização curta.',
      materials: 'Cartolina, canetinhas, fichas com situações-problema.',
    },
    {
      classroom: 'C',
      title: `Reflexão Moral e Evangélica: ${theme}`,
      objective: 'Aprofundar os ensinamentos com analogias cotidianas.',
      approach: 'Debate mediado, análise evangélica e dinâmica reflexiva em duplas.',
      materials: 'Textos evangélicos infantojuvenis, post-its, caderno.',
    },
    {
      classroom: 'D',
      title: `Juventude e Vivência: ${theme}`,
      objective: 'Conectar o tema aos desafios cotidianos, ética e convivência fraterna.',
      approach: 'Roda de conversa aberta, estudo de caso e debate mediado.',
      materials: 'Textos de apoio, mural conceitual, fichas de discussão.',
    },
  ]
}
