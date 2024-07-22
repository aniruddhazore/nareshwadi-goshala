// models/Vaccine.js
const mongoose = require("mongoose");

const vaccineSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

module.exports = mongoose.model("Vaccine", vaccineSchema);