import { WhatsAppBusinessAccount, WhatsAppBusinessAccountFormData } from "../types/whatsappBusinessAccountsTypes";
import { supabase } from "../utils/supabaseClient";

export const getWhatsAppBusinessAccounts = async (): Promise<WhatsAppBusinessAccount[]> => {
  let { data: accounts, error } = await supabase
    .from("whatsapp_business_accounts")
    .select("*");

  if (error) throw new Error(error.message);
  return accounts as WhatsAppBusinessAccount[];
};

export const getWhatsAppBusinessAccount = async (account_id: number): Promise<WhatsAppBusinessAccount> => {
  let { data: account, error } = await supabase
    .from("whatsapp_business_accounts")
    .select("*")
    .match({ account_id })
    .single(); // Use .single() if you're fetching one row to get an object instead of an array back

  if (error) throw new Error(error.message);
  return account as WhatsAppBusinessAccount;
}

export const createWhatsAppBusinessAccount = async (formData: WhatsAppBusinessAccountFormData): Promise<WhatsAppBusinessAccount> => {
  const { data, error } = await supabase
    .from("whatsapp_business_accounts")
    .insert([formData])
    .single(); // Use .single() if you're inserting one row to get an object instead of an array back

  if (error) throw new Error(error.message);
  return data;
}

export const updateWhatsAppBusinessAccount = async (account_id: number, formData: WhatsAppBusinessAccountFormData): Promise<WhatsAppBusinessAccount | null> => {
  const { data, error } = await supabase
    .from("whatsapp_business_accounts")
    .update(formData)
    .match({ account_id });

  if (error) throw new Error(error.message);
  return data as WhatsAppBusinessAccount | null;
}

export const deleteWhatsAppBusinessAccount = async (account_id: number): Promise<WhatsAppBusinessAccount | null> => {
  const { data, error } = await supabase
    .from("whatsapp_business_accounts")
    .delete()
    .match({ account_id });

  if (error) throw new Error(error.message);
  return data as WhatsAppBusinessAccount | null;
};

// Path: src/services/whatsappBusinessAccountsService.ts