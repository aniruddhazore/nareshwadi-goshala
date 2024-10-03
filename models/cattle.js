const mongoose = require("mongoose");

const cattleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  breed: {
    type: String,
    required: false,
  },
  dob: {
    type: Date,
    required: true,
    validate: {
      validator: function (dob) {
        return !isNaN(dob.getTime()) && dob < Date.now();
      },
      message: (props) => `${props.value} is not a valid date of birth`,
    },
  },
  health_status: {
    type: String,
    required: true,
  },
  housingType: {
    type: String,
    required: true,
  },
  herd_lifecycle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lifecycle",
    required: true,
  },
  cattleid: {
    type: String,
    required: true,
  },
  milkCapacity: {
    type: Number,
    default: 0,
  },
  weight: {
    type: Number,
  },
  identificationMark: {
    type: String,
  },
  motherName: {
    type: String,
    required: false,
  },
  fatherName: {
    type: String,
    required: false,
  },
  vaccinated: {
    type: Boolean,
    default: false,
  },
  vaccinationDetails: {
    type: String,
    required: function () {
      return this.vaccinated;
    },
  },
  vaccinationDate: {
    type: Date,
    required: function () {
      return this.vaccinated;
    },
  },
  vaccinations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vaccination",
    },
  ],
  dewormed: {
    type: Boolean,
    default: false,
  },
  dewormingDetails: {
    type: String,
    required: function () {
      return this.dewormed;
    },
  },
  dewormingDate: {
    type: Date,
    required: function () {
      return this.dewormed;
    },
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: false,
  },
  serialNumber: {
    type : Number,
    required : true ,
    unique: true ,
  }
});

const Cattle = mongoose.model("Cattle", cattleSchema);

module.exports = Cattle;
