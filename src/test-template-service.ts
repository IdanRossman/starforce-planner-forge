import { getAllTemplates, getTemplateEquipmentForJob } from '@/services/templateService';

// Test function to verify template API
export async function testTemplateService() {
  try {
    console.log('Testing template service...');
    
    // Test 1: Get all templates
    console.log('1. Fetching all templates...');
    const templates = await getAllTemplates();
    console.log('Templates:', templates);
    
    if (templates.length > 0) {
      const firstTemplate = templates[0];
      console.log('First template:', firstTemplate);
      
      // Test 2: Get equipment for bishop job
      console.log('2. Fetching equipment for bishop job...');
      const equipment = await getTemplateEquipmentForJob(firstTemplate.id, 'bishop');
      console.log('Equipment:', equipment);
      console.log(`Loaded ${equipment.length} equipment items`);
      
      // Show some example equipment
      if (equipment.length > 0) {
        console.log('Example equipment item:', equipment[0]);
      }
    }
    
    return { success: true, message: 'Template service test completed successfully' };
  } catch (error) {
    console.error('Template service test failed:', error);
    return { success: false, error: error.message };
  }
}

// Auto-run test if in development
if (import.meta.env.DEV) {
  testTemplateService();
}
