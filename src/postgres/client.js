import {Pool} from 'pg';
import {RemoveNullsFromObject} from "../../lib/helpers";

// Errors that can be thrown by the DatabaseManagerClient
const ErrNullPool = new Error("Pool is null");

// DatabaseManagerClient for Postgres databases
export default class DatabaseManagerClient {
    #client

    // Constructor for DatabaseManager class
    async constructor(
        pool
    ) {
        // Check if the pool is null
        if (!pool) {
            throw ErrNullPool;
        }

        // Connect to the pool
        this.#client = await pool.connect();
    }

    // Handle the query to the database
    async #handleQuery(query) {
        // Execute the query
        try {
            return await this.#client.query(query);
        } catch (err) {
            throw err;
        }
    }

    // Raw query to the database
    async rawQuery(text, ...values) {
        return await this.#handleQuery({text, values});
    }

    // Query the database
    async query({
                    text = null,
                    values = null,
                    name = null,
                    rowMode = null,
                    types = null,
                }) {
        // Check the query parameters
        let query = {text, values, name, rowMode, types};

        return await this.#handleQuery(RemoveNullsFromObject(query));
    }

    // Run a transaction with multiple queries
    async runTransaction(txFn= async (client) => {}) {
        try {
            // Begin the transaction
            await this.#client.query('BEGIN');

            // Run the transaction function
            await txFn(this);

            // Commit the transaction
            await this.#client.query('COMMIT');
        } catch (err) {
            // Rollback the transaction
            await this.#client.query('ROLLBACK');
            throw err;
        }
    }

    // Run a transaction with multiple queries short version
    async runTx(txFn){
        return await this.runTransaction(txFn)
    }

    // Release the client
    async release() {
        await this.#client.release();
    }
}