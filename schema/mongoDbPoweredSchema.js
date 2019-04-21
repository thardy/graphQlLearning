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
        resolve: async (root) => {
            // return fakeDatabase.categories;
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
        args: {
            filter: {
                type: ProductInputType
            }
        },
        resolve: async (root, {filter}, context, info) => {
            const collectionName = 'products';
            convertStringIdToObjectId(filter);
            const foundProducts = await context.db.collection(collectionName).find(filter).toArray();

            // const requestedFields = info.fieldNodes[0].selectionSet.selections;
            // let categoryFieldRequested = false;
            //
            // for(let field of requestedFields) {
            //     if (field.name.value === 'category') {
            //         categoryFieldRequested = true;
            //         break;
            //     }
            // }
            //
            // if (categoryFieldRequested) {
            //     // todo: if there's a bulk fetch (provide a delimited list of ids or something), this would be a good place to use it.
            //     foundProducts.forEach((product) => {
            //         const category = fakeDatabase.categories.find((category) => {
            //             return category._id === product.categoryId;
            //         });
            //         product.category = category;
            //     });
            // }

            return foundProducts;
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
        resolve: async (root, args, context, info) => {
            // const product = {
            //     _id: new ObjectId().toString(),
            //     ...args
            // };
            // fakeDatabase.products.push(product);

            const collectionName = 'products';
            const result = await context.db.collection(collectionName).insert(args);
            return result.ops[0];
        }
    },
    update_products: {
        type: MongoResultType,//new GraphQLList(ProductType),
        args: {
            filter: { type: ProductInputType },
            update: { type: ProductInputType }
        },
        resolve: async (root, {filter, update}, context, info) => {
            // const foundProducts = findProductsUsingFilter(args.filter);
            //
            // foundProducts.forEach((product) => {
            //     for(const prop in args.update) {
            //         product[prop] = args.update[prop];
            //     }
            // });
            // return foundProducts;
            const collectionName = 'products';
            convertStringIdToObjectId(filter);
            const result = await context.db.collection(collectionName).update(filter, {$set: update});
            return result.result;
        }
    },
    delete_product: {
        type: MongoResultType,
        args: { _id: { type: GraphQLID } },
        resolve: async (root, args, context, info) => {
            // const index = fakeDatabase.products.findIndex((product) => product._id === args._id);
            // const deletedProducts = fakeDatabase.products.splice(index, 1);
            // return deletedProducts[0];
            const collectionName = 'products';
            convertStringIdToObjectId(args);
            const result = await context.db.collection(collectionName).remove(args);
            return result.result;
        }
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
