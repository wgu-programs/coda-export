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

async function fetchPageExportUrl(pageId, headers) {
    const exportUrl = `https://coda.io/apis/v1/docs/${DOC_ID}/pages/${pageId}/content/export`;
    const response = await fetch(exportUrl, {
        method: 'POST',
        headers
    });
    if (!response.ok) {
        console.error(`Error initiating export for page ${pageId}:`, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}

async function getExportStatus(statusUrl, headers) {
    let statusResponse = await fetchCodaData(statusUrl, headers);
    while (statusResponse.status === 'pending') {
        console.log(`Export status for ${statusUrl} is pending. Waiting for 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
        statusResponse = await fetchCodaData(statusUrl, headers);
    }
    if (statusResponse.status !== 'success') {
        console.error(`Export failed for URL ${statusUrl}:`, statusResponse);
        throw new Error('Export failed');
    }
    return statusResponse;
}

async function exportCodaDocument() {
    const headers = {
        Authorization: `Bearer ${CODA_API_KEY}`,
    };

    const pagesData = await fetchCodaData(API_URL, headers);
    const pages = pagesData.items;

    console.log(pages);
    
    for (const page of pages) {
        const pageId = page.id;
        const pageName = page.name;

        try {
            const exportInitResponse = await fetchPageExportUrl(pageId, headers);
            const statusUrl = exportInitResponse.statusUrl;

            const exportStatus = await getExportStatus(statusUrl, headers);
            const exportContentUrl = exportStatus.gcsFileUrl;

            const markdownContentResponse = await fetch(exportContentUrl);
            if (!markdownContentResponse.ok) {
                console.error(`Error fetching export content for page ${pageId}:`, markdownContentResponse.statusText);
                throw new Error(`HTTP error! status: ${markdownContentResponse.status}`);
            }
            const markdownContent = await markdownContentResponse.text();

            const outputPath = path.join(__dirname, './exports', `${pageName}.md`);
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, markdownContent);

            console.log(`Exported page ${pageName} to ${outputPath}`);
        } catch (error) {
            console.error(`Error exporting page ${pageName}:`, error);
        }
    }
}

console.log('Current directory:', process.cwd());
exportCodaDocument()
    .then(() => console.log('Export complete'))
    .catch((err) => console.error('Error exporting document:', err));
