import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CODA_API_KEY = process.env.CODA_API_KEY;
const DOC_ID = process.env.DOC_ID;
const API_URL = `https://coda.io/apis/v1/docs/${DOC_ID}`;

async function fetchCodaData(url, headers) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

async function exportCodaDocument() {
  const headers = {
    'Authorization': `Bearer ${CODA_API_KEY}`
  };

  const doc = await fetchCodaData(API_URL, headers);

  const pages = doc.sections;
  for (const page of pages) {
    const pageId = page.id;
    const pageName = page.name;
    const pageUrl = `${API_URL}/pages/${pageId}`;
    const pageData = await fetchCodaData(pageUrl, headers);
    const markdownContent = `# ${pageName}\n\n${pageData.content}`;

    const outputPath = path.join(__dirname, '../exports', `${pageName}.md`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, markdownContent);
  }
}

exportCodaDocument()
  .then(() => console.log('Export complete'))
  .catch(err => console.error('Error exporting document:', err));
