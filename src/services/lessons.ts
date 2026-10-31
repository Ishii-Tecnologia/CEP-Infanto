import pb from '@/lib/pocketbase/client'
import { Lesson, LessonPlan, Attendance, ClassroomId, AttendanceStatus } from '@/types'

export const lessonService = {
  async getAll(year?: number): Promise<Lesson[]> {
    const filter = year ? `year = ${year}` : ''
    const lessons = await pb.collection('lessons').getFullList<Lesson>({
      filter,
      sort: 'date',
    })

    const plans = await pb.collection('lesson_plans').getFullList<LessonPlan>()
    const planMap = new Map<string, LessonPlan[]>()
    for (const p of plans) {
      const list = planMap.get(p.lesson_id) || []
      list.push(p)
      planMap.set(p.lesson_id, list)
    }

    return lessons.map((l) => ({
      ...l,
      plans: planMap.get(l.id) || [],
    }))
  },

  async getById(id: string): Promise<Lesson> {
    const lesson = await pb.collection('lessons').getOne<Lesson>(id)
    const plans = await pb.collection('lesson_plans').getFullList<LessonPlan>({
      filter: `lesson_id = "${id}"`,
    })
    return {
      ...lesson,
      plans,
    }
  },

  async create(data: Partial<Lesson>, plansData?: Partial<LessonPlan>[]): Promise<Lesson> {
    const lesson = await pb.collection('lessons').create<Lesson>(data)

    const plans: LessonPlan[] = []
    if (plansData && plansData.length > 0) {
      for (const p of plansData) {
        const plan = await pb.collection('lesson_plans').create<LessonPlan>({
          lesson_id: lesson.id,
          classroom: p.classroom || 'A',
          title: p.title || `Plano Sala ${p.classroom}`,
          objective: p.objective || '',
          approach: p.approach || '',
          materials: p.materials || '',
          notes: p.notes || '',
        })
        plans.push(plan)
      }
    } else {
      // Cria planos padrão para A, B, C, D
      for (const c of ['A', 'B', 'C', 'D'] as ClassroomId[]) {
        const plan = await pb.collection('lesson_plans').create<LessonPlan>({
          lesson_id: lesson.id,
          classroom: c,
          title: `Plano Sala ${c}: ${data.central_theme || 'Tema do Sábado'}`,
          objective: '',
          approach: '',
          materials: '',
        })
        plans.push(plan)
      }
    }

    return { ...lesson, plans }
  },

  async update(id: string, data: Partial<Lesson>): Promise<Lesson> {
    return pb.collection('lessons').update<Lesson>(id, data)
  },

  async cancelLesson(id: string, reason: string): Promise<Lesson> {
    return pb.collection('lessons').update<Lesson>(id, {
      status: 'canceled',
      cancel_reason: reason,
    })
  },

  async reactivateLesson(id: string): Promise<Lesson> {
    return pb.collection('lessons').update<Lesson>(id, {
      status: 'scheduled',
      cancel_reason: '',
    })
  },

  async updatePlan(planId: string, data: Partial<LessonPlan>): Promise<LessonPlan> {
    return pb.collection('lesson_plans').update<LessonPlan>(planId, data)
  },
}

export const attendanceService = {
  async getByLessonAndClassroom(lessonId: string, classroom: ClassroomId): Promise<Attendance[]> {
    return pb.collection('attendances').getFullList<Attendance>({
      filter: `lesson_id = "${lessonId}" && classroom = "${classroom}"`,
      expand: 'child_id',
    })
  },

  async getByLesson(lessonId: string): Promise<Attendance[]> {
    return pb.collection('attendances').getFullList<Attendance>({
      filter: `lesson_id = "${lessonId}"`,
      expand: 'child_id',
    })
  },

  async saveAttendance(
    lessonId: string,
    childId: string,
    classroom: ClassroomId,
    status: AttendanceStatus,
    justification?: string,
    notes?: string,
  ): Promise<Attendance> {
    // Verificar se já existe
    try {
      const existing = await pb
        .collection('attendances')
        .getFirstListItem<Attendance>(`lesson_id = "${lessonId}" && child_id = "${childId}"`)
      return pb.collection('attendances').update<Attendance>(existing.id, {
        status,
        justification: justification || '',
        notes: notes || '',
        classroom,
      })
    } catch (_) {
      return pb.collection('attendances').create<Attendance>({
        lesson_id: lessonId,
        child_id: childId,
        classroom,
        status,
        justification: justification || '',
        notes: notes || '',
      })
    }
  },

  async bulkSaveAttendances(
    records: Array<{
      lessonId: string
      childId: string
      classroom: ClassroomId
      status: AttendanceStatus
      justification?: string
      notes?: string
    }>,
  ): Promise<void> {
    for (const item of records) {
      await this.saveAttendance(
        item.lessonId,
        item.childId,
        item.classroom,
        item.status,
        item.justification,
        item.notes,
      )
    }
  },
}
