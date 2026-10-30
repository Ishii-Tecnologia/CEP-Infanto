import { ClassroomId, ClassroomInfo, CLASSROOMS } from '@/types'

/**
 * Calcula a idade de uma criança em uma data base de corte (por padrão, 1º de março do ano letivo de referência).
 * Regra da evangelização: idade completa até 1º de março do ano letivo.
 */
export function calculateAgeOnCutoffDate(
  birthDateStr: string,
  cutoffYear = 2027,
  cutoffMonth = 2,
  cutoffDay = 1,
): number {
  if (!birthDateStr) return 0
  const birth = new Date(birthDateStr)
  if (isNaN(birth.getTime())) return 0

  let age = cutoffYear - birth.getFullYear()
  const birthMonth = birth.getMonth() // 0-indexed (2 = março)
  const birthDay = birth.getDate()

  // Se o aniversário ainda não ocorreu antes ou no dia de corte
  if (birthMonth > cutoffMonth || (birthMonth === cutoffMonth && birthDay > cutoffDay)) {
    age -= 1
  }

  return Math.max(0, age)
}

/**
 * Determina a sala baseando-se na idade já calculada e na lista configurada de salas.
 */
export function classifyClassroomByAge(
  age: number,
  customClassrooms: ClassroomInfo[] = CLASSROOMS,
): ClassroomId {
  const rooms = customClassrooms && customClassrooms.length > 0 ? customClassrooms : CLASSROOMS

  // Procura uma sala onde a idade se encaixa exatamente
  for (const room of rooms) {
    if (age >= room.minAge && age <= room.maxAge) {
      return room.id
    }
  }

  // Se a criança for mais nova que a menor idade configurada, atribui à primeira sala
  const sorted = [...rooms].sort((a, b) => a.minAge - b.minAge)
  if (age < sorted[0].minAge) {
    return sorted[0].id
  }

  // Se for maior que a maior idade configurada, atribui à última sala
  return sorted[sorted.length - 1].id
}

/**
 * Determina automaticamente a sala (A, B, C, D) com base na data de nascimento, ano de referência e lista de salas configuráveis.
 */
export function classifyClassroomByBirthDate(
  birthDateStr: string,
  referenceYear = 2027,
  customClassrooms: ClassroomInfo[] = CLASSROOMS,
  cutoffMonth = 2,
  cutoffDay = 1,
): ClassroomId {
  const age = calculateAgeOnCutoffDate(birthDateStr, referenceYear, cutoffMonth, cutoffDay)
  return classifyClassroomByAge(age, customClassrooms)
}

/**
 * Formata data para exibição amigável em pt-BR (dd/mm/aaaa)
 */
export function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return ''
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

/**
 * Formata data e hora para exibição amigável em pt-BR
 */
export function formatDateTime(dateStr?: string | Date): string {
  if (!dateStr) return ''
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('pt-BR')
}

/**
 * Nomes e cores das salas (aceita lista de salas customizadas para refletir rótulos dinâmicos)
 */
export function getClassroomBadge(classroomId: ClassroomId, customClassrooms?: ClassroomInfo[]) {
  const custom = customClassrooms?.find((c) => c.id === classroomId)

  const defaultColors: Record<ClassroomId, string> = {
    A: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
    B: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300',
    C: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
    D: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
  }

  if (custom) {
    const ageDesc = `${custom.minAge}-${custom.maxAge} anos`
    const displayName = custom.name.includes(ageDesc) ? custom.name : `${custom.name} (${ageDesc})`
    return {
      name: displayName,
      rawName: custom.name,
      color: defaultColors[classroomId] || 'bg-slate-100 text-slate-800 border-slate-300',
    }
  }

  switch (classroomId) {
    case 'A':
      return {
        name: 'Sala A (3-5 anos)',
        rawName: 'Sala A',
        color: defaultColors.A,
      }
    case 'B':
      return {
        name: 'Sala B (6-8 anos)',
        rawName: 'Sala B',
        color: defaultColors.B,
      }
    case 'C':
      return {
        name: 'Sala C (9-11 anos)',
        rawName: 'Sala C',
        color: defaultColors.C,
      }
    case 'D':
      return {
        name: 'Sala D (12-14 anos)',
        rawName: 'Sala D',
        color: defaultColors.D,
      }
    default:
      return {
        name: 'Sala',
        rawName: 'Sala',
        color: 'bg-slate-100 text-slate-800 border-slate-300',
      }
  }
}
