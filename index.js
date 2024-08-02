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
  .connect("mongodb+srv://dbUser:abcd1234@cluster0.zqc82gq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
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

// Function to generate a secret key
const generateSecretKey = () => {
  return crypto.randomBytes(32).toString("hex");
};

const secretKey = generateSecretKey();

// Helper functions
const validatePassword = (password) => {
  return /^(?=.*[a-zA-Z])(?=.*[0-9])[A-Za-z0-9]{8,}$/.test(password);
};

const sendVerificationEmail = async (recipientDetails) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "rheacode@gmail.com",
      pass: "bwchfojovfakrqtv",
    },
  });

  const { name, email, password, verificationToken, userType, superusers } =
    recipientDetails;

  // Email content for the new user
  const newUserMailOptions = {
    from: "dairytrack@gmail.com",
    to: email,
    subject: "Welcome to Nareshwadi Dairy App",
    html: `
<div
      style="
        font-family: Arial, sans-serif;
        margin: 20px;
        padding: 20px;
        border-radius: 8px;
        background-color: #f8f9fa;
        color: #333;
        max-width: 600px;
        margin: auto;
      "
    >
      <div
        style="
          background-color: #b592ff;
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        "
      >
        <img
          src="../assets/logo-new-dairy.png"
          alt="Logo"
          style="
            max-width: 150px;
            height: auto;
            margin-bottom: 15px;
          "
        />
        <h1 style="margin: 0; font-size: 24px; font-weight: 700">
          Welcome to Nareshwadi Dairy App
        </h1>
      </div>
      <div style="margin-top: 20px; padding: 20px">
        <p>Hello ${name},</p>
        <p>
          You have been added as a ${userType} to Nareshwadi Dairy App. You can
          login to the app using the given email id and password.
        </p>
        <div
          style="
            border: 1px solid #4a90e2;
            border-radius: 8px;
            padding: 15px;
            background-color: #4a90e2;
            color: #fff;
            margin-bottom: 20px;
          "
        >
          <p style="margin: 0; font-weight: bold">Email:</p>
          <p style="margin: 0">${email}</p>
          <br />
          <p style="margin: 0; font-weight: bold">Password:</p>
          <p style="margin: 0">${password}</p>
        </div>
        <p>
          Before logging in, make sure to verify your email by clicking on the
          following link:
        </p>
        <a
          href="http://localhost:3000/verify/${verificationToken}"
          style="color: #4a90e2; text-decoration: none; font-weight: bold"
          >Verify Email</a
        >
        <p style="background-color: rgb(126, 214, 153); color: white; padding:10px;border-radius:5px">
          Note: You can change the password to whatever you wish once you log in.
        </p>
      </div>
    </div>
`,
  };

  try {
    // Send email to the new user
    await transporter.sendMail(newUserMailOptions);
    console.log("New user email sent successfully");
  } catch (error) {
    console.log("Error sending new user email", error);
  }

  // Email content for Superusers
  const superuserMailOptions = {
    from: "dairytrack@gmail.com",
    to: superusers.map((user) => user.email),
    subject: "New User Added",
    html: `
<div
      style="
        font-family: Arial, sans-serif;
        margin: 20px;
        padding: 20px;
        border-radius: 8px;
        background-color: #f8f9fa;
        color: #333;
        max-width: 600px;
        margin: auto;
      "
    >
      <div
        style="
          background-color: #b592ff;
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        "
      >
        <img
        
          src="../assets/logo-new-dairy.png"
          alt="Logo"
          style="
            max-width: 150px;
            height: auto;
            margin-bottom: 15px;
          "
        />
        <h1 style="margin: 0; font-size: 24px; font-weight: 700">
          Notification from Nareshwadi Dairy App
        </h1>
      </div>
      <div style="margin-top: 20px; padding: 20px">
        <p>Hello Superuser,</p>
        <p
          style="
            margin: 0;
            padding: 10px;
            background-color: #e9ecef;
            border-left: 4px solid #b592ff;
            border-radius: 4px;
          "
        >
          A new user has been added to the Nareshwadi Dairy App.
        </p>
        <div
          style="
            margin-top: 20px;
            padding: 15px;
            border: 1px solid #4a90e2;
            border-radius: 8px;
            background-color: #ffffff;
            color: #333;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          "
        >
          <p style="margin: 0; font-weight: bold">Name:</p>
          <p style="margin: 0">${name}</p>
          <br />
          <p style="margin: 0; font-weight: bold">Email:</p>
          <p style="margin: 0">${email}</p>
          <br />
          <p style="margin: 0; font-weight: bold">User Type:</p>
          <p style="margin: 0">${userType}</p>
        </div>
        <p style="margin-top: 20px">
          The user will need to verify their email address before logging in.
          You can view and manage users from your admin panel.
        </p>
        <p>Thank you,</p>
        <p>Nareshwadi Dairy App</p>
      </div>
    </div>
`,
  };

  try {
    // Send email to all Superusers
    await transporter.sendMail(superuserMailOptions);
    console.log("Superuser notification email sent successfully");
  } catch (error) {
    console.log("Error sending Superuser notification email", error);
  }
};

app.post("/register", async (req, res) => {
  const { name, email, password, phone, userType, profileImage } = req.body;

  // Validate required fields
  if (!name || !email || !password || !phone || !userType) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // Validate password
  if (!validatePassword(password)) {
    return res.status(400).json({
      message: "Password must be alphanumeric and at least 8 characters long.",
    });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use." });
    }

    // Generate a verification token
    const verificationToken = generateSecretKey();

    // Create a new user with the token
    const newUser = new User({
      name,
      email,
      password,
      phone,
      userType,
      profileImage,
      verified: false,
      verificationToken, // Set the verification token
    });

    await newUser.save();

    // Fetch all Superusers
    const superusers = await User.find({ userType: "Superuser" });

    // Send verification email to the new user and notify Superusers
    await sendVerificationEmail({
      name,
      email,
      password,
      verificationToken,
      userType,
      superusers,
    });

    res.status(201).json({
      _id: newUser._id,
      message:
        "User registered successfully. Please verify your account via email.",
    });
  } catch (error) {
    console.error("Error in register endpoint:", error.message);
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
    // user.verificationToken = undefined; // Clear the token after successful verification
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Error in verification endpoint:", error.message);
    res
      .status(500)
      .json({ message: "Email verification failed", error: error.message });
  }
});

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

app.put("/users/:id/password", async (req, res) => {
  const { id } = req.params;
  const { password } = req.body; // Only expect password in the body

  try {
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Find the user by ID and update the password
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's password (ensure to hash it before saving if necessary)
    user.password = password; // Hash password before saving in a real application
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.log("Error updating password:", err);
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
      milkCapacity,
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
      milkCapacity,
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

// Endpoint to get all cattle IDs
app.get('/getcattleID', async (req, res) => {
  try {
    const cattle = await Cattle.find({}, { cattleid: 1, _id: 0 }); // Fetch only the cattleid field
    const cattleIds = cattle.map(c => c.cattleid);
    res.status(200).json(cattleIds);
  } catch (error) {
    console.error('Error fetching cattle IDs:', error);
    res.status(500).send({ message: 'Error fetching cattle IDs' });
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

// Endpoint to delete cattle
app.delete("/deleteCattle/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const cattle = await Cattle.findByIdAndDelete(id);

    if (!cattle) {
      return res.status(404).send({ message: "Cattle not found" });
    }

    res.status(200).send({ message: "Cattle deleted successfully!" });
  } catch (error) {
    console.error("Error deleting cattle:", error);
    res.status(500).send({ message: "Error deleting cattle" });
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

    res
      .status(200)
      .send({ message: "Group updated successfully!", updateResult });
  } catch (error) {
    console.error("Error updating cattle group:", error);
    res.status(500).send({ message: "Error updating cattle group" });
  }
});

// Endpoint to save milk data
app.post("/milk", async (req, res) => {
  try {
    const { date, data } = req.body;

    // Check if milk data already exists for the date
    let milkData = await Milk.findOne({
      date: moment(date, "YYYY-MM-DD").toDate(),
    });

    if (milkData) {
      // Update existing milk data with new session values
      milkData.data = milkData.data.map((existingItem) => {
        const newItem = data.find(
          (item) => item.cattleName === existingItem.cattleName
        );
        return {
          cattleName: existingItem.cattleName,
          sess1: newItem && newItem.sess1 ? newItem.sess1 : existingItem.sess1,
          sess2: newItem && newItem.sess2 ? newItem.sess2 : existingItem.sess2,
          milkman1:
            newItem && newItem.milkman1
              ? newItem.milkman1
              : existingItem.milkman1,
          milkman2:
            newItem && newItem.milkman2
              ? newItem.milkman2
              : existingItem.milkman2,
        };
      });

      // Add any new entries from the data array that are not in milkData
      data.forEach((newItem) => {
        if (
          !milkData.data.some((item) => item.cattleName === newItem.cattleName)
        ) {
          milkData.data.push(newItem);
        }
      });

      // Calculate total milk yield for the day
      milkData.total = milkData.data.reduce((acc, item) => {
        const sess1 = parseFloat(item.sess1) || 0;
        const sess2 = parseFloat(item.sess2) || 0;
        return acc + sess1 + sess2;
      }, 0);

      await milkData.save();
      return res
        .status(200)
        .send({ message: "Milk data updated successfully!", milk: milkData });
    } else {
      // Create new milk data entry
      const totalMilk = data.reduce((acc, item) => {
        const sess1 = parseFloat(item.sess1) || 0;
        const sess2 = parseFloat(item.sess2) || 0;
        return acc + sess1 + sess2;
      }, 0);

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
    console.error("Error saving milk data :", error);
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
app.get("/vaccines", async (req, res) => {
  try {
    const vaccines = await Vaccine.find();
    res.status(200).json(vaccines);
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
      .populate("vaccine")
      .exec();
    console.log("Populated vaccinations:", vaccinations); // Log the populated vaccinations

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

// Endpoint to get all cattle and their vaccinations for the current month
app.get("/cattle-vaccinations/current-month", async (req, res) => {
  try {
    const startOfMonth = moment().startOf("month").toDate();
    const endOfMonth = moment().endOf("month").toDate();

    const cattleVaccinations = await Cattle.find().populate({
      path: "vaccinations",
      match: { date: { $gte: startOfMonth, $lte: endOfMonth } },
      populate: {
        path: "vaccine",
      },
    });

    if (!cattleVaccinations || cattleVaccinations.length === 0) {
      return res.status(404).send({
        message: "No cattle vaccinations found for the current month",
      });
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
    res.status(500).json({
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

// Fetch milk alerts
// Fetch milk alerts
app.get("/milk-alerts", async (req, res) => {
  try {
    const today = new Date();
    const dayBeforeYesterday = new Date();
    dayBeforeYesterday.setDate(today.getDate() - 2);

    const milkEntries = await Milk.find({
      date: { $gte: dayBeforeYesterday, $lte: today },
      "data.sess1": { $exists: true },
      "data.sess2": { $exists: true },
    });

    const alerts = [];

    for (const entry of milkEntries) {
      for (const record of entry.data) {
        const cattle = await Cattle.findOne({ name: record.cattleName });
        if (!cattle) continue;

        const totalMilk = record.sess1 + record.sess2;
        console.log("Total milk:", totalMilk);
        console.log("Cattle milk capacity:", 2 * cattle.milkCapacity);
        if (totalMilk < 2 * cattle.milkCapacity) {
          alerts.push({
            cattleName: record.cattleName,
            milkingCapacity: cattle.milkCapacity,
            session1: record.sess1,
            session2: record.sess2,
            date: entry.date,
          });
        }
      }
    }

    if (alerts.length === 0) {
      return res.json({ message: "No unusual behavior observed" });
    }

    res.json(alerts);
  } catch (error) {
    console.error("Error fetching milk alerts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// const nodemailer = require('nodemailer');

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

    await sendEmailWeekly(totalYield);
  } catch (error) {
    console.error("Error calculating total yield:", error);
  }
};

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
const sendEmailWeekly = async (totalYield) => {
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

const schedule = require("node-schedule");

// Schedule the task to run every Monday at 2:35 AM
schedule.scheduleJob("50 11 * * 1", () => {
  console.log("Running scheduled task for weekly milk yield report");
  calculateTotalYield();
});

const fetchMilkAlerts = async () => {
  try {
    const today = new Date();
    const dayBeforeYesterday = new Date();
    dayBeforeYesterday.setDate(today.getDate() - 2);

    const milkEntries = await Milk.find({
      date: { $gte: dayBeforeYesterday, $lte: today },
      "data.sess1": { $exists: true },
      "data.sess2": { $exists: true },
    });

    const alerts = [];

    for (const entry of milkEntries) {
      for (const record of entry.data) {
        const cattle = await Cattle.findOne({ name: record.cattleName });
        if (!cattle) continue;

        const totalMilk = record.sess1 + record.sess2;
        if (totalMilk < 2 * cattle.milkCapacity) {
          alerts.push({
            cattleName: record.cattleName,
            milkingCapacity: cattle.milkCapacity,
            session1: record.sess1,
            session2: record.sess2,
            date: entry.date.toISOString().split("T")[0], // Ensure date is formatted
          });
        }
      }
    }

    console.log("Fetched alerts:", alerts); // Add this line for debugging
    return alerts;
  } catch (error) {
    console.error("Error fetching milk alerts:", error);
    return [];
  }
};

const sendEmailDaily = async () => {
  try {
    const alerts = await fetchMilkAlerts(); // Fetch alerts here

    if (!Array.isArray(alerts) || alerts.length === 0) {
      console.log("No alerts found or alerts is not an array.");
      return; // Exit function if no alerts or alerts is not an array
    }

    // Fetch users who are Admin or Superuser
    const users = await User.find({
      userType: { $in: ["Admin", "Superuser"] },
    });

    const emailPromises = users.map((user) => {
      // Construct the table content for email
      const emailContent = `
        <h1>Daily Milk Alerts</h1>
        <p>the following cattle have been producing milk below their expected threshold. Please take a moment to review their status:</p>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
  <tr style="background-color: #4c669f; color: white;">
    <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Cattle Name</th>
    <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Capacity / Session</th>
    <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Session 1</th>
    <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Session 2</th>
    <th style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Date</th>
  </tr>
</thead>

          <tbody>
            ${alerts
              .map(
                (alert) => `
              <tr>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${alert.cattleName}</td>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${alert.milkingCapacity}</td>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${alert.session1}</td>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${alert.session2}</td>
                <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${alert.date}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        <p style="margin-top: 20px;">Please find the daily milk alerts above.</p>
      `;

      const mailOptions = {
        from: "rheacode@gmail.com",
        to: user.email,
        subject: "Daily Milk Yield Report",
        html: emailContent,
      };

      return transporter1.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);
    console.log("Daily emails sent successfully");
  } catch (error) {
    console.error("Error sending daily emails:", error);
  }
};

// Schedule the task to run every day at 6:00 PM
schedule.scheduleJob("50 23 * * *", () => {
  console.log(
    "Running scheduled task for daily milk yield report - Only alerts"
  );
  sendEmailDaily();
});

// Endpoint to get total milk yeild by date
// Route to get reports based on date range
app.get("/getReports", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date format
    const start = moment(startDate, "YYYY-MM-DD").toDate();
    const end = moment(endDate, "YYYY-MM-DD").toDate();
    if (!start || !end) {
      return res.status(400).send({ message: "Invalid date format" });
    }

    // Fetch cattle data
    const cattleData = await Cattle.find().populate("group", "name"); // Assuming group has a name field

    // Fetch milk data within the date range
    const milkData = await Milk.find({
      date: { $gte: start, $lte: end },
    });

    // Combine data
    const reportData = [];

    milkData.forEach((milkEntry) => {
      milkEntry.data.forEach((session) => {
        const cattle = cattleData.find((c) => c.name === session.cattleName);
        if (cattle) {
          reportData.push({
            cattleName: cattle.name,
            groupName: cattle.group ? cattle.group.name : "N/A",
            milkingCapacity: cattle.milkCapacity,
            session1: session.sess1 || 0,
            session2: session.sess2 || 0,
            milkman1: session.milkman1 || "N/A",
            milkman2: session.milkman2 || "N/A",  
            total:
              (parseFloat(session.sess1) || 0) +
              (parseFloat(session.sess2) || 0),
            date: milkEntry.date,
          });
        }
      });
    });

    res.status(200).json(reportData);
  } catch (error) {
    console.error("Error fetching report data:", error);
    res.status(500).send({ message: "Error fetching report data" });
  }
});