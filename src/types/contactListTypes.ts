export interface ContactList {
  contact_list_id: number
  created_at: string | null
  description: string | null
  name: string
}

export interface ListOfContactList {
  contact_lists: ContactList[]
}

export interface CreateContactListFormData {
  name: string
  description: string
}

export interface UpdateContactListFormData {
  name: string
  description: string
}