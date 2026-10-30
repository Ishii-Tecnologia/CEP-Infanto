import pb from '@/lib/pocketbase/client'
import { Family, Guardian, Child, ClassroomId } from '@/types'

export const familyService = {
  async getAll(): Promise<Family[]> {
    const families = await pb.collection('families').getFullList<Family>({
      sort: 'reference_name',
    })

    const [guardians, children] = await Promise.all([
      pb.collection('guardians').getFullList<Guardian>(),
      pb.collection('children').getFullList<Child>({
        sort: 'name',
      }),
    ])

    const guardianMap = new Map<string, Guardian[]>()
    for (const g of guardians) {
      const list = guardianMap.get(g.family_id) || []
      list.push(g)
      guardianMap.set(g.family_id, list)
    }

    const childMap = new Map<string, Child[]>()
    for (const c of children) {
      const list = childMap.get(c.family_id) || []
      list.push(c)
      childMap.set(c.family_id, list)
    }

    return families.map((f) => ({
      ...f,
      guardians: guardianMap.get(f.id) || [],
      children: childMap.get(f.id) || [],
    }))
  },

  async getById(id: string): Promise<Family> {
    const family = await pb.collection('families').getOne<Family>(id)
    const [guardians, children] = await Promise.all([
      pb.collection('guardians').getFullList<Guardian>({
        filter: `family_id = "${id}"`,
      }),
      pb.collection('children').getFullList<Child>({
        filter: `family_id = "${id}"`,
      }),
    ])

    return {
      ...family,
      guardians,
      children,
    }
  },

  async create(
    familyData: Partial<Family>,
    guardiansData: Partial<Guardian>[],
    childrenData: Partial<Child>[],
  ): Promise<Family> {
    const family = await pb.collection('families').create<Family>({
      reference_name: familyData.reference_name,
      primary_phone: familyData.primary_phone || '',
      email: familyData.email || '',
      address: familyData.address || '',
      notes: familyData.notes || '',
    })

    const createdGuardians: Guardian[] = []
    for (const g of guardiansData) {
      if (g.name?.trim()) {
        const guard = await pb.collection('guardians').create<Guardian>({
          family_id: family.id,
          name: g.name,
          relationship: g.relationship || '',
          phone: g.phone || '',
          email: g.email || '',
          is_emergency_contact: g.is_emergency_contact || false,
          photo_url: g.photo_url || '',
        })
        createdGuardians.push(guard)
      }
    }

    const createdChildren: Child[] = []
    for (const c of childrenData) {
      if (c.name?.trim()) {
        const child = await pb.collection('children').create<Child>({
          family_id: family.id,
          name: c.name,
          birth_date: c.birth_date ? `${c.birth_date} 00:00:00.000Z` : new Date().toISOString(),
          classroom: c.classroom || 'A',
          photo_url: c.photo_url || '',
          allergies: c.allergies || '',
          medical_notes: c.medical_notes || '',
          image_authorized: c.image_authorized !== false,
          dimdim_balance: c.dimdim_balance || 0,
          active: true,
        })
        createdChildren.push(child)
      }
    }

    return {
      ...family,
      guardians: createdGuardians,
      children: createdChildren,
    }
  },

  async update(id: string, data: Partial<Family>): Promise<Family> {
    return pb.collection('families').update<Family>(id, data)
  },

  async updateComplete(
    familyId: string,
    familyData: Partial<Family>,
    guardiansData: Array<Partial<Guardian> & { id?: string }>,
    childrenData: Array<Partial<Child> & { id?: string }>,
  ): Promise<Family> {
    // 1. Atualiza dados da família
    const updatedFamily = await pb.collection('families').update<Family>(familyId, {
      reference_name: familyData.reference_name,
      primary_phone: familyData.primary_phone || '',
      email: familyData.email || '',
      address: familyData.address || '',
      notes: familyData.notes || '',
    })

    // 2. Responsáveis existentes e sincronização
    const existingGuardians = await pb.collection('guardians').getFullList<Guardian>({
      filter: `family_id = "${familyId}"`,
    })
    const existingGuardianIds = new Set(existingGuardians.map((g) => g.id))
    const keptGuardianIds = new Set<string>()

    const updatedGuardians: Guardian[] = []
    for (const g of guardiansData) {
      if (!g.name?.trim()) continue

      if (g.id && existingGuardianIds.has(g.id)) {
        keptGuardianIds.add(g.id)
        const updated = await pb.collection('guardians').update<Guardian>(g.id, {
          name: g.name,
          relationship: g.relationship || '',
          phone: g.phone || '',
          email: g.email || '',
          is_emergency_contact: g.is_emergency_contact || false,
          photo_url: g.photo_url || '',
        })
        updatedGuardians.push(updated)
      } else {
        const created = await pb.collection('guardians').create<Guardian>({
          family_id: familyId,
          name: g.name,
          relationship: g.relationship || '',
          phone: g.phone || '',
          email: g.email || '',
          is_emergency_contact: g.is_emergency_contact || false,
          photo_url: g.photo_url || '',
        })
        updatedGuardians.push(created)
      }
    }

    // Exclui responsáveis removidos
    for (const g of existingGuardians) {
      if (!keptGuardianIds.has(g.id)) {
        try {
          await pb.collection('guardians').delete(g.id)
        } catch (e) {
          console.warn('Erro ao deletar guardião removido:', e)
        }
      }
    }

    // 3. Crianças existentes e sincronização
    const existingChildren = await pb.collection('children').getFullList<Child>({
      filter: `family_id = "${familyId}"`,
    })
    const existingChildIds = new Set(existingChildren.map((c) => c.id))
    const keptChildIds = new Set<string>()

    const updatedChildren: Child[] = []
    for (const c of childrenData) {
      if (!c.name?.trim()) continue

      const birthDateVal = c.birth_date
        ? c.birth_date.includes('T') || c.birth_date.includes(' ')
          ? c.birth_date
          : `${c.birth_date} 00:00:00.000Z`
        : new Date().toISOString()

      if (c.id && existingChildIds.has(c.id)) {
        keptChildIds.add(c.id)
        const updated = await pb.collection('children').update<Child>(c.id, {
          name: c.name,
          birth_date: birthDateVal,
          classroom: c.classroom || 'A',
          photo_url: c.photo_url || '',
          allergies: c.allergies || '',
          medical_notes: c.medical_notes || '',
          image_authorized: c.image_authorized !== false,
          active: c.active !== false,
        })
        updatedChildren.push(updated)
      } else {
        const created = await pb.collection('children').create<Child>({
          family_id: familyId,
          name: c.name,
          birth_date: birthDateVal,
          classroom: c.classroom || 'A',
          photo_url: c.photo_url || '',
          allergies: c.allergies || '',
          medical_notes: c.medical_notes || '',
          image_authorized: c.image_authorized !== false,
          dimdim_balance: c.dimdim_balance || 0,
          active: true,
        })
        updatedChildren.push(created)
      }
    }

    // Exclui crianças removidas
    for (const c of existingChildren) {
      if (!keptChildIds.has(c.id)) {
        try {
          await pb.collection('children').delete(c.id)
        } catch (e) {
          console.warn('Erro ao deletar criança removida:', e)
        }
      }
    }

    return {
      ...updatedFamily,
      guardians: updatedGuardians,
      children: updatedChildren,
    }
  },

  async delete(id: string): Promise<boolean> {
    await pb.collection('families').delete(id)
    return true
  },
}

export const guardianService = {
  async create(data: Partial<Guardian>): Promise<Guardian> {
    return pb.collection('guardians').create<Guardian>(data)
  },

  async update(id: string, data: Partial<Guardian>): Promise<Guardian> {
    return pb.collection('guardians').update<Guardian>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    await pb.collection('guardians').delete(id)
    return true
  },
}

export const childService = {
  async create(data: Partial<Child>): Promise<Child> {
    const birthDateVal = data.birth_date
      ? data.birth_date.includes('T') || data.birth_date.includes(' ')
        ? data.birth_date
        : `${data.birth_date} 00:00:00.000Z`
      : new Date().toISOString()

    return pb.collection('children').create<Child>({
      ...data,
      birth_date: birthDateVal,
      active: data.active !== false,
      image_authorized: data.image_authorized !== false,
      dimdim_balance: data.dimdim_balance || 0,
    })
  },
  async getAll(classroom?: ClassroomId): Promise<Child[]> {
    const filter = classroom ? `classroom = "${classroom}"` : ''
    return pb.collection('children').getFullList<Child>({
      filter,
      sort: 'name',
      expand: 'family_id',
    })
  },

  async getById(id: string): Promise<Child> {
    return pb.collection('children').getOne<Child>(id, {
      expand: 'family_id',
    })
  },

  async update(id: string, data: Partial<Child>): Promise<Child> {
    return pb.collection('children').update<Child>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    await pb.collection('children').delete(id)
    return true
  },
}
