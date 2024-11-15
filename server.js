const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const AdmZip = require('adm-zip');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());

// Endpoint for scraping
app.post('/scrape', async (req, res) => {
    const { url } = req.body;

    try {
        // Fetch HTML content
        const response = await axios.get(url);
        const html = response.data;

        // Parse HTML to extract links and assets
        const $ = cheerio.load(html);
        const zip = new AdmZip();

        // Add HTML file
        zip.addFile("index.html", Buffer.from(html, "utf-8"));

        // Collect and download other assets (like CSS, JS, images)
        const assets = [];
        $('link[href], script[src], img[src]').each((i, elem) => {
            const attr = elem.tagName === 'img' ? 'src' : 'href';
            let assetUrl = $(elem).attr(attr);

            if (assetUrl) {
                if (!assetUrl.startsWith('http')) {
                    assetUrl = new URL(assetUrl, url).href;
                }
                assets.push(assetUrl);
            }
        });

        for (const asset of assets) {
            try {
                const assetResponse = await axios.get(asset, { responseType: 'arraybuffer' });
                const fileName = path.basename(new URL(asset).pathname);
                zip.addFile(fileName, Buffer.from(assetResponse.data));
            } catch (error) {
                console.log(`Failed to fetch asset: ${asset}`);
            }
        }

        // Send ZIP file
        const zipBuffer = zip.toBuffer();
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', 'attachment; filename=website.zip');
        res.send(zipBuffer);
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
