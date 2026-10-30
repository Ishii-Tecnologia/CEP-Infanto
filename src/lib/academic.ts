import { ClassroomId, CLASSROOMS } from '@/types'

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
 * Determina automaticamente a sala (A, B, C, D) com base na data de nascimento e ano de referência.
 */
export function classifyClassroomByBirthDate(
  birthDateStr: string,
  referenceYear = 2027,
): ClassroomId {
  const age = calculateAgeOnCutoffDate(birthDateStr, referenceYear, 2, 1)

  if (age <= 5) return 'A'
  if (age <= 8) return 'B'
  if (age <= 11) return 'C'
  return 'D'
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
 * Nomes e cores das salas
 */
export function getClassroomBadge(classroomId: ClassroomId) {
  switch (classroomId) {
    case 'A':
      return {
        name: 'Sala A (3-5 anos)',
        color:
          'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
      }
    case 'B':
      return {
        name: 'Sala B (6-8 anos)',
        color: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300',
      }
    case 'C':
      return {
        name: 'Sala C (9-11 anos)',
        color: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
      }
    case 'D':
      return {
        name: 'Sala D (12-14 anos)',
        color:
          'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
      }
    default:
      return { name: 'Sala', color: 'bg-slate-100 text-slate-800 border-slate-300' }
  }
}
