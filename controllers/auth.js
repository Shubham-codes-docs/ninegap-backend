const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/users");

exports.signUp = async (req, res, next) => {
  const { firstName, lastName, email, password, profilePic } = req.body;
  if (
    firstName === "" ||
    lastName === "" ||
    email === "" ||
    password === "" ||
    profilePic === ""
  ) {
    const err = new Error("Incomplete fields");
    next(err);
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    profilePic,
  });
  await user.save();
  res.status(200).json({ success: 1, msg: "User Registered Successfully!" });
};

exports.login = async (req, res, next) => {
  let { email, password } = req.body;
  const user = await User.findOne({ email: email });
  if (!user) {
    res.json({ success: 0, msg: "Invalid Id" });
  }
  const result = await bcrypt.compare(password, user.password);
  if (result) {
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      process.env.jwtSecret
    );
    res.status(200).json({ success: 1, msg: "Logged In", token });
  } else {
    res.json({ success: 0, msg: "Invalid Credentials" });
  }
};

exports.getUsers = async (req, res, next) => {
  if (!req.isAuth) {
    const err = new Error("Authentication failed");
    err.status = 202;
    throw err;
  }
  const user = await User.findOne({ _id: req.userId });
  if (!user) {
    res.status(404).json({ success: 0, msg: "No user Found" });
  }
  res.status(200).json({ success: 1, user });
};
