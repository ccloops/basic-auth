'use strict';

import User from './model.js';

export default (req, res, next) => {

  // Validate the user using the model's authenticate method
  let authenticate = (auth) => {
    User.authenticate(auth)
      .then(user => {
        if(!user) {
          getAuth();
        }
        req.user = user;
        next();
      });
  };

  // If we're not authenticated either show an error or pop a window
  let getAuth = () => {
    // Force an error for non-www requests
    // next('Invalid User ID or Password');

    // Force a login pop-up on www requests
    res.set({
      'WWW-Authenticate': 'Basic realm="my secrets"',
    }).send(401);
  };

  // Try to authenticate -- parse out the headers and do some work
  try {
    let auth = {};
    let authHeader = req.headers.authorization;

    if(!authHeader) {
      // throw 'Authentication Required';
      getAuth();
    }

    if(authHeader.match(/basic/i)) {
      let base64Header = authHeader.replace(/Basic\s+/i, '');
      let base64Buff = Buffer.from(base64Header, 'base64');
      // let base64Buff = new Buffer(base64Header, 'base64');
      let [username, password] = base64Buff.toString().split(':');
      auth = {username, password};
      authenticate(auth, next);
    }
    else if(authHeader.match(/bearer/i)) {
      auth.token = authHeader.replace(/Bearer\s+/, '');
      authenticate(auth, next);
    }
    else {
      next();
    }
  } catch(e) {
    next(e);
  }
};