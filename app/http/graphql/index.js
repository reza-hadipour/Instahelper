const typeDefs = `#graphql
type Query {
    hello: String
}`;


const resolvers = {
    Query: {
        hello: ()=> 'world'
    }
};


module.exports = {
    typeDefs, resolvers
}