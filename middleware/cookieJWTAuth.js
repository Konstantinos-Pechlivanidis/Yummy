const jwt = require("jsonwebtoken");

const cookieJWTAuth = (req, res, next) => {
  const token = req.cookies.token;
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    res.clearCookie("token");
    return res.status(401).json({ message: "Unauthorized - Invalid or expired token" });
  }
};

module.exports = cookieJWTAuth;
