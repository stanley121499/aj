import { Component, ComponentFormData, DatabaseButtonFormData, Template, TemplateFormData } from "../types/templateTypes";
import { supabase } from "../utils/supabaseClient";

export const getTemplates = async (): Promise<Template[]> => {
  let { data: templates, error } = await supabase
    .from("templates")
    .select("*");

  if (error) throw new Error(error.message);
  return templates as Template[];
};

export const getTemplate = async (template_id: number): Promise<Template> => {
  let { data: template, error } = await supabase
    .from("templates")
    .select("*")
    .match({ template_id })
    .single(); // Use .single() if you're fetching one row to get an object instead of an array back

  if (error) throw new Error(error.message);
  return template as Template;
}

export const createTemplate = async (template: TemplateFormData, components: ComponentFormData[], buttons: DatabaseButtonFormData[]): Promise<Template> => {
  // Create template then use the template id to create components
  // Then use the component id to create the button
  const { data, error } = await supabase
    .from("templates")
    .insert(template)
    .select();

  if (error) throw new Error(error.message);

  const createdTemplate = data[0] as Template;

  // Create components
  const componentsWithTemplateId = components.map(component => ({ ...component, template_id: createdTemplate.template_id }));
  console.log(componentsWithTemplateId);
  const { error: componentsError } = await supabase
    .from("components")
    .insert(componentsWithTemplateId);

  if (componentsError) throw new Error(componentsError.message);

  // Create buttons
  // Check buttons array length to see if we need to create a new component to hold the buttons 
  if (buttons.length > 0) {
    buttons.forEach(async (button) => {
      const newComponent = {
        type: 'BUTTON',
        template_id: createdTemplate.template_id,
        text: null,
        format: null,
        example: null,

      } as ComponentFormData;

      const { data: createdComponent, error: componentError } = await supabase
        .from("components")
        .insert(newComponent)
        .select();

      if (componentError) throw new Error(componentError.message);

      const component = createdComponent[0] as Component;

      const buttonsWithComponentId = buttons.map(button => ({ ...button, component_id: component.component_id }));

      const { error: buttonsError } = await supabase
        .from("buttons")
        .insert(buttonsWithComponentId);

      if (buttonsError) throw new Error(buttonsError.message);
    }
    )
  }

  return createdTemplate;
}

export const updateTemplate = async (template_id: number, formData: TemplateFormData): Promise<Template | null> => {
  const { data, error } = await supabase
    .from("templates")
    .update(formData)
    .match({ template_id });

  if (error) throw new Error(error.message);
  return data as Template | null;
}

export const deleteTemplate = async (template_id: number): Promise<Template | null> => {
  const { data, error } = await supabase
    .from("templates")
    .delete()
    .match({ template_id });

  if (error) throw new Error(error.message);
  return data as Template | null;
};