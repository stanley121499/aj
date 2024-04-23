// /services/campaignService.ts

import { Campaign, CampaignFormData } from '../types/campaignTypes';
import { supabase } from '../utils/supabaseClient';

export const getCampaigns = async (): Promise<Campaign[]> => {
  // Fetch all campaigns and join template name
  let { data: campaigns, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      template:template_id(name)
    `);

  if (error) throw new Error(error.message);

  // // Get the count of contacts in the contact list
  // const resultingCampaigns = await campaigns?.map( async (campaign: Campaign) => {
  //   const { data: contactList, error } = await supabase
  //     .from('contact_list_members')
  //     .select('*')
  //     .match({ contact_list_id: campaign.contact_list_id })
  //     .single();

  //   if (error) throw new Error(error.message);
  //   campaign.total_contacts = contactList.contacts.length;
  //   return campaign;
  // });

  return campaigns as Campaign[];
};

export const getCampaign = async (campaign_id: number): Promise<Campaign> => {
  let { data: campaign, error } = await supabase
    .from('campaigns')
    .select(
      `
      *,
      template:template_id(name)
    `
    )
    .match({ campaign_id })
    .single(); // Use .single() if you're fetching one row to get an object instead of an array back

  if (error) throw new Error(error.message);
  return campaign as Campaign;
}

export const createCampaign = async (formData: CampaignFormData): Promise<Campaign> => {
  const { data, error } = await supabase
    .from('campaigns')
    .insert([formData])
    .single(); // Use .single() if you're inserting one row to get an object instead of an array back

  if (error) throw new Error(error.message);
  return data;
};

export const updateCampaign = async (campaign_id: number, formData: CampaignFormData): Promise<Campaign | null> => {
  const { data, error } = await supabase
    .from('campaigns')
    .update(formData)
    .match({ campaign_id });

  if (error) throw new Error(error.message);
  return data as Campaign | null;
};

export const deleteCampaign = async (campaign_id: number): Promise<Campaign | null> => {
  const { data, error } = await supabase
    .from('campaigns')
    .delete()
    .match({ campaign_id });

  if (error) throw new Error(error.message);
  return data as Campaign | null;
};