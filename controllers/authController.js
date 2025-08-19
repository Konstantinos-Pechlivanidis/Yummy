const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

// This is a new, unified controller to handle auth status for all user types.
const checkUnifiedAuthStatus = (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ loggedIn: false, user: null });
  }

  try {
    // First, just verify the token is valid and decode its payload.
    // We don't need to query the database yet, as the role is in the token.
    const decodedUser = jwt.verify(token, JWT_SECRET);
    
    // The decoded token already contains the essential user info (id, name, email, role).
    // This is enough for the front end to know who is logged in.
    res.json({ loggedIn: true, user: decodedUser });

  } catch (err) {
    // If the token is invalid or expired, clear it and respond.
    res.clearCookie("token");
    return res.json({ loggedIn: false, user: null });
  }
};

module.exports = {
  checkUnifiedAuthStatus,
};
