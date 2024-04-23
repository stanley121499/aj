import { supabase } from '../utils/supabaseClient';
import { Contact, CreateContactFormData } from '../types/contactTypes';
export const getContacts = async (): Promise<Contact[]> => {
  let { data: contacts, error } = await supabase
    .from('contacts')
    .select('*');

  if (error) throw new Error(error.message);
  return contacts as Contact[];
}

export const getContact = async (id: string): Promise<Contact> => {
  let { data: contact, error } = await supabase
    .from('contacts')
    .select('*')
    .match({ id })
    .single(); // Use .single() if you're fetching one row to get an object instead of an array back

  if (error) throw new Error(error.message);
  return contact as Contact;
}

export const createContact = async (formData: CreateContactFormData): Promise<Contact> => {
  const { data, error } = await supabase
    .from('contacts')
    .insert([formData])
    .single(); // Use .single() if you're inserting one row to get an object instead of an array back

  if (error) throw new Error(error.message);
  console.log(data);
  return data;
};

export const updateContact = async (contact_id: number, formData: Contact): Promise<Contact | null> => {
  const { data, error } = await supabase
    .from('contacts')
    .update(formData)
    .match({ contact_id });

  if (error) throw new Error(error.message);
  return data as Contact | null;
};

export const deleteContact = async (id: number): Promise<Contact | null> => {
  const { data, error } = await supabase
    .from('contacts')
    .delete()
    .match({ id });

  if (error) throw new Error(error.message);
  return data as Contact | null;
};

export const findContact = async (contact: Contact): Promise<Contact | null> => {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .match({ wa_id: contact.wa_id });

  if (error) throw new Error(error.message);
  return data ? data[0] : null;
}