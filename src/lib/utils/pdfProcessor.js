import pdf from 'pdf-parse';
import fs from 'fs';

export async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    return {
      text: data.text,
      totalPages: data.numpages,
      info: data.info,
      metadata: data.metadata
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

export async function extractTextByPage(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    // Split text by page breaks (this is approximate)
    const pageTexts = [];
    const lines = data.text.split('\n');
    const linesPerPage = Math.ceil(lines.length / data.numpages);
    
    for (let i = 0; i < data.numpages; i++) {
      const startLine = i * linesPerPage;
      const endLine = Math.min((i + 1) * linesPerPage, lines.length);
      const pageText = lines.slice(startLine, endLine).join('\n');
      
      pageTexts.push({
        pageNumber: i + 1,
        text: pageText.trim()
      });
    }
    
    return {
      pages: pageTexts,
      totalPages: data.numpages,
      metadata: data.info
    };
  } catch (error) {
    console.error('PDF page extraction error:', error);
    throw new Error('Failed to extract text by page');
  }
}