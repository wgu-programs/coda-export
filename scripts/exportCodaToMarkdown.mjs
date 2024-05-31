import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CODA_API_KEY = process.env.CODA_API_KEY;
const DOC_ID = process.env.DOC_ID;
const API_URL = `https://coda.io/apis/v1/docs/${DOC_ID}/pages`;

async function fetchCodaData(url, headers) {
    const response = await fetch(url, { headers });
    if (!response.ok) {
        console.error(`Error fetching data from ${url}:`, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

async function exportCodaDocument() {
    const headers = {
        Authorization: `Bearer ${CODA_API_KEY}`,
    };

    const docUrl = `https://coda.io/apis/v1/docs/${DOC_ID}`;
    const doc = await fetchCodaData(docUrl, headers);

    const pagesUrl = `${API_URL}`;
    const pagesData = await fetchCodaData(pagesUrl, headers);

    const pages = pagesData.items;
    for (const page of pages) {
        const pageId = page.id;
        const pageName = page.name;
        const pageUrl = `https://coda.io/apis/v1/docs/${DOC_ID}/pages/${pageId}`;
        const pageData = await fetchCodaData(pageUrl, headers);

        // Assuming pageData has a 'content' field that contains the markdown content
        const markdownContent = `# ${pageName}\n\n${pageData.content}`;

        const outputPath = path.join(__dirname, './exports', `${pageName}.md`);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, markdownContent);
    }
}

console.log('Current directory:', process.cwd());
exportCodaDocument()
    .then(() => console.log('Export complete'))
    .catch((err) => console.error('Error exporting document:', err));
