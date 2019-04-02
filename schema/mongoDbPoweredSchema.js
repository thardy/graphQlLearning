const {GraphQLDateTime} = require('graphql-iso-date');
const {GraphQLSchema, GraphQLObjectType, GraphQLInputObjectType, GraphQLList, GraphQLID, GraphQLString, GraphQLFloat, GraphQLInt, GraphQLNonNull} = require('graphql');
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
            category: {type: CategoryType},
        };
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

function findProductsUsingFilter(filter) {
    return fakeDatabase.products.filter((product) => {
        let found = false;

        if (!filter) {
            found = true;
        }
        else {
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
        }

        return found;
    });
}

const rootQueryFields = {
    // todo: change this to not accept any args and add a getCategoryById query field
    getAllCategories: {
        type: new GraphQLList(CategoryType),
        args: {
            id: { type: GraphQLID }
        },
        resolve: (root) => {
            return fakeDatabase.categories;
        }
    },
    info: {
        type: GraphQLString,
        resolve: () => `This is my practice, manually-created GraphQL Api!!!`
    },
    products: {
        type: new GraphQLList(ProductType),
        args: {
            filter: { type: ProductInputType }
        },
        resolve: async (root, {filter}, context, info) => {
            // todo: either simplify this just to get it working, or skip it and move straight to graphql-to-mongodb implementation
            convertStringIdToObjectId(filter);
            const foundProducts = await context.db.collection('products').find(filter).toArray();

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

convertStringIdToObjectId = (filter) => {
    if (filter['_id']) {
        for (let property in  filter['_id']) {
            if (filter['_id'].hasOwnProperty(property)) {
                filter['_id'][property] = new ObjectID(filter['_id'][property]);
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
