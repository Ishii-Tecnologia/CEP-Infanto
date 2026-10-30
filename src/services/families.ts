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

  async delete(id: string): Promise<boolean> {
    await pb.collection('families').delete(id)
    return true
  },
}

export const childService = {
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
