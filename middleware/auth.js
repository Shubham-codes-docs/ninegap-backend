const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  let decoded;
  const header = req.get("Authorization");
  if (!header) {
    req.isAuth = false;
    return next();
  }
  const token = req.get("Authorization").split(" ")[1];
  try {
    decoded = jwt.verify(token, process.env.jwtSecret);
  } catch (err) {
    req.isAuth = false;
    return next(err);
  }
  if (!decoded) {
    req.isAuth = false;
    return next();
  }
  req.userId = decoded.userId;
  req.isAuth = true;
  next();
};
