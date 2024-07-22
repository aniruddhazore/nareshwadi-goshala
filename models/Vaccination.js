const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const vaccinationSchema = new Schema({
  cattle: { type: Schema.Types.ObjectId, ref: "Cattle", required: true },
  vaccine: { type: Schema.Types.ObjectId, ref: "Vaccine", required: true },
  date: { type: Date, required: true },
});

module.exports = mongoose.model("Vaccination", vaccinationSchema);