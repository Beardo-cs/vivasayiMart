//declaring mongoose module, mongoose is a ODM which manages the relationship b/w data and provides schema validation.
const mongoose = require('mongoose'); 

//defining schema, it represents the structure of the document                                        
const UserSchema = new mongoose.Schema( {   
    name: { 
        type: String,
        required: true
    },
    email: {
        type: String,                                                                                                                                                                                                        
        required: true,
        unique: true
    },
    password: { 
        type: String,
        required: true,
    },  
    // gravatar allows us to attach a profile image to email
    avatar: {                           
        type: String
    },
    date: { 
        type: Date,
    //automatically it takes current time and date.
        default: Date.now       
    }
});

//exporting it and set a variable user to mongoose.model.here User is model name and schema                                                                                                                                                   
module.exports = User = mongoose.model('User', UserSchema);      