const mongoose = require('mongoose')
const UserSchema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: { type: String, required: true },
    lname: { type: String, required: true },
    fname: { type: String, required: true },
    pnumber: { type: Number, required: true },
    mail: { type: String, required: true }
},
{
    collection: 'users'
})
const model = mongoose.model('UserSchema',UserSchema)
module.exports = model