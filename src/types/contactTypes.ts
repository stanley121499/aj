// src/types/index.ts
export interface Contact {
  contact_id: number
  created_at: string | null
  email: string | null
  name: string
  phone: string | null
  wa_id: string
}

export interface ListOfContacts {
  contacts: Contact[]
}

export interface CreateContactFormData{
  name: string
  phone: string | null
  email: string | null
  wa_id: string
}

export interface UpdateContactFormData{
  name: string
  phone: string
  email: string
  wa_id: string
}

