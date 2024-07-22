const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  cattle: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cattle",
    },
  ],
});

const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
