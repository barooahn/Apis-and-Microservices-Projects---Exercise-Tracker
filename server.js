const express = require('express')
const app = express()
const bodyParser = require('body-parser')
var mongo = require('mongodb');
const cors = require('cors')

const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose);
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username:{type:String,required:true},
}); 
userSchema.plugin(AutoIncrement, {inc_field: 'id'});
const User = mongoose.model("User", userSchema);

const exerciseSchema = new Schema({
  userId:{type:String,required:true},
  description:{type:String,required:true},
  duration:{type:Number,required:true},
  date:{type:Date}
}); 

const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user', (req,res) => {
  console.log(req.body.username); 
    User.create({ username: req.body.username }, function (err, data) {
      console.log(data);
      if (err) {
        console.log(err)
        res.json({"error":err.code});
      }else {
        res.json({"username":data.username, "userId":data.id });
      }
    });
});

app.get('/api/exercise/users', (req,res) => {
  User.find({}, function(err, users) {
        console.log(users)
      if (!err){ 
          res.json({users});
      } else {throw err;}
  });
});

app.post('/api/exercise/add', (req,res,next) => {
  let date = "";  
  if(!req.body.date){ 
    date = Date.now()
  }else{  
    date = req.body.date}; 
   
    Exercise.create({  
        userId: req.body.userId,
        description: req.body.description,
        duration: req.body.duration,
        date: date
    }, function (err, data) {    
      if (err) {
        console.log(err)
        res.json({"error":err.code});
      }else {
        res.json({"exercise":data});
      }
    });
});

app.get('/api/exercise/log/:userId/:from?/:to?/:limit?', (req,res,next) => {
  const data = {
    'query':
      { 
        'id':  req.params.userId ,
       'from':  req.params.from || 0,
        'to':  req.params.to || Date.now(),
        'limit': parseInt(req.params.limit)
      }
  }
  const {id, from, to, limit } = data.query;
  
  console.log('limit ', limit);
  Exercise.find({userId: id, date: { $gte: from, $lte: to}})
      .limit(limit)
      .exec(function(err, exercises) {
      if (!err){ 
          res.json({exercises});
      } else {throw err;}
  });
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
