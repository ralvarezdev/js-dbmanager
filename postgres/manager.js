import pkg from 'pg';
import {RemoveNullsFromObject} from "../lib/helpers.js";
import DatabaseManagerClient from "./client.js";

// DatabaseManager for Postgres databases
const {Pool} = pkg;
export default class DatabaseManager {
    #pool
    #logger

    // Constructor for DatabaseManager class
    constructor(
        {
            logger = null,
            user = null,
            password = null,
            host = null,
            database = null,
            port = 5432,
            ssl = null,
            connectionTimeoutMillis = 0,
            idleTimeoutMillis = 10000,
            max = 10,
            allowExitOnIdle = false,
            onConnect = (client) => {
            },
            onAcquire = (client) => {
            },
            onError = (err, client) => {
            },
            onRelease = (err, client) => {
            },
            onRemove = (client) => {
            },
        }
    ) {
        // Build the configuration object
        let config = {
            user,
            password,
            host,
            database,
            port,
            ssl,
            connectionTimeoutMillis,
            idleTimeoutMillis,
            max,
            allowExitOnIdle
        }

        // Set the logger
        this.#logger = logger;

        // Create a new pool with the configuration
        this.#pool = new Pool(RemoveNullsFromObject(config));

        // Log the creation of the pool
        if (this.#logger)
            this.#logger.info("Database pool created")

        // Set the client event listeners
        if (onConnect)
            this.#pool.on("connect", onConnect);
        if (onAcquire)
            this.#pool.on("acquire", onAcquire);
        if (onError)
            this.#pool.on("error", onError);
        if (onRelease)
            this.#pool.on("release", onRelease);
        if (onRemove)
            this.#pool.on("remove", onRemove);
    }

    // Get a connection from the pool
    async #connect() {
        // Create the database manager client
        const client= new DatabaseManagerClient(this.#pool);

        // Connect to the database
        await client.connect()

        return client
    }

    // Handle the query to the database
    async #handleQuery(query) {
        // Create a database manager client
        const client = await this.#connect();

        // Execute the query
        try {
            return await client.query(query);
        } catch (err) {
            throw err;
        } finally {
            // Release the client after the query
            await client.release();
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
        // Get a connection from the pool
        const client = await this.#connect();

        try {
            // Run the transaction function
            await client.runTransaction(txFn)
        } catch (err) {
            throw err;
        } finally {
            // Release the client after the transaction
            await client.release();
        }
    }

    // Run a transaction with multiple queries short version
    async runTx(txFn) {
        return await this.runTransaction(txFn)
    }

    // Close the pool
    async close() {
        // Log the closing of the pool
        if (this.#logger)
            this.#logger.info("Closing the database pool");

        await this.#pool.end();
    }
}