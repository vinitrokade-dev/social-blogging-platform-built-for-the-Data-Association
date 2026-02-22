const mongoose=require('mongoose');

let userSchema=mongoose.Schema({
    username:String,
    age:Number,
    email:String,
    password:String,
    posts:[
        {
            type:mongoose.Schema.Types.ObjectId,ref:"post",
            ref:"post"
        }

    ]
});

module.exports=mongoose.model('user',userSchema);
