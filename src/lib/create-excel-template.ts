import * as XLSX from 'xlsx';

export function createExcelTemplate() {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Create the data with proper structure
  const data = [
    ['Project Name:', 'Your Project Name Here', '', '', ''],
    ['Location:', 'Site Location', '', '', ''],
    ['Start Date:', '2025-01-15', '', '', ''],
    ['', '', '', '', ''],
    ['Phase', 'Subphase', 'Budget Hours', 'Budget Quantity', 'Unit'],
    ['Site Preparation', 'Clear & Grub', 8, 1, 'ea'],
    ['Site Preparation', 'Layout & Stake', 4, 1, 'ea'],
    ['Excavation', 'Foundation Excavation', 16, 150, 'cy'],
    ['Excavation', 'Footing Trenches', 12, 200, 'ft'],
    ['Foundation', 'Form Footings', 24, 200, 'ft'],
    ['Foundation', 'Pour Footings', 8, 25, 'cy'],
    ['Foundation', 'Form Walls', 32, 800, 'sf'],
    ['Foundation', 'Pour Walls', 12, 40, 'cy'],
    ['Trenching', 'Trench 1', 26, 100, 'ft'],
    ['Trenching', 'Trench 2', 26, 100, 'ft'],
    ['Trenching', 'Trench 3', 26, 100, 'ft'],
    ['Concrete Work', 'Pour Slab', 16, 75, 'cy'],
    ['Concrete Work', 'Finish Concrete', 24, 5000, 'sf'],
    ['Concrete Work', 'Cure & Protect', 4, 5000, 'sf'],
  ];
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Phase
    { wch: 30 }, // Subphase
    { wch: 15 }, // Budget Hours
    { wch: 18 }, // Budget Quantity
    { wch: 10 }, // Unit
  ];
  
  // Add the worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Project Template');
  
  // Generate buffer
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  
  return buf;
}