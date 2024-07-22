const mongoose = require("mongoose");

const lifecycleSchema = new mongoose.Schema({
  lifecycleType: {
    type: String,
    required: true,
    unique: true,
  },
  cattle: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cattle",
    },
  ],
});

const Lifecycle = mongoose.model("Lifecycle", lifecycleSchema);

module.exports = Lifecycle;