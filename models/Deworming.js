const mongoose = require("mongoose");

const dewormingSchema = new mongoose.Schema({
  dewormer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dewormer",
    required: true,
  },
  cattle: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cattle",
    required: true,
  }],
  date: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Deworming", dewormingSchema);
