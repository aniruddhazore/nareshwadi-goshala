const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const moment = require("moment");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose
  .connect("mongodb+srv://dbUser:abcd1234@cluster0.zqc82gq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB", err);
  });

const User = require("./models/user");
const Group = require("./models/group");
const Cattle = require("./models/cattle");
const Milk = require("./models/milk");
const Vaccine = require("./models/Vaccine");
const Vaccination = require("./models/Vaccination");
const Dewormer = require("./models/Dewormer");
const Deworming = require("./models/Deworming");
const Lifecycle = require("./models/lifecycle");

app.listen(port, () => {
  console.log("Server is running on port 3000");
});

// Helper functions
const sendVerificationEmail = async (email, verificationToken) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "rheacode@gmail.com",
      pass: "bwchfojovfakrqtv",
    },
  });

  const mailOptions = {
    from: "dairytrack@gmail.com",
    to: email,
    subject: "Email verification",
    text: `Please click on the link to verify your email: http://192.168.36.114:3000/verify/${verificationToken}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.log("Error sending email", error);
  }
};

const generateSecretKey = () => {
  return crypto.randomBytes(32).toString("hex");
};

const secretKey = generateSecretKey();

// User Endpoints
const validatePassword = (password) => {
  return /^(?=.*[a-zA-Z])(?=.*[0-9])[A-Za-z0-9]{8,}$/.test(password);
};

app.post("/register", async (req, res) => {
  const { name, email, password, phone, userType, profileImage } = req.body;

  if (!validatePassword(password)) {
    return res
      .status(400)
      .json({
        message:
          "Password must be alphanumeric and at least 8 characters long.",
      });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const newUser = new User({
      name,
      email,
      password,
      phone,
      userType,
      profileImage,
      verified: false,
    });

    await newUser.save();

    // Assume sendVerificationEmail is a function that sends the verification email
    sendVerificationEmail(newUser);

    res
      .status(201)
      .json({
        message:
          "User registered successfully. Please verify your account via email.",
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
});

app.get("/verify/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(404).json({ message: "Invalid verification token" });
    }

    user.verified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Email verification failed" });
  }
});

app.post("/test", async (req, res) => {
  return res.status(200).json({ message: "Recieved Request" });
})

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.verified) {
      return res
        .status(403)
        .json({ message: "Please verify your account from the mail." });
    }

    const token = jwt.sign(
      { userId: user._id, userType: user.userType },
      secretKey
    );
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});

app.get("/userRole", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ userType: user.userType });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user role", error });
  }
});

app.get("/users", async (req, res) => {
  try {
    const { name } = req.query;
    let users = name
      ? await User.find({ name: { $regex: name, $options: "i" } })
      : await User.find();
    res.json(users);
  } catch (error) {
    console.log("Error retrieving users:", error);
    res.status(500).send(error);
  }
});

app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      id,
      { name, email, phone },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.log("Error updating user:", err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to add new cattle
app.post("/addCattle", async (req, res) => {
  try {
    const {
      name,
      type,
      breed,
      dob,
      herd_lifecycle,
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

    const lifecycleDoc = await Lifecycle.findOne({
      lifecycleType: herd_lifecycle,
    });
    if (!lifecycleDoc) {
      return res.status(400).send({ message: "Invalid herd lifecycle" });
    }

    const newCattle = new Cattle({
      name,
      type,
      breed,
      herd_lifecycle: lifecycleDoc._id,
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

    lifecycleDoc.cattle.push(newCattle._id);
    await lifecycleDoc.save();

    if (group) {
      const groupDoc = await Group.findById(group);
      if (groupDoc) {
        groupDoc.cattle.push(newCattle._id);
        await groupDoc.save();
      }
    }

    const lifecycle = await Lifecycle.findOneAndUpdate(
      { lifecycleType: herd_lifecycle },
      { $addToSet: { cattleIds: newCattle._id } }, // Add the new cattle ID to the corresponding lifecycle type
      { upsert: true, new: true }
    );

    res
      .status(201)
      .send({ message: "Cattle added successfully!", cattle: newCattle });
  } catch (error) {
    console.error("Error adding cattle:", error);
    res.status(500).send({ message: "Error adding cattle" });
  }
});

app.get("/getCattle", async (req, res) => {
  try {
    const cattle = await Cattle.find().populate("group");
    res.status(200).send(cattle);
  } catch (error) {
    console.error("Error fetching cattle data:", error);
    res.status(500).send({ message: "Error fetching cattle data" });
  }
});

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

// Group Endpoints
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

// Endpoint to get cattle by group with filters
app.get("/groups/:groupId/getcattle", async (req, res) => {
  const { groupId } = req.params;
  const { type, breed, housingType } = req.query;

  let query = { group: groupId };

  if (type) query.type = type;
  if (breed) query.breed = breed;
  if (housingType) query.housingType = housingType;

  try {
    const cattle = await Cattle.find(query).populate("group");
    res.json(cattle);
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

app.get("/groups", async (req, res) => {
  try {
    const groups = await Group.find();
    res.status(200).send(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).send({ message: "Error fetching groups" });
  }
});

// Get current group of a cattle
app.get("/cattle/:id", async (req, res) => {
  try {
    const cattle = await Cattle.findById(req.params.id).populate("group");
    if (!cattle) {
      return res.status(404).send({ message: "Cattle not found" });
    }
    res.status(200).send(cattle);
  } catch (error) {
    console.error("Error fetching cattle:", error);
    res.status(500).send({ message: "Error fetching cattle" });
  }
});

// Update the group of multiple cattle
app.put("/cattle/group", async (req, res) => {
  try {
    const { cattleIds, groupId } = req.body;

    const updateResult = await Cattle.updateMany(
      { _id: { $in: cattleIds } },
      { $set: { group: groupId } }
    );

    if (updateResult.nModified === 0) {
      return res.status(404).send({ message: "No cattle were updated" });
    }

    res.status(200).send({ message: "Group updated successfully!", updateResult });
  } catch (error) {
    console.error("Error updating cattle group:", error);
    res.status(500).send({ message: "Error updating cattle group" });
  }
});


// Endpoint to save milk data
app.post("/milk", async (req, res) => {
  try {
    const { date, data } = req.body;

    const totalMilk = data.reduce((acc, item) => {
      const sess1 = parseFloat(item.sess1) || 0;
      const sess2 = parseFloat(item.sess2) || 0;
      const CattleTotal = sess1 + sess2;
      return acc + CattleTotal;
    }, 0);

    // Check if milk data already exists for the date
    let milkData = await Milk.findOne({
      date: moment(date, "YYYY-MM-DD").toDate(),
    });

    if (milkData) {
      // Update existing milk data with new session values and total
      milkData.data = data.map((newItem) => {
        const existingItem = milkData.data.find(
          (item) => item.cattleName === newItem.cattleName
        );
        return {
          cattleName: newItem.cattleName,
          sess1: existingItem
            ? existingItem.sess1 || newItem.sess1
            : newItem.sess1,
          sess2: existingItem
            ? existingItem.sess2 || newItem.sess2
            : newItem.sess2,
        };
      });

      milkData.total = totalMilk;

      await milkData.save();
      return res
        .status(200)
        .send({ message: "Milk data updated successfully!", milk: milkData });
    } else {
      // Create new milk data entry
      milkData = new Milk({
        date: moment(date, "YYYY-MM-DD").toDate(),
        data,
        total: totalMilk,
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

// PUT route to update milk entry by ID
app.put("/milk/:id", async (req, res) => {
  const { id } = req.params;
  const { date, data } = req.body;

  try {
    // Validate date and data if necessary

    // Update the milk entry
    const updatedMilkEntry = await Milk.findByIdAndUpdate(
      id,
      { date, data },
      { new: true } // Ensure to return the updated document
    );

    // Check if the milk entry was found and updated
    if (!updatedMilkEntry) {
      return res.status(404).json({ error: "Milk entry not found" });
    }

    // Respond with the updated milk entry
    res.json(updatedMilkEntry);
  } catch (error) {
    console.error("Error updating milk entry:", error);
    res.status(500).json({ error: "Failed to update milk entry" });
  }
});

// Put route to update milk entry by date
app.put("/milk/date/:date", async (req, res) => {
  const { date } = req.params;
  const { data } = req.body;

  try {
    const existingMilkData = await Milk.findOne({
      date: moment(date, "YYYY-MM-DD").toDate(),
    });

    if (!existingMilkData) {
      return res.status(404).json({ error: "Milk entry not found" });
    }

    existingMilkData.data = data;
    existingMilkData.sess1 = data
      .map((item) => parseFloat(item.sess1) || 0)
      .reduce((acc, curr) => acc + curr, 0);
    existingMilkData.sess2 = data
      .map((item) => parseFloat(item.sess2) || 0)
      .reduce((acc, curr) => acc + curr, 0);
    existingMilkData.total = data
      .map(
        (item) => (parseFloat(item.sess1) || 0) + (parseFloat(item.sess2) || 0)
      )
      .reduce((acc, curr) => acc + curr, 0);

    await existingMilkData.save();
    res.json(existingMilkData);
  } catch (error) {
    console.error("Error updating milk entry:", error);
    res.status(500).json({ error: "Failed to update milk entry" });
  }
});

// Endpoint to add a new vaccine
app.post("/vaccines", async (req, res) => {
  try {
    const { name } = req.body;
    const newVaccine = new Vaccine({ name });
    await newVaccine.save();
    res
      .status(201)
      .send({ message: "Vaccine added successfully!", vaccine: newVaccine });
  } catch (error) {
    console.error("Error adding vaccine:", error);
    res.status(500).send({ message: "Error adding vaccine" });
  }
});

// Endpoint to get all vaccines
// Server-side: Modify /vaccines endpoint

app.get("/vaccines", async (req, res) => {
  try {
    const vaccines = await Vaccine.find();
    const populatedVaccines = await Promise.all(
      vaccines.map(async (vaccine) => {
        const vaccinations = await Vaccination.find({
          vaccine: vaccine._id,
        }).populate("cattle", "name");
        const cattleNames = vaccinations.map((v) => v.cattle.name);
        return {
          _id: vaccine._id,
          name: vaccine.name,
          cattle: cattleNames,
        };
      })
    );
    res.status(200).json(populatedVaccines);
  } catch (error) {
    res.status(500).json({ message: "Error fetching vaccines", error });
  }
});

app.get("/vaccines/:vaccineId/cattle", async (req, res) => {
  const { vaccineId } = req.params;

  try {
    const cattle = await Cattle.find({ vaccines: vaccineId }).exec();
    res.json(cattle);
  } catch (error) {
    console.error(`Error fetching cattle for vaccine ID ${vaccineId}:`, error);
    res.status(500).json({ error: "Failed to fetch cattle details" });
  }
});

// Endpoint to update cattle vaccination status
// Endpoint to update cattle vaccination status
app.post("/vaccinations", async (req, res) => {
  try {
    const { cattleIds, vaccineId, date } = req.body;

    if (!cattleIds || !vaccineId) {
      return res
        .status(400)
        .json({ message: "Vaccine and cattle IDs are required" });
    }

    const vaccinations = cattleIds.map((cattleId) => ({
      cattle: cattleId,
      vaccine: vaccineId,
      date: date ? new Date(date) : new Date(),
    }));

    const result = await Vaccination.insertMany(vaccinations);
    res.status(201).send({
      message: "Vaccinations added successfully!",
      vaccinations: result,
    });
  } catch (error) {
    console.error("Error adding vaccinations:", error);
    res.status(500).send({ message: "Error adding vaccinations" });
  }
});

app.get("/vaccinations", async (req, res) => {
  try {
    const vaccinations = await Vaccination.find()
      .populate("cattle")
      .populate("vaccine");
    res.status(200).json(vaccinations);
  } catch (error) {
    console.error("Error fetching vaccinations:", error);
    res.status(500).json({ message: "Error fetching vaccinations", error });
  }
});

// Endpoint to get all vaccinations for a cattle
app.get("/vaccinations/:cattleId", async (req, res) => {
  try {
    const { cattleId } = req.params;
    const vaccinations = await Vaccination.find({ cattle: cattleId }).populate(
      "vaccine"
    );
    res.status(200).send(vaccinations);
  } catch (error) {
    console.error("Error fetching vaccinations:", error);
    res.status(500).send({ message: "Error fetching vaccinations" });
  }
});

// Endpoint to get all cattle vaccinations
app.get("/cattle-vaccinations", async (req, res) => {
  try {
    const cattleVaccinations = await Cattle.find().populate({
      path: "vaccinations",
      populate: {
        path: "vaccine",
      },
    });

    if (!cattleVaccinations || cattleVaccinations.length === 0) {
      return res.status(404).send({ message: "No cattle vaccinations found" });
    }

    res.status(200).send(cattleVaccinations);
  } catch (error) {
    console.error("Error fetching cattle vaccinations:", error);
    res.status(500).send({ message: "Error fetching cattle vaccinations" });
  }
});

// Endpoint to get cattle counts by herd lifecycle
// Endpoint to fetch lifecycle counts
app.get("/getLifecycleCounts", async (req, res) => {
  try {
    const lifecycleCounts = await Lifecycle.aggregate([
      {
        $lookup: {
          from: "cattles",
          localField: "_id",
          foreignField: "herd_lifecycle",
          as: "cattleDetails",
        },
      },
      {
        $project: {
          lifecycleType: "$lifecycleType",
          count: { $size: "$cattleDetails" },
        },
      },
    ]);

    res.json(lifecycleCounts);
  } catch (error) {
    console.error("Error fetching lifecycle counts:", error);
    res.status(500).json({ error: "Failed to fetch lifecycle counts" });
  }
});

// Endpoint to get total milk yeild by date
app.get("/getMilkYieldData", async (req, res) => {
  try {
    const startDate = moment().subtract(7, "days").startOf("day");
    const endDate = moment().endOf("day");

    const milkData = await Milk.find({
      date: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      },
    }).sort({ date: 1 });

    if (!milkData || milkData.length === 0) {
      return res.status(404).json({ message: "No milk data found" });
    }

    const formattedData = milkData.map((item) => ({
      date: moment(item.date).format("DD/MM"),
      totalYield: item.total,
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching milk yield data:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch milk yield data",
        error: error.message,
      });
  }
});

// Dewormer Endpoints
app.post("/dewormers", async (req, res) => {
  try {
    const { name, manufacturer, batchNumber, expiryDate } = req.body;

    const dewormer = new Dewormer({
      name,
      manufacturer,
      batchNumber,
      expiryDate: moment(expiryDate, "YYYY-MM-DD").toDate(),
    });

    await dewormer.save();

    res
      .status(201)
      .json({ message: "Dewormer created successfully", dewormer });
  } catch (error) {
    console.error("Error creating dewormer:", error);
    res.status(500).json({ message: "Error creating dewormer", error });
  }
});

app.get("/dewormers", async (req, res) => {
  try {
    const dewormers = await Dewormer.find();
    res.status(200).json(dewormers);
  } catch (error) {
    console.error("Error fetching dewormers:", error);
    res.status(500).json({ message: "Error fetching dewormers", error });
  }
});

app.post("/dewormings", async (req, res) => {
  try {
    const { dewormerId, cattleIds, date } = req.body;

    console.log("Received data:", req.body);

    if (
      !dewormerId ||
      !Array.isArray(cattleIds) ||
      cattleIds.length === 0 ||
      !date
    ) {
      console.error("Validation Error: Missing required fields");
      return res.status(400).json({ message: "Missing required fields" });
    }

    const deworming = new Deworming({
      dewormer: dewormerId,
      cattle: cattleIds,
      date: moment(date, "YYYY-MM-DD").toDate(),
    });

    await deworming.save();

    res
      .status(201)
      .json({ message: "Deworming recorded successfully", deworming });
  } catch (error) {
    console.error("Error recording deworming:", error);
    res.status(500).json({ message: "Error recording deworming", error });
  }
});

app.get("/dewormings", async (req, res) => {
  try {
    const dewormings = await Deworming.find()
      .populate("cattle")
      .populate("dewormer");
    res.status(200).json(dewormings);
  } catch (error) {
    console.error("Error fetching dewormings:", error);
    res.status(500).json({ message: "Error fetching dewormings", error });
  }
});

// const nodemailer = require('nodemailer');

// Configure the email transporter
const transporter1 = nodemailer.createTransport({
  service: "gmail", // e.g., 'gmail'
  auth: {
    user: "rheacode@gmail.com",
    pass: "bwchfojovfakrqtv",
  },
});

// milk yield email
// Function to send email
const sendEmail = async (totalYield) => {
  try {
    // Fetch users who are Admin or Superuser
    const users = await User.find({
      userType: { $in: ["Admin", "Superuser"] },
    });

    const emailPromises = users.map((user) => {
      const mailOptions = {
        from: "rheacode@gmail.com",
        to: user.email,
        subject: "Weekly Milk Yield Report",
        text: `The total milk yield this week was: ${totalYield} liters.`,
      };

      return transporter1.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);
    console.log("Emails sent successfully");
  } catch (error) {
    console.error("Error sending emails:", error);
  }
};

// Function to calculate total yield
const calculateTotalYield = async () => {
  try {
    const startDate = moment().subtract(7, "days").startOf("day");
    const endDate = moment().endOf("day");

    const milkData = await Milk.find({
      date: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      },
    }).sort({ date: 1 });

    if (!milkData || milkData.length === 0) {
      console.log("No milk data found");
      return;
    }

    const totalYield = milkData.reduce((acc, item) => acc + item.total, 0);

    await sendEmail(totalYield);
  } catch (error) {
    console.error("Error calculating total yield:", error);
  }
};

const schedule = require("node-schedule");

// Schedule the task to run every Monday at 2:35 AM
schedule.scheduleJob("50 11 * * 1", () => {
  console.log("Running scheduled task for weekly milk yield report");
  calculateTotalYield();
});
