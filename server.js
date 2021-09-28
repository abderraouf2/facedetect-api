const express= require('express');
const bodyparser= require('body-parser');
const bcrypt= require('bcrypt-nodejs');
const cors= require('cors');
const knex= require('knex');
const clarifai = require('clarifai')


const db=knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'mac',
    password : '',
    database : 'smart-brain'
  }
});
const app= express();
app.use(bodyparser.json());
app.use(cors())
app.get('/', (req,res)=>{
  res.send('success');
})
app.get('/profile/:id', (req,res)=>{
  const {id}= req.params;
  db.select('*').from('users').where({
    id:id
  }).then(user=>{
     if(user.length) {
      res.json(user[0])
    }else{
      res.status(400).json('not found')
    }
  })
  .catch(err=>res.status(400).json('error getting the user'))
})
app.post('/signin', (req,res)=>{
 db.select('email','hash').from('login')
 .where('email','=',req.body.email)
 .then(data=>{
  const isvalid= bcrypt.compareSync(req.body.password, data[0].hash);
  if(isvalid){
    return db.select('*').from('users')
    .where('email','=',req.body.email)
    .then(user=>{
      res.json(user[0])
    })
    .catch(err=>res.status(400).json('unable to get user'))
  }
  else {res.status(400).json('wrong credencials')}
 })
 .catch(err=>res.status(400).json('wrong information'))
})

app.post('/register', (req,res)=>{
  const {email, name, password}= req.body;
  const hash = bcrypt.hashSync(password);
  db.transaction(trx=>{
    trx.insert({
      hash: hash,
      email: email
    })
    .into('login')
    .returning('email')
    .then(logInEmail=>{
      return trx('users')
      .returning('*')
      .insert({
        email:logInEmail[0],
        name:name,
        joined:new Date()
      }).then(user=>{
        res.json(user[0]);
      })
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
      
      .catch(err=>res.status(400).json('unable to register'));
})
app.put('/image', (req,res)=>{
  const {id}= req.body;
  db('users').where('id', '=', id)
  .increment('entries',1)
  .returning('entries')
  .then(entries=>{
    res.json(entries[0]);
  })
  .catch(err=>res.status(400).json('unable to get entries'))
})







app.listen(3001, ()=>{
  console.log('app is running');
})