import EventEmitter from 'events'
import {RemoveNullsFromObject} from "../lib/helpers.js";

// Errors that can be thrown by the DatabaseManagerClient
const UNINITIALIZED_POOL_ERROR = new Error("Pool is not initialized");

// DatabaseManagerClient for Postgres databases
export default class DatabaseManagerClient {
    #pool
    #client
    #connecting
    #eventEmitter

    // Constructor for DatabaseManager class
    constructor(
        pool
    ) {
        // Check if the pool is null
        if (!pool)
            throw UNINITIALIZED_POOL_ERROR;

        // Set the database pool
        this.#pool = pool

        // Create the event emitter
        this.#eventEmitter=new EventEmitter()
    }

    // Connect to the database
    async connect() {
        // Check if the client has already been connected
        if (this.#client)
            return

        // Check if the client is connecting
        if (this.#connecting){
            await new Promise((resolve) => {
                    this.#eventEmitter.on('connected', () => {
                        resolve();
                    });
                });
            return
        }

        // Set as connecting
        this.#connecting = true

        // Get a client from the pool
        this.#client = await this.#pool.connect();

        // Emit the connected event
        this.#eventEmitter.emit('connected');
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
    async runTransaction(txFn = async (client) => {
    }) {
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
    async runTx(txFn) {
        return await this.runTransaction(txFn)
    }

    // Release the client
    async release() {
        await this.#client.release();
    }
}