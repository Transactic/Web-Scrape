const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cheerio = require('cheerio');

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

        // Load HTML into Cheerio for parsing
        const $ = cheerio.load(html);

        // Example: Extract all links
        const links = [];
        $('a').each((i, elem) => {
            links.push($(elem).attr('href'));
        });

        res.json({ links });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
