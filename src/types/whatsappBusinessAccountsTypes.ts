export interface WhatsAppBusinessAccount {
  account_id: number
  created_at: string | null
  name: string | null
  updated_at: string | null
  waba_id: string
}

export interface WhatsAppBusinessAccountFormData {
  name: string
  waba_id: string
}


export interface WhatsAppBusinessAccountPhoneNumber {
  created_at: string | null
  number: string
  phone_number_id: number
  quality_rating: string | null
  waba_id: number | null
}