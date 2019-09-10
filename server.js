const express = require('express');
// const schema = require('./schema/manualSchema');
// const schema = require('./schema/mongoDbPoweredSchema');
const schema = require('./schema/graphQLToMongoDbSchema');
//var graphQLHTTP = require('express-graphql');
const {ApolloServer, makeExecutableSchema} = require('apollo-server-express');
const mongodb = require('mongodb');
const assert = require('assert');
//const CustomApolloServer = require('./apollo/customApolloServer');

(async () => {
    const MongoClient = mongodb.MongoClient;
    const mongoUrl = 'mongodb://localhost:27017';
    let db;

    try {
        let client = await MongoClient.connect(mongoUrl);
        db = client.db('graphQLTest');
    } catch (error) {
        console.error(error);
        process.exit(1);
    }

    // single-tenant, but fancier way
    const app = express();
    const port = 4001 || process.env;

    // const server = new ApolloServer({
    //     schema,
    //     context: {db: db},
    //     playground: {
    //         endpoint: `http://localhost:${port}/graphql`,
    //         settings: {
    //             'editor.theme': 'dark',
    //             'editor.cursorShape': 'line',
    //         }
    //     }
    // });
    //
    // server.applyMiddleware({
    //     app: app,
    // });

    // experiment BEGIN
    // using 2 separate instances
    // 1 for iql and the other for client access
    const apolloPlaygroundServer = new ApolloServer({
        schema: schema,
        introspection: true,
        context: {db: db},
        playground: {
            endpoint: `http://localhost:${port}/graphql-api`,
            settings: {
                'editor.theme': 'dark',
                'request.credentials': 'include',
                'editor.cursorShape': 'line',
            }
        }
    });

    const apolloApiServer = new ApolloServer({
        schema: schema,
        introspection: true,
        playground: false,
        context: {db: db}
    });


    // attach to express
    apolloApiServer.applyMiddleware({ app, path: "/graphql-api" });
    apolloPlaygroundServer.applyMiddleware({ app, path: "/graphql" });
    // experiment END

    app.listen(port, () => {
        console.log(`The server has started on port: ${port}`);
        console.log(`http://localhost:${port}/graphql`);
    });
})();

