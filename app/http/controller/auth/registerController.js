const Controller = require("http/controller/controller.js");
const userModel = require('../../../models/user');

class registerController extends Controller{
    async regiser(req,res,next){
        let user = new userModel(req.body);
        await user.save();
        res.json(user);
    }


}

module.exports = new registerController;