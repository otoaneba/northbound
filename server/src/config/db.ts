import { Pool } from 'pg';

// create a connection pool. This is a reusable connection to the database.
/**
 * Pool = a smart waiter in a restaurant who keeps 10 tables already set up instead
 * of setting up a brand-new table for every single customer.
 * 
 * Without Pool (Client):                 With Pool (what you actually want):
 * Every single API request is a new      You keep 10 ovens already hot (10 open DB connections) → when a request
 * customer walking in you have to:       comes in, you just hand them a hot oven instantly → query runs → give the
 *  • Open the front door                 oven back to the pool
 *  • Turn on the lights 
 *  • Start the oven
 *  • Make coffee  
 *  • …then do the actual work
 *    (run the SQL query)
 */

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Optional: test the connection on startup
pool.connect()
  .then(client => {
    console.log("Database connected successfully");
    client.release();
  })
  .catch(err => {
    console.log(process.env.DATABASE_URL);
    console.error("Database connection error:", err.stack);
  });

export default pool;