// Import the required modules
const express = require('express');          // Express module for building servers
const http = require('http');                // HTTP module for HTTP requests
const axios = require('axios');              // Axios module for HTTP requests
const app = express();                       // Create express app
const port = 3000;                           // Frontend server runs on port 3000

// Replica servers for catalog and order
const catalogReplicas = ["http://catalog:4000", "http://catalog2:4001"];
const orderReplicas = ["http://order:5000", "http://order2:5001"];

// Indexes for round-robin load balancing
let catalogIndex = 0;
let orderIndex = 0;

// Round-robin function
function getNextReplica(replicas, currentIndex) {
    const replica = replicas[currentIndex];
    const nextIndex = (currentIndex + 1) % replicas.length; // Move to the next replica
    return { replica, nextIndex };
}

// Handle search requests (Catalog load balancing)
app.get('/search/:topic', (req, res) => {
    const { replica, nextIndex } = getNextReplica(catalogReplicas, catalogIndex);
    catalogIndex = nextIndex; // Update catalog index for the next request

    try {
        http.get(`${replica}/search/${req.params.topic}`, (response) => { // Forward to a replica
            response.on("data", (chunk) => {
                const responseData = JSON.parse(chunk); // Parse response to JSON
                res.json(responseData); // Send the response to the client
                console.log(responseData);
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message }); // Handle errors
    }
});

// Handle info requests (Catalog load balancing)
app.get('/info/:item_number', (req, res) => {
    const { replica, nextIndex } = getNextReplica(catalogReplicas, catalogIndex);
    catalogIndex = nextIndex; // Update catalog index for the next request

    try {
        http.get(`${replica}/info/${req.params.item_number}`, (response) => { // Forward to a replica
            response.on("data", (chunk) => {
                const responseData = JSON.parse(chunk);
                res.json(responseData);
                console.log(responseData);
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message }); // Handle errors
    }
});

// Handle purchase requests (Order load balancing)
app.post('/purchase/:item_number', async (req, res) => {
    const { replica, nextIndex } = getNextReplica(orderReplicas, orderIndex);
    orderIndex = nextIndex; // Update order index for the next request

    try {
        const response = await axios.post(`${replica}/purchase/${req.params.item_number}`); // Forward to a replica
        console.log('Ordered successfully');
        console.log(response.data);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message }); // Handle errors
    }
});

// Start the frontend server
app.listen(port, () => {
    console.log(`Front end server is running at ${port}`);
});
