const express = require("express");
const auth = require("../controllers/auth");
const AUTH = require("../middleware/auth");
const router = express.Router();

//Signup route
router.post("/v1/signup", auth.signUp);
//Login Route
router.post("/v1/login", auth.login);

//get users
router.get("/v1/getUser", AUTH, auth.getUsers);

module.exports = router;
