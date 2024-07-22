const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const moment = require("moment");
const Group = require("./models/group");
const Cattle = require("./models/cattle");
const Milk = require("./models/milk"); // Ensure you have this model in your models directory

const app = express();
app.use(cors());
app.use(bodyParser.json());

const mongoURI =
  "mongodb+srv://priti:pritiprasad@cluster0.c2kmrlk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Endpoint to add new cattle
app.post("/addCattle", async (req, res) => {
  try {
    const {
      name,
      type,
      breed,
      dob,
      health_status,
      housingType,
      milkingCapacity,
      cattleid,
      identificationMark,
      weight,
      motherName,
      fatherName,
      vaccinated,
      vaccinationDetails,
      vaccinationDate,
      dewormed,
      dewormingDetails,
      dewormingDate,
      group,
    } = req.body;

    const parsedDob = moment(dob, "YYYY-MM-DD").isValid()
      ? moment(dob, "YYYY-MM-DD").toDate()
      : null;
    if (!parsedDob) {
      return res.status(400).send({ message: "Invalid date format for dob" });
    }

    const newCattle = new Cattle({
      name,
      type,
      breed,
      dob: parsedDob,
      health_status,
      housingType,
      milkingCapacity,
      cattleid,
      identificationMark,
      weight,
      motherName,
      fatherName,
      vaccinated,
      vaccinationDetails,
      vaccinationDate: vaccinated
        ? moment(vaccinationDate, "YYYY-MM-DD").toDate()
        : null,
      dewormed,
      dewormingDetails,
      dewormingDate: dewormed
        ? moment(dewormingDate, "YYYY-MM-DD").toDate()
        : null,
      group,
    });

    await newCattle.save();

    if (group) {
      const groupDoc = await Group.findById(group);
      if (groupDoc) {
        groupDoc.cattle.push(newCattle._id);
        await groupDoc.save();
      }
    }

    res
      .status(201)
      .send({ message: "Cattle added successfully!", cattle: newCattle });
  } catch (error) {
    console.error("Error adding cattle:", error);
    res.status(500).send({ message: "Error adding cattle" });
  }
});

// Endpoint to get all cattle
app.get("/getCattle", async (req, res) => {
  try {
    const cattle = await Cattle.find().populate("group");
    res.status(200).send(cattle);
  } catch (error) {
    console.error("Error fetching cattle data:", error);
    res.status(500).send({ message: "Error fetching cattle data" });
  }
});

// Endpoint to update cattle
app.put("/updateCattle/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.dob) {
      updateData.dob = moment(updateData.dob, "YYYY-MM-DD").toDate();
    }

    if (updateData.vaccinationDate) {
      updateData.vaccinationDate = moment(
        updateData.vaccinationDate,
        "YYYY-MM-DD"
      ).toDate();
    }

    if (updateData.dewormingDate) {
      updateData.dewormingDate = moment(
        updateData.dewormingDate,
        "YYYY-MM-DD"
      ).toDate();
    }

    const updatedCattle = await Cattle.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res
      .status(200)
      .send({ message: "Cattle updated successfully!", cattle: updatedCattle });
  } catch (error) {
    console.error("Error updating cattle:", error);
    res.status(500).send({ message: "Error updating cattle" });
  }
});

// Endpoint to add new group
app.post("/addGroup", async (req, res) => {
  try {
    const { name } = req.body;

    const newGroup = new Group({ name });
    await newGroup.save();

    res
      .status(201)
      .send({ message: "Group added successfully!", group: newGroup });
  } catch (error) {
    console.error("Error adding group:", error);
    res.status(500).send({ message: "Error adding group" });
  }
});

// Endpoint to get cattle by group
app.get("/groups/:groupId/getcattle", async (req, res) => {
  try {
    const { groupId } = req.params;
    const cattle = await Cattle.find({ group: groupId }).populate("group");
    res.status(200).send(cattle);
  } catch (error) {
    console.error("Error fetching cattle data:", error);
    res.status(500).send({ message: "Error fetching cattle data" });
  }
});

// Endpoint to get all groups
app.get("/groups", async (req, res) => {
  try {
    const groups = await Group.find();
    res.status(200).send(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).send({ message: "Error fetching groups" });
  }
});

// Endpoint to save milk data
app.post("/milk", async (req, res) => {
  try {
    const { date, data } = req.body;

    let milkData = await Milk.findOne({
      date: moment(date, "YYYY-MM-DD").toDate(),
    });

    if (milkData) {
      // Update the existing milk data with new session values
      milkData.data = milkData.data.map((existingItem) => {
        const newItem = data.find(
          (item) => item.cattleName === existingItem.cattleName
        );
        return {
          cattleName: existingItem.cattleName,
          sess1: existingItem.sess1 || newItem.sess1,
          sess2: existingItem.sess2 || newItem.sess2,
        };
      });
      milkData.sess1 = milkData.data
        .map((item) => parseFloat(item.sess1) || 0)
        .reduce((acc, curr) => acc + curr, 0);
      milkData.sess2 = milkData.data
        .map((item) => parseFloat(item.sess2) || 0)
        .reduce((acc, curr) => acc + curr, 0);
      milkData.total = milkData.data
        .map(
          (item) =>
            (parseFloat(item.sess1) || 0) + (parseFloat(item.sess2) || 0)
        )
        .reduce((acc, curr) => acc + curr, 0);

      await milkData.save();
      return res
        .status(200)
        .send({ message: "Milk data updated successfully!", milk: milkData });
    } else {
      // Create new milk data entry
      milkData = new Milk({
        date: moment(date, "YYYY-MM-DD").toDate(),
        data,
        sess1: data
          .map((item) => parseFloat(item.sess1) || 0)
          .reduce((acc, curr) => acc + curr, 0),
        sess2: data
          .map((item) => parseFloat(item.sess2) || 0)
          .reduce((acc, curr) => acc + curr, 0),
        total: data
          .map(
            (item) =>
              (parseFloat(item.sess1) || 0) + (parseFloat(item.sess2) || 0)
          )
          .reduce((acc, curr) => acc + curr, 0),
      });

      await milkData.save();
      return res
        .status(201)
        .send({ message: "Milk data saved successfully!", milk: milkData });
    }
  } catch (error) {
    console.error("Error saving milk data:", error);
    res.status(500).send({ message: "Error saving milk data" });
  }
});

// Endpoint to get milk data by date
app.get("/milk/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const milkData = await Milk.findOne({
      date: moment(date, "YYYY-MM-DD").toDate(),
    });
    res.status(200).send(milkData);
  } catch (error) {
    console.error("Error fetching milk data:", error);
    res.status(500).send({ message: "Error fetching milk data" });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
