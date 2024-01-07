const userModel = require('../../models/userModel');
const pageModel = require('../../models/pageModel');
const postModel = require('../../models/postModel');
const commentModel = require('../../models/commentModel');

const typeDefs = `#graphql
type Query {
    hello: String
    users: [User]
    user(id: String!) : User
    post (id: String!) : Post
}

type User {
    name : String
    family : String
    email : String
    mobile: String
}

type Post {
    page: Page
    title: String
    slug: String
    body: String
    images: [String]
    likes: [User]
    likeCount: Int
    viewCount: Int
    commentCount: Int
    comments: [Comment]
    active: Boolean
}

type Page {
    username: String
    title: String
    description: String
    followersNum: Int
    active: Boolean
    status: String
}

type Comment{
    author: User
    comment: String
    approved: Boolean
    visible: Boolean
    comments : [Comment]
}


`;


const resolvers = {
    Query: {
        hello: ()=> 'world',
        user : async (parent,args) => {
            let user = await userModel.findById(args.id);
            return user;
        },
        users: async () => {
            let users = await userModel.find({'verifyed'  : true});
            return users;
        },
        post: async (parent,args) => await postModel.findById(args.id)
    },

    Post: {
        page: async (parent,args) => await pageModel.findById(parent.page),
        likes : async (parent,args) => { 
            let result = [];
            let users = await userModel.find({_id : {'$in' : parent.likes}})
            result.push(...users);
            return result;
        },
        comments : async (parent,args) => await commentModel.find({$and : [{'post' : parent.id},{"parent" : null } ]})
    },

    Comment: {
        author : async (parent,args) => {
            return await userModel.findById(parent.author);
        },
        comments : async (parent,args) => {
            let subComments = [];
            let result = await commentModel.find({'parent' : parent.id})
            subComments.push(...result);
            return subComments;
        }
    }
};


module.exports = {
    typeDefs, resolvers
}