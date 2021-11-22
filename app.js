const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Schema = mongoose.Schema;
const { secret } = require('./config.env');
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
const taskScheme = new Schema({
  name: {
    type: String,
    required: true
  },
  doc: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  cause: {
    type: String,
    required: true
  }
});

const url = 'mongodb+srv://ArtemBeydin:Restart987@cluster0.cm9vp.mongodb.net/Hospital?retryWrites=true&w=majority';
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });

const Task = mongoose.model('Tasks', taskScheme);
const User = mongoose.model('users', userScheme);

app.use(express.json());
app.use(cors());

const addToken = (id) => {
  const payload = {
    id
  }
  return jwt.sign(payload, secret, { expiresIn: "24h" })
}

app.get('/allTasks', (req, res) => {
  Task.find().then(result => {
    res.send({ data: result });
  });
})

app.post('/saveTask', (req, res) => {
  if (
    req.body.hasOwnProperty('name') &&
    req.body.hasOwnProperty('doc') &&
    req.body.hasOwnProperty('date') &&
    req.body.hasOwnProperty('cause')) {
    const task = new Task(req.body);
    task.save().then(result => {
      res.send({ data: result });
    });
  } else {
    res.status(422).send('invalid property name');
  }
});

app.delete('/deleteTask', (req, res) => {
  if (req.query._id) {
    Task.deleteOne({ _id: req.query._id }).then((result) => {
      Task.find().then((result) => {
        res.send({ data: result });
      });
    });
  } else {
    res.status(404).send('id not found');
  }
});

app.post('/authorize', (req, res) => {
  if (req.body.hasOwnProperty('login') && req.body.hasOwnProperty('password')) {
    User.findOne({ login: req.body.login }).then(result => {
      if (result) {
        const validPass = bcrypt.compareSync(req.body.password, result.password);
        if (validPass) {
          const token = addToken(result._id);
          res.send(token);
        } else res.status(404).send('invalid pass');
      } else res.status(404).send('user not found');
    });
  } else res.status(422).send('invalid property name');
});

app.post('/createUser', (req, res) => {
  if (req.body.hasOwnProperty('login') && req.body.hasOwnProperty('password')) {
    const hashPass = bcrypt.hashSync(req.body.password, 6);
    User.findOne({ login: req.body.login }).then(result => {
      if (result) {
        res.status(404).send('this user already exists');
      } else {
        const user = new User({ login: req.body.login, password: hashPass });
        user.save().then(result => {
          res.send({ data: result });
        });
      }
    });
  } else res.status(422).send('invalid property name');
});

app.listen(8000, () => {
  console.log('Hospital works on port 8000!')
});