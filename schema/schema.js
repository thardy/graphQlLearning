const {GraphQLDateTime} = require('graphql-iso-date');
const {GraphQLSchema, GraphQLObjectType, GraphQLInputObjectType, GraphQLList, GraphQLID, GraphQLString, GraphQLFloat, GraphQLInt, GraphQLNonNull} = require('graphql');
const ObjectId = require('mongodb').ObjectID;

const fakeDatabase = {
    categories: {
        'bad': {
            _id: '5c8b9ddf972be631fa099720',
            name: 'bad',
        },
        'mediocre': {
            _id: '5c8b9ded972be631fa099721',
            name: 'mediocre',
        },
        'good': {
            _id: '5c8b9df9972be631fa099722',
            name: 'good',
        },
    },
    products: [
        {
            _id: '5c8b9e1a972be631fa099723',
            name: 'This is Product One',
            description: 'Descriptions are for losers.',
            price: 10.99
        },
        {
            _id: '5c8b9e2c972be631fa099724',
            name: 'This is Product Two',
            description: 'Descriptions are for losers.',
            price: 0.99
        },
        {
            _id: '5c8b9e37972be631fa099725',
            name: 'This is Product Three',
            description: 'Descriptions are for losers.',
            price: 19.99
        },
    ]
};

const CategoryType = new GraphQLObjectType({
    name: 'CategoryType',
    fields: () => ({
        _id: {
            type: GraphQLID
        },
        name: {
            type: GraphQLString
        },
        description: {
            type: GraphQLString
        },
        created: {
            type: GraphQLDateTime
        }
    })
});

const ProductType = new GraphQLObjectType({
    name: 'ProductType',
    fields: () => ({
        _id: { type: GraphQLID },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
        price: { type: GraphQLFloat },
        // quantity: { type: GraphQLInt },
        // category: { type: CategoryType },
        // created: { type: GraphQLDateTime }
    })
});

const ProductInputType = new GraphQLInputObjectType({
    name: 'ProductInputType',
    fields: () => ({
        _id: { type: GraphQLID },
        name: { type: GraphQLString },
        quantity: { type: GraphQLInt },
    }),
});

const rootQueryFields = {
    // categories: {
    //     type: CategoryType,
    //     args: {
    //         id: { type: GraphQLID }
    //     },
    //     resolve: ???
    // },
    // info: {
    //     type: GraphQLString,
    //     resolve: () => `This is my practice, manually-created GraphQL Api!!!`
    // },
    products: {
        type: new GraphQLList(ProductType),
        args: {
            filter: { type: ProductInputType }
        },
        resolve: (root, {filter}) => {
            const results = fakeDatabase.products.filter((product) => {
                if (!filter) {
                    return true;
                }
                let found = false;
                const idFilterPresent = !!filter._id;
                const nameFilterPresent = !!filter.name;
                const quantityFilterPresent = !!filter.quantity;

                if (idFilterPresent) {
                    found = product._id === filter._id;
                    if (!found) {
                        return false;
                    }
                }
                if (nameFilterPresent) {
                    found = product.name.toLowerCase().includes(filter.name.toLowerCase());
                    if (!found) {
                        return false;
                    }
                }
                if (quantityFilterPresent) {
                    found = product.quantity === filter.quantity;
                    if (!found) {
                        return false;
                    }
                }
                if (!idFilterPresent && !nameFilterPresent && !quantityFilterPresent) {
                    found = true;
                }
                return found;
            });

            return results;

        }
    }
};

const rootQuery = new GraphQLObjectType({
    name: 'root_query',
    fields: rootQueryFields
});

const rootMutationFields = {
    create_product: {
        type: ProductType,
        args: {
            _id: { type: GraphQLID },
            name: { type: GraphQLString },
            description: { type: GraphQLString },
            price: { type: GraphQLFloat },
            quantity: { type: GraphQLInt },
            categoryId: { type: GraphQLID },
            created: { type: GraphQLDateTime }
        },
        resolve: (root, args, context, info) => {
            const product = {
                _id: new ObjectId().toString(),
                ...args
            };
            fakeDatabase.products.push(product);
            return product;
        }
    }
};

const rootMutation = new GraphQLObjectType({
    name: 'root_mutation',
    fields: rootMutationFields
});

const Schema = new GraphQLSchema({
    query: rootQuery,
    mutation: rootMutation,
    subscription: undefined, // TODO: Find a solution for Subscriptions
});

module.exports = Schema;
