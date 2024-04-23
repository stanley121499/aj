import { ContactList } from "../types/contactListTypes";
import { Contact } from "../types/contactTypes";
import { supabase } from "../utils/supabaseClient";

export const getContactLists = async (): Promise<ContactList[]> => {
  let { data: contactLists, error } = await supabase
    .from("contact_lists")
    .select("*");

  if (error) throw new Error(error.message);
  return contactLists as ContactList[];
};

export const getContactList = async (contact_list_id: number): Promise<ContactList> => {
  let { data: contactList, error } = await supabase
    .from("contact_lists")
    .select("*")
    .match({ contact_list_id })
    .single(); // Use .single() if you're fetching one row to get an object instead of an array back

  if (error) throw new Error(error.message);
  return contactList as ContactList;
}

export const createContactList = async (formData: ContactList): Promise<ContactList> => {
  const { data, error } = await supabase
    .from("contact_lists")
    .insert([formData])
    .single(); // Use .single() if you're inserting one row to get an object instead of an array back

  if (error) throw new Error(error.message);
  return data;
}

export const updateContactList = async (contact_list_id: number, formData: ContactList): Promise<ContactList | null> => {
  const { data, error } = await supabase
    .from("contact_lists")
    .update(formData)
    .match({ contact_list_id });

  if (error) throw new Error(error.message);
  return data as ContactList | null;
}

export const deleteContactList = async (contact_list_id: number): Promise<ContactList | null> => {
  const { data, error } = await supabase
    .from("contact_lists")
    .delete()
    .match({ contact_list_id });

  if (error) throw new Error(error.message);
  return data as ContactList | null;
};

export const addContactToContactList = async (contact_list_id: number, contact_id: number): Promise<ContactList | null> => {
  const { data, error } = await supabase
    .from("contact_list_members")
    .insert([{ contact_list_id, contact_id }]);

  if (error) throw new Error(error.message);
  return data as ContactList | null;
};

export const fetchContactListMembers = async (contact_list_id: number): Promise<Contact[]> => {
  let { data: contactListMembers, error } = await supabase
    .from("contact_list_members")
    .select("contact_id")
    .match({ contact_list_id });

  if (error) throw new Error(error.message);

  // Populate the contact list members
  if (!contactListMembers) return  [] ;
  const contacts = await Promise.all(contactListMembers.map(async (contactListMember) => {
    const { data: contact, error } = await supabase
      .from("contacts")
      .select("*")
      .match({ contact_id: contactListMember.contact_id })
      .single();

    if (error) throw new Error(error.message);
    return contact as Contact;
  }));

  return contacts;
};

export const removeContactFromContactList = async (contact_list_id: number, contact_id: number): Promise<ContactList | null> => {
  const { data, error } = await supabase
    .from("contact_list_members")
    .delete()
    .match({ contact_list_id, contact_id });

  if (error) throw new Error(error.message);
  return data as ContactList | null;
};