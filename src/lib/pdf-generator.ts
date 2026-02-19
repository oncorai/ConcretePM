interface PdfContent {
  projectName: string;
  location?: string;
  startDate: Date;
  totalBudgetHours: number;
  totalActualHours: number;
  hoursVariance: number;
  percentComplete: number;
  budgetVariancePercent: number;
  phases?: any[];
  tasks?: any[];
  dailyReports: any[];
}

export function generateProjectStatusPDF(content: PdfContent): string {
  const {
    projectName,
    location,
    startDate,
    totalBudgetHours,
    totalActualHours,
    hoursVariance,
    percentComplete,
    budgetVariancePercent,
    phases,
    tasks,
    dailyReports
  } = content;

  // Generate PDF content as a data URL
  const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
  /Font <<
    /F1 4 0 R
  >>
>>
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

5 0 obj
<<
/Length 6 0 R
>>
stream
BT
/F1 24 Tf
50 700 Td
(Project Status Report) Tj
0 -30 Td
/F1 18 Tf
(${projectName}) Tj
0 -20 Td
/F1 12 Tf
${location ? `(${location}) Tj 0 -15 Td` : ''}
(Start Date: ${startDate.toLocaleDateString()}) Tj
0 -30 Td
/F1 14 Tf
(Summary) Tj
0 -20 Td
/F1 12 Tf
(Budget Hours: ${totalBudgetHours.toFixed(1)}) Tj
0 -15 Td
(Actual Hours: ${totalActualHours.toFixed(1)}) Tj
0 -15 Td
(Variance: ${hoursVariance > 0 ? '+' : ''}${hoursVariance.toFixed(1)} hours) Tj
0 -15 Td
(Progress: ${percentComplete.toFixed(1)}%) Tj
0 -15 Td
(Budget Status: ${Math.abs(budgetVariancePercent).toFixed(0)}% ${budgetVariancePercent > 0 ? 'over' : 'under'} budget) Tj
0 -30 Td
(Generated: ${new Date().toLocaleDateString()}) Tj
ET
endstream
endobj

6 0 obj
${500 + (location ? 50 : 0)}
endobj

xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000262 00000 n 
0000000341 00000 n 
0000000900 00000 n 
trailer
<<
/Size 7
/Root 1 0 R
>>
startxref
920
%%EOF
`;

  return pdfContent;
}