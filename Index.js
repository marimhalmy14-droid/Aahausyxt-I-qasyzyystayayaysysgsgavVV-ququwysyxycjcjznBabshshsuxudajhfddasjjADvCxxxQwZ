const axios = require('axios');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Render requires a web server to stay alive. This fulfills that requirement.
app.get('/', (req, res) => res.send('UGC Tracker Live 24/7'));
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

// CONFIGURATION
const TARGET_URL = 'https://workers.dev'; 
const DISCORD_WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL_HERE'; 
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Live server memory cache to prevent duplicate alerts
let memoryHistory = [];

async function checkRobloxLeaks() {
    console.log("Checking for new Roblox UGC Drops...");
    try {
        const response = await axios.get(TARGET_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10)' }
        });

        const drops = response.data.leaks || response.data.drops || response.data; 
        
        if (!Array.isArray(drops)) {
            console.log("Endpoint layout response was not an array.");
            return;
        }

        for (const item of drops) {
            const itemId = item.id || item.name || item.title;
            if (!itemId) continue;

            if (!memoryHistory.includes(itemId)) {
                console.log(`New UGC Found: ${item.name || itemId}`);

                // Send to Discord Webhook
                await axios.post(DISCORD_WEBHOOK_URL, {
                    username: "UGC Leaks Tracker",
                    embeds: [{
                        title: item.name || "Unknown UGC Item",
                        color: 65280, // Green border
                        fields: [
                            { name: "📦 Stock Count", value: `${item.stock || 'Unknown'}`, inline: true },
                            { name: "🎫 Method", value: `${item.method || 'Free/Code'}`, inline: true },
                            { name: "⏰ Release Time", value: `${item.release || 'Not Set'}`, inline: false }
                        ],
                        timestamp: new Date().toISOString()
                    }]
                });
                
                memoryHistory.push(itemId);
            }
        }
        console.log("Check complete.");
    } catch (error) {
        console.error("Fetch Error:", error.message);
    }
}

// Run loop
checkRobloxLeaks();
setInterval(checkRobloxLeaks, CHECK_INTERVAL);

