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
        quantity: { type: GraphQLInt },
        category: { type: CategoryType },
        created: { type: GraphQLDateTime }
    })
});

const ProductInputTypeFields = {
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    price: { type: GraphQLFloat },
    quantity: { type: GraphQLInt },
    categoryId: { type: GraphQLID },
    created: { type: GraphQLDateTime }
};
const ProductInputType = new GraphQLInputObjectType({
    name: 'ProductInputType',
    fields: () => (ProductInputTypeFields),
});

function findProductsUsingFilter(filter) {
    return fakeDatabase.products.filter((product) => {
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
}

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
            return findProductsUsingFilter(filter);
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
        args: ProductInputTypeFields,
        resolve: (root, args, context, info) => {
            const product = {
                _id: new ObjectId().toString(),
                ...args
            };
            fakeDatabase.products.push(product);
            return product;
        }
    },
    update_products: {
        type: new GraphQLList(ProductType),
        args: {
            filter: { type: ProductInputType },
            update: { type: ProductInputType }
        },
        resolve: (root, args, context, info) => {
            const foundProducts = findProductsUsingFilter(args.filter);

            foundProducts.forEach((product) => {
                for(const prop in args.update) {
                    product[prop] = args.update[prop];
                }
            });
            return foundProducts;
        }
    },
    delete_product: {
        type: ProductType,
        args: { _id: { type: GraphQLID } },
        resolve: (root, args, context, info) => {
            const index = fakeDatabase.products.findIndex((product) => product._id === args._id);
            const deletedProducts = fakeDatabase.products.splice(index, 1);
            return deletedProducts[0];
        }
    },
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
