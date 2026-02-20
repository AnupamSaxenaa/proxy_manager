const http = require('http');

async function run() {
    try {
        // 1. Login to get token
        const loginData = JSON.stringify({ email: 'rahul@example.com', password: 'password123' });
        const loginOptions = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
        };

        const token = await new Promise((resolve, reject) => {
            const req = http.request(loginOptions, res => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve(JSON.parse(data).token)
                });
            });
            req.on('error', reject);
            req.write(loginData);
            req.end();
        });

        // 2. Create Event on the 26th
        const eventData = JSON.stringify({ title: 'Node API Test', event_type: 'other', event_date: '2026-02-26' });
        const createOptions = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/calendar',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': eventData.length,
                'Authorization': `Bearer ${token}`
            }
        };

        await new Promise((resolve, reject) => {
            const req = http.request(createOptions, res => {
                res.on('data', () => { });
                res.on('end', resolve);
            });
            req.on('error', reject);
            req.write(eventData);
            req.end();
        });

        // 3. Get Events
        const getOptions = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/calendar',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        };

        const events = await new Promise((resolve, reject) => {
            const req = http.request(getOptions, res => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve(JSON.parse(data).events)
                });
            });
            req.on('error', reject);
            req.end();
        });

        const testEvent = events.find(e => e.title === 'Node API Test');
        console.log("Sent: 2026-02-26");
        console.log("Received:", testEvent.event_date);

    } catch (e) {
        console.error(e);
    }
}

run();
