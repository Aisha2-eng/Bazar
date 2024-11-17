const express = require('express'); // 1) Import express module for building servers
const http = require('http'); // 2) Import http module for http req
const DatabaseConfig = require('./DatabaseConfig'); // 3) Import DatabaseConfig to deal with the database
const NodeCache = require('node-cache'); // Import NodeCache for in-memory caching

const app = express(); // Create express app
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600, maxKeys: 100 }); // Cache with a 1-hour TTL
const port = 4001; // The port for the front-end server is 4000

app.use(express.json()); // Middleware to parse incoming JSON data

// Search by topic (uses cache)
app.get('/search/:topic', (req, res) => {
  const topic = req.params.topic;

  // Check cache
  const cachedData = cache.get(topic);
  if (cachedData) {
    console.log('Cache hit');
    return res.json(cachedData);
  }

  console.log('Cache miss');
  // Fetch from database if not in cache
  DatabaseConfig.searchTopic(topic, (err, data) => {
    if (err) {
      res.status(500).send('Error fetching data from database'); // Error handling
    } else {
      cache.set(topic, data); // Cache the result
      console.log('Fetched successfully and cached');
      console.log(data);
      res.json(data);
    }
  });
});

// Fetch info by item_number
app.get('/info/:item_number', (req, res) => {
  const item_number = req.params.item_number;

  // Check cache
  const cachedData = cache.get(item_number);
  if (cachedData) {
    console.log('Cache hit');
    return res.json(cachedData);
  }

  console.log('Cache miss');
  // Fetch from database if not in cache
  DatabaseConfig.info(item_number, (err, data) => {
    if (err) {
      res.status(500).send('Error fetching data from database'); // Error handling
    } else {
      cache.set(item_number, data); // Cache the result
      console.log('Fetched successfully and cached');
      console.log(data);
      res.json(data); // If success, send the data as JSON
    }
  });
});


// Update stock and invalidate cache
app.put('/update/:item_number', (req, res) => {
  const item_number = req.params.item_number;
  const stock = req.body.Stock;

  console.log('Updating stock:', stock);

  DatabaseConfig.updateStock(stock, item_number, (err) => {
    if (err) {
      res.status(500).send('Error updating stock in database'); // Error handling
    } else {
      // Invalidate cache
      const keys = cache.keys();
      keys.forEach((key) => {
        if (key.includes(item_number)) {
          cache.del(key); // Invalidate cache entries related to this item
        }
      });

      console.log('Cache invalidated for item:', item_number);
      res.status(200).send('Stock updated and cache invalidated (catalog2)');
    }
  });
});

// Start the catalog server
app.listen(port, () => {
  console.log('Catalog server is running at 4001');
});
