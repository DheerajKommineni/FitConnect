const express = require('express');
const mongoose = require('mongoose');
const registerUser = require('./model');
const jwt = require('jsonwebtoken');
const middleware = require('./middleware');
const cors = require('cors');
const app = express();
const port = 8000;

// app.get('/', (req, res) => {
//   res.send('FitConnect App Welcomes you')
// })

mongoose
  .connect(
    'mongodb+srv://dheerajkommineni123:Dheeraj123ms@cluster0.ptcotdp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  )
  .then(() => console.log('DB Connected'))
  .catch(err => console.error('DB Connection Error:', err));

app.use(express.json());
app.use(cors({ origin: '*' }));

app.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmpassword } = req.body;
    let exist = await registerUser.findOne({ email });
    if (exist) {
      return res.status(400).send('User Already Exists');
    }
    if (password !== confirmpassword) {
      return res.status(400).send('Passwords Do Not Match');
    }
    let newUser = new registerUser({
      username,
      email,
      password,
      confirmpassword,
    });
    await newUser.save();
    return res.status(200).send('Registered Successfully');
  } catch (err) {
    console.log(err);
    return res.status(500).send('Internal Server Error');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let exist = await registerUser.findOne({ email });
    if (!exist) {
      return res.status(400).send('User Not Found');
    }
    if (exist.password !== password) {
      return res.status(400).send('Invalid Credentials');
    }

    let payload = {
      user: {
        id: exist.id,
      },
    };
    jwt.sign(payload, 'jwtSecret', { expiresIn: 3600000 }, (err, token) => {
      if (err) throw err;
      return res.json({ token });
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send('Internal Server Error');
  }
});

app.get('/dashboard', middleware, async (req, res) => {
  try {
    let exist = await registerUser.findById(req.user.id);
    if (!exist) {
      return res.status(400).send('User Not Found');
    }
    res.json(exist);
  } catch (err) {
    console.log(err);
    return res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
