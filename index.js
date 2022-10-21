const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const aws = require("aws-sdk");
const multer_s3 = require("multer-s3");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");

const authRoute = require("./routes/auth");
const app = express();

app.use(cors());
app.use(express.json());
dotenv.config();

app.use(
  session({
    resave: false,
    saveUninitialized: true,
    secret: "SECRETYoushouldnotknow",
  })
);

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

/*  Google AUTH  */
let userProfile;
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    function (accessToken, refreshToken, profile, done) {
      userProfile = profile;
      return done(null, userProfile);
    }
  )
);

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google"),
  function (req, res) {
    // Successful authentication, redirect success.
    res.redirect("/profile");
    res.json({ success: 1, token: "googled", userProfile });
  }
);

app.get("/auth/google/success", () => {
  res.json({ success: 1, token: "googled", userProfile });
});

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    //  useCreateIndex:true ,
  })
  .then(console.log("Connected to MONGODB"))
  .catch((err) => console.log(err));

//file storage

const s3Config = new aws.S3({
  secretAccessKey: process.env.AWS_Secret_Key,
  accessKeyId: process.env.AWS_Access_Key_Id,
  region: "ap-south-1",
  BUCKET: process.env.BUCKET_NAME,
});

const multers3Config = multer_s3({
  s3: s3Config,
  bucket: process.env.BUCKET_NAME,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    cb(null, "public/" + uuidv4() + "-" + file.originalname);
  },
});

const filefilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage: multers3Config, fileFilter: filefilter }); // using multer to upload a multiple files
app.post("/upload", upload.single("file"), (req, res, next) => {
  if (!req.file) {
    return res.status(200).json({ msg: "No file Chosen" });
  }
  res
    .status(201)
    .json({ msg: "File Uploaded", path: req.file.key, success: true });
});

//routes
app.use(authRoute);

app.listen(process.env.PORT || 5000, () => {
  console.log("Server started...");
});
