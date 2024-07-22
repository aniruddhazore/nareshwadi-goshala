const mongoose = require("mongoose");

const milkSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  data: [
    {
      cattleName: {
        type: String,
        required: true,
      },
      sess1: {
        type: Number,
        required: false,
      },
      sess2: {
        type: Number,
        required: false,
      },
    },
  ],

  total: {
    type: Number,
    default : 0,
  },

});

milkSchema.index({ date: 1 }, { unique: true });

const Milk = mongoose.model("Milk", milkSchema);

module.exports = Milk;