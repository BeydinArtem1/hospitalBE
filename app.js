const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const Schema = mongoose.Schema;

const userScheme = new Schema({
  login: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

const url = 'mongodb+srv://ArtemBeydin:Restart987@cluster0.cm9vp.mongodb.net/Hospital?retryWrites=true&w=majority';
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

const User = mongoose.model('users', userScheme);

app.use(express.json());
app.use(cors());

const addToken = (id) => {
  const payload = {
    id
  }
  return jwt.sign(payload, 'key', { expiresIn: "24h" })
}

app.post('/authorize', (req, res) => {
  if (req.body.hasOwnProperty('login') && req.body.hasOwnProperty('password')) {
    User.findOne({ login: req.body.login }).then(result => {
      if (result) {
        const validPass = bcrypt.compareSync(req.body.password, result.password);
        if (!validPass) {
          res.status(404).send('invalid pass');
        } else {
          const token = addToken(result._id);
          res.send(token);
        }
      } else res.status(404).send('user not found');
    });
  } else res.status(422).send('invalid property name');
});

app.post('/createUser', (req, res) => {
  if (req.body.hasOwnProperty('login') && req.body.hasOwnProperty('password')) {
    const hashPass = bcrypt.hashSync(req.body.password, 6);
    const user = new User({ login: req.body.login, password: hashPass });
    User.findOne({ login: req.body.login }).then(result => {
      if (result) {
        res.status(404).send('this user already exists');
      } else user.save().then(result => {
        res.send({ data: result });
      });
    });
  } else {
    res.status(422).send('invalid property name');
  }
});

app.listen(8000, () => {
  console.log('Hospital works on port 8000!')
});