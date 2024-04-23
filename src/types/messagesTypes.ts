import { Contact } from "./contactTypes"
import { WhatsAppBusinessAccountPhoneNumber } from "./whatsappBusinessAccountsTypes"

export interface Message {
  contact_id: number
  content: string
  created_at: string | null
  message_id: number
  message_type: string
  phone_number_id: number
  status: string | null
  wa_message_id: string | null
  contact: Contact
  phone: WhatsAppBusinessAccountPhoneNumber
}

export interface MessagesFormData {
  contact_id: number
  content: string
  message_type: string
  phone_number_id: number
}

export interface Conversation {
  contact_id: number
  last_message: string
  last_message_time: string
  phone_number_id: number
  unread_messages: number
  messages: Message[]
  contact: Contact
  phone_number: WhatsAppBusinessAccountPhoneNumber
}

