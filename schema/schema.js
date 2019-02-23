const {GraphQLDateTime} = require('graphql-iso-date');
const {GraphQLSchema, GraphQLObjectType, GraphQLInputObjectType, GraphQLID, GraphQLString, GraphQLFloat, GraphQLInt, GraphQLNonNull} = require('graphql');

const fakeDatabase = {
    categories: {
        'bad': {
            id: 'bad',
            name: 'This is Bad Category',
        },
        'mediocre': {
            id: 'mediocre',
            name: 'This is Mediocre Category',
        },
        'good': {
            id: 'good',
            name: 'This is Good Category',
        },
    },
    products: [
        {
            id: 1,
            name: 'This is Product One',
            description: 'Descriptions are for losers.',
            price: 10.99
        },
        {
            id: 2,
            name: 'This is Product Two',
            description: 'Descriptions are for losers.',
            price: 0.99
        },
        {
            id: 3,
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
        _id: {
            type: GraphQLID
        },
        name: {
            type: GraphQLString
        },
        description: {
            type: GraphQLString
        },
        price: {
            type: GraphQLFloat
        },
        quantity: {
            type: GraphQLInt
        },
        category: {
            type: CategoryType
        },
        created: {
            type: GraphQLDateTime
        }
    })
});

const ProductInputType = new GraphQLInputObjectType({
    name: 'ProductInputType',
    fields: () => ({
        id: { type: GraphQLInt },
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
    products: {
        type: ProductType,
        args: {
            filter: { type: ProductInputType }
        },
        resolve: (_, {filter}) => {
            return fakeDatabase.products.find((product) => {
                let found = false;
                const idFilterPresent = !!filter.id;
                const nameFilterPresent = !!filter.name;
                const quantityFilterPresent = !!filter.quantity;

                if (idFilterPresent) {
                    found = product.id === filter.id;
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
                return found;
            });
        }
    }
};

const rootQuery = new GraphQLObjectType({
    name: 'root_query',
    fields: rootQueryFields
});

// const rootMutationFields = {
//
// };
//
// const rootMutation = new GraphQLObjectType({
//     name: 'root_mutation',
//     fields: rootMutationFields
// });

const Schema = new GraphQLSchema({
    query: rootQuery,
    mutation: undefined,//rootMutation,
    subscription: undefined, // TODO: Find a solution for Subscriptions
});

module.exports = Schema;