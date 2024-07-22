const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    min: 6,
    max: 255,
  },
  email: {
    type: String,
    required: true,
    max: 255,
    min: 6,
  },
  password: {
    type: String,
    required: true,
    max: 1024,
    min: 6,
  },
  phone: {
    type: String,
    required: true,
    max: 15,
    min: 10,
  },
  userType: {
    type: String,
    enum: ["Superuser", "Admin", "User"],
    default: "user",
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  profileImage: String,
  userDescription: {
    type: String,
    default: null,
  },
  postedAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User;
