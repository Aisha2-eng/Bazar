const sqlite3 = require('sqlite3').verbose();                                      // import Sqlite3 module
const db = new sqlite3.Database('data.db',sqlite3.OPEN_READWRITE,(err)=>{          // create a new Sqlite instance with read-write mode

    if(err) 
    return console.error(err.message);
});
let sql;
function createCatalogTable(){                                                     //function to create catalog table
   sql = `CREATE TABLE IF NOT EXISTS catalog(ISBN INTEGER PRIMARY KEY,Title,Cost,Topic,Stock)`;
   db.run(sql)
}

function insertIntoCatalog(title,cost,topic,stock){                                //function to insert data into the catalog table  
   sql =`INSERT INTO catalog (Title,Cost,Topic,Stock) VALUES(?,?,?,?)`
   db.run(sql,[title,cost,topic,stock],(err)=>{
    if(err) 
    return console.error(err.message);
})
}
function searchTopic(topic, callback){                                             //function to search for item                              
    sql=`SELECT * FROM catalog where Topic = ?`;
    db.all(sql,[topic],(err,rows)=>{
        db.all(sql, [topic], (err, rows) => {
            if (err) {
                callback(err, null);
            } else {
                callback(null, rows);
            }
        });
    })
    }  
function info(ISBN, callback) {                                                  //function to retrieve info about an item 
    const sql = `SELECT * FROM catalog WHERE ISBN = ?`;
    db.all(sql, [ISBN], (err, row) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, row);
        }
    });
}

function updateStock(stock,ISBN,callback){                                     //function to update the stock of an item 
    sql=`UPDATE catalog SET Stock = ? where ISBN = ?`;
    db.run(sql,[stock,ISBN],(err)=>{

        if (err) {
            callback(err, null);
        } else {
            console.log("Stock updated successfully");
        }
    })
        
    }
    
    module.exports = {                                                       //export functions to be used externally
        createCatalogTable,
        insertIntoCatalog,
        searchTopic,
        info,
        updateStock
     }