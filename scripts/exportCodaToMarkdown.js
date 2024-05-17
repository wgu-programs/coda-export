const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const CODA_API_KEY = process.env.CODA_API_KEY;
const DOC_ID = '_d1s_ZG0bmZ4';
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

    const outputPath = path.join('exports', `${pageName}.md`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, markdownContent);
  }
}

exportCodaDocument()
  .then(() => console.log('Export complete'))
  .catch(err => console.error('Error exporting document:', err));
