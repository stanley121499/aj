import { supabase } from "../utils/supabaseClient";
import { Message } from "../types/messagesTypes";

export const getMessages = async (): Promise<Message[]> => {
  let { data: messages, error } = await supabase.from("messages").select("*,phone:phone_numbers(number),contact:contacts(wa_id)").order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return messages as Message[];
}

export const getMessage = async (message_id: number): Promise<Message> => {
  let { data: message, error } = await supabase.from("messages").select("*,phone:phone_numbers(number),contact:contacts(wa_id)").match({ message_id }).single();

  if (error) throw new Error(error.message);

  return message as Message;
}

export const createMessage = async (formData: Message): Promise<Message> => {
  const { data, error } = await supabase.from("messages").insert([formData]).single();

  if (error) throw new Error(error.message);

  return data;
}

export const updateMessage = async (message_id: number, formData: Message): Promise<Message | null> => {
  const { data, error } = await supabase.from("messages").update(formData).match({ message_id }).single();

  if (error) throw new Error(error.message);

  return data;
}

export const deleteMessage = async (message_id: number): Promise<Message | null> => {
  const { data, error } = await supabase.from("messages").delete().match({ message_id }).single();

  if (error) throw new Error(error.message);

  return data;
}

