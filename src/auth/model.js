'use strict';

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  username: {type: String, required: true, unique: true},
  password: {type: String, required: true},
});

// Before we save, hash the plain text password
// userSchema.pre('save', function(next) {
//   this.password = bcrypt.hashSync(this.password, 10);
//   next();
// });

userSchema.pre('save', function(next) {
  bcrypt.hash(this.password, 10)
    .then(hashedPassword => {
      this.password = hashedPassword;
      next();
    })
    .catch(error => {throw error;});
});

// If we got a user/password, compare them to the hashed password
// If we got a token, validate it and then pull the user id
// In both cases, return the user instance or an error
// statics work on the user model 
userSchema.statics.authenticate = function(auth) {
  let query = {username: auth.username};
  if(auth.token) {
    let token = jwt.verify(auth.token, process.env.SECRET || 'changethis');
    query = {_id: token.id};
  }
  return this.findOne(query)
    .then(user => user.comparePassword(auth.password))
    .catch(error => error);
};

// Compare a plain text password against the hashed one we have saved
userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password)
    .then(valid => valid ? this : null);
};

// Generate a JWT from the user id and a secret
// methods are basically like prototypes (methods - class)
userSchema.methods.generateToken = function() {
  return jwt.sign({id: this._id}, process.env.SECRET || 'changethis');
};

export default mongoose.model('users', userSchema);