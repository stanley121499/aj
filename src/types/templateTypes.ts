export interface Template {
  account_id: number | null
  category: string
  created_at: string | null
  language: string
  name: string
  rejection_reason: string | null
  status: string
  template_id: number
  wa_template_id: string | null
}

export interface TemplateList {
  templates: Template[]
}

export interface TemplateFormData {
  account_id: number | null
  category: string
  language: string
  name: string
  wa_template_id: string | null
  status: string  
}

export interface Component {
  component_id: number
  example: JSON | null
  format: string | null
  template_id: number | null
  text: string | null
  type: string
  buttons: DatabaseButton[] | null
}

export interface ComponentFormData {
  example: JSON | null
  format: string | null
  text: string | null
  type: string
}

export interface DatabaseButton {
  button_id: number
  component_id: number | null
  text: string
  type: string
  url: string | null
}

export interface DatabaseButtonFormData {
  text: string
  type: string
  url: string | null
}