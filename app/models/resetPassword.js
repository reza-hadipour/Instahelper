const mongoose = require('mongoose');
const resetPasswordSchema = new mongoose.Schema({
    resetToken : {type: String, required: true}
})

module.exports = mongoose.model('resetPassword',resetPasswordSchema);