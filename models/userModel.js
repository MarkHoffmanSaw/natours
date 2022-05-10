const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please enter your name'] },
  email: {
    type: String,
    required: [true, 'Please enter your email'],
    unique: true,
    lowercase: true, // converts to lowercase
    validate: [validator.isEmail, 'Please enter a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please enter the password'],
    minlength: 8,
    select: false, // doesn't show in .find() & GET
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on .save()
      validator(value) {
        return this.password === value;
      },
      message: 'The password must be the same',
    },
  },
  passwordChangedAt: { type: Date },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// -- Middlewares:

// Encrtypt the pass
userSchema.pre('save', async function (next) {
  // Only run this fn when the pass was update (PATCH). New pass = new bcrypt
  if (!this.isModified('password')) return next();

  // Hash the pass with the cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// passwordChangedAt: ....
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next(); // is.New - document

  this.passwordChangedAt = Date.now() - 1000; // 1 sec, because .save() slower than issue JWT (iat > changedPassAt)
  next();
});

// Only active accounts
userSchema.pre(/^find/, function (next) {
  // show up only acrive accounts before .find
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword, // not encrypted
  currentPassword // encrypted
) {
  return await bcrypt.compare(candidatePassword, currentPassword); // true/false
};

// -- Methods (prototype):

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // 1. Changed:
  if (this.passwordChangedAt) {
    // Convert passwordChangedAt to a number and sec
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp; // true = changed, false = not changed
  }

  // 2. Did't change:
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // Original token (to the email)
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Encrypted token (to the DB)
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 1000 * 60 * 10; // + 10 min

  return resetToken;
};

// New model:

const User = new mongoose.model('User', userSchema);

module.exports = User;
