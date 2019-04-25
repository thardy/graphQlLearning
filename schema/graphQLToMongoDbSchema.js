const { getGraphQLUpdateArgs, getMongoDbUpdateResolver, getGraphQLQueryArgs, getMongoDbQueryResolver } = require('graphql-to-mongodb');
const {GraphQLDateTime} = require('graphql-iso-date');
const {GraphQLSchema, GraphQLObjectType, GraphQLInputObjectType, GraphQLList, GraphQLID, GraphQLString, GraphQLFloat, GraphQLInt, GraphQLBoolean, GraphQLNonNull} = require('graphql');
const ObjectId = require('mongodb').ObjectID;

const CategoryType = new GraphQLObjectType({
    name: 'CategoryType',
    fields: () => {
        return {
            _id: {type: GraphQLID},
            name: {type: GraphQLString},
            description: {type: GraphQLString},
            created: {type: GraphQLDateTime},
        };
    }
});

const ProductType = new GraphQLObjectType({
    name: 'ProductType',
    fields: () => {
        return {
            _id: {type: GraphQLID},
            name: {type: GraphQLString},
            categoryId: {type: GraphQLID},
            description: {type: GraphQLString},
            price: {type: GraphQLFloat},
            quantity: {type: GraphQLInt},
            created: {type: GraphQLDateTime},
            updated: {type: GraphQLDateTime},
            // navigation properties
            category: {
                type: CategoryType,
                resolve: async (product, {ignoredFilter}, context) => {
                    const filter = {_id: product.categoryId };
                    convertStringIdToObjectId(filter);
                    const category = await context.db.collection('categories').findOne(filter);
                    return category;
                }
            },
        };
    }
});

const MongoResultType = new GraphQLObjectType({
    name: 'MongoResultType',
    fields: {
        ok: {
            type: GraphQLBoolean
        },
        n: {
            type: GraphQLInt,
        },
        nModified: {
            type: GraphQLInt,
        },
    }
});

const ProductInputTypeFields = {
    name: { type: GraphQLString },
    categoryId: { type: GraphQLID },
    description: { type: GraphQLString },
    price: { type: GraphQLFloat },
    quantity: { type: GraphQLInt },
    created: { type: GraphQLDateTime },
    updated: { type: GraphQLDateTime }
};
const ProductInputType = new GraphQLInputObjectType({
    name: 'ProductInputType',
    fields: () => (ProductInputTypeFields),
});

const rootQueryFields = {
    // todo: change this to not accept any args and add a getCategoryById query field
    getAllCategories: {
        type: new GraphQLList(CategoryType),
        args: {
            id: { type: GraphQLID }
        },
        resolve: async (root, args, context) => {
            const collectionName = 'categories';
            const allCategories = await context.db.collection(collectionName).find().toArray();
            return allCategories;
        }
    },
    info: {
        type: GraphQLString,
        resolve: () => `This is my practice, manually-created GraphQL Api!!!`
    },
    products: {
        type: new GraphQLList(ProductType),
        args: getGraphQLQueryArgs(ProductInputType),
        resolve: getMongoDbQueryResolver(
            ProductType,
            async (filter, projection, options, obj, args, context) => {
                const collectionName = 'products';
                options.projection = projection;
                convertStringIdToObjectId(filter);
                return await context.db.collection(collectionName).find(filter, options).toArray();
            }
        )
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
        resolve: async (root, args, context, info) => {
            // const product = {
            //     _id: new ObjectId().toString(),
            //     ...args
            // };
            // fakeDatabase.products.push(product);

            const collectionName = 'products';
            const result = await context.db.collection(collectionName).insert(args)      ;
            return result.ops[0];
        }
    },
    update_products: {
        type: MongoResultType,//new GraphQLList(ProductType),
        args: getGraphQLUpdateArgs(ProductInputType),
        resolve: getMongoDbUpdateResolver(
            ProductType,
            async (filter, update, options, projection, source, args, context, info) => {
                const collectionName = 'products';
                convertStringIdToObjectId(filter);
                const result = await context.db.collection(collectionName).updateMany(filter, update, options);
                return result.result;
            },
            {
                differentOutputType: true,
            }
        )
    },
    delete_product_byid: {
        type: MongoResultType,
        //args: getGraphQLQueryArgs(ProductType),
        args: getGraphQLQueryArgs(new GraphQLInputObjectType({ name: 'deleteByIdType', fields: () => ({_id: {type: GraphQLID}}) })),
        resolve: getMongoDbQueryResolver(
            ProductType,
            async (filter, projection, options, obj, args, context) => {
                const collectionName = 'products';
                convertFilterObjectIdsToObjectIds(filter);
                const result = await context.db.collection(collectionName).deleteMany(filter, options);
                return result.result;
            },
            {
                differentOutputType: true,
            }
        )
    },
};

convertStringIdToObjectId = (filter) => {
    if (filter && filter['_id']) {
        filter['_id'] = new ObjectId(filter['_id']);
        // for (let property in  filter['_id']) {
        //     if (filter['_id'].hasOwnProperty(property)) {
        //         filter['_id'][property] = new ObjectId(filter['_id'][property]);
        //     }
        // }
    }
};

convertFilterObjectIdsToObjectIds = (filter) => {
    if (filter['_id']) {
        for (let property in  filter['_id']) {
            if (filter['_id'].hasOwnProperty(property)) {
                filter['_id'][property] = new ObjectId(filter['_id'][property]);
            }
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
