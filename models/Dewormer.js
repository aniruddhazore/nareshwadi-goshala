const mongoose = require("mongoose");

const dewormerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

module.exports = mongoose.model("Dewormer", dewormerSchema);
