// Import required modules
const express = require('express'); // 1) Import express module for building servers
const http = require('http'); // 2) Import http module for HTTP requests
const axios = require('axios'); // 3) Import axios module for HTTP requests
const sqlite3 = require('sqlite3').verbose(); // 4) Import sqlite3 module for database
const NodeCache = require('node-cache'); // 5) Import node-cache for caching
const db = new sqlite3.Database('database.db'); // Create sqlite3 database instance
const app = express(); // Create express app
const port = 5001; // The port for the order server is 5000

// Initialize cache with a time-to-live of 20 minutes
const cache = new NodeCache({ stdTTL: 1200, checkperiod: 120 });

// SQL query to create the "order" table
let ordersql = `CREATE TABLE IF NOT EXISTS "order" (order_number INTEGER PRIMARY KEY, item_number)`;

// Execute the query to create the table
db.run(ordersql, (err) => {
    if (err) {
        console.error('Error in creating table:', err.message);
    } else {
        console.log('The order table created successfully');
    }
});

// Handle POST requests to /purchase/:item_number
app.post('/purchase/:item_number', (req, res) => {
    const item_number = req.params.item_number;

    // Insert the order into the "order" table
    const insert_query = `INSERT INTO "order" (item_number) VALUES (?)`;
    db.run(insert_query, [item_number], (err) => {
        if (err) {
            console.error('Error inserting the data:', err.message);
        } else {
            console.log('Inserted successfully');
        }
    });

    // Query all orders
    const select_query = `SELECT * FROM "order"`;
    db.all(select_query, [], (err, rows) => {
        if (err) {
            console.error('Querying error:', err.message);
        } else {
            console.log('Table result:');
            rows.forEach((row) => console.log(row));
        }
    });

    // Check the cache for the item info
    const cacheKey = `item_${item_number}`;
    const cachedItem = cache.get(cacheKey);

    if (cachedItem) {
        console.log('Cache hit for item:', item_number);
        processPurchase(cachedItem, res, item_number);
    } else {
        console.log('Cache miss for item:', item_number);
        // Fetch item info from the Catalog service
        http.get('http://catalog:4000/info/' + item_number, (response) => {
            let responseData = '';
            response.on('data', (chunk) => {
                responseData += chunk;
            });

            response.on('end', () => {
                const itemInfo = JSON.parse(responseData);
                console.log('Fetched successfully:', itemInfo);

                // Add item info to cache
                cache.set(cacheKey, itemInfo);

                processPurchase(itemInfo, res, item_number);
            });
        });
    }
});

// Function to process a purchase
function processPurchase(itemInfo, res, item_number) {
    if (itemInfo[0].Stock > 0) {
        const updatedStock = itemInfo[0].Stock - 1;

        const updatedData = { Stock: updatedStock };

        // Update the stock in the Catalog service
        axios.put('http://catalog:4000/update/' + item_number, updatedData)
            .then(() => {
                console.log('Stock updated successfully');
                res.json({ message: 'Purchase completed' });
            })
            .catch((error) => {
                console.error('Error updating stock:', error.message);
                res.status(500).json({ message: 'Error updating stock' });
            });
    } else {
        res.json({ message: 'Item is sold out' });
    }
}

// Start the Order server
app.listen(port, () => {
    console.log('Server is running on port:', port);
});
