const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  try {
    let token = req.header('x-token');
    console.log('TOKEN:', token);
    if (!token) {
      return res.status(400).send('Invalid Token');
    }
    let decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode.user;
    console.log('JWT verified, user:', req.user);
    next();
  } catch (err) {
    console.log('JWT verification error:', err);
    return res.status(500).send('Internal Server Error');
  }
};
