const {
  getOwnerByEmail,
  insertOwner,
  insertPasswordResetOwner,
  updateOwnerPassword,
  getOwnerById,
  updateOwner,
  confirmOwner,
} = require("../queries/ownerQueries");

const {
  ownerSchema,
  loginSchemaOwner,
  ownerUpdateSchema,
} = require("../validators/ownerValidator");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const {
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../utils/sendVerificationEmail");

const { JWT_SECRET, NODE_ENV, FRONT_END_URL, envPORT } = process.env;

const registerOwner = async (req, res, pool) => {
  try {
    const { error, value } = ownerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const {
      name,
      email,
      password,
      phone,
      role,
      newsletter_subscribed,
      profile_image,
    } = value;

    const existingOwner = await pool.query(getOwnerByEmail, [email]);

    if (existingOwner.rows.length > 0) {
      return res.status(400).json({ message: "Owner already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(insertOwner, [
      name,
      email,
      hashedPassword,
      phone,
      role,
      null,
      null,
      newsletter_subscribed,
      profile_image,
    ]);

    await sendVerificationEmail(result.rows[0]);

    res.status(201).json({
      message: "Owner registered. Check your email for verification.",
    });
  } catch (err) {
    console.error("Error in registerOwner:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const checkAuthStatus = (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json({ loggedIn: false });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ loggedIn: true, user: decoded }); 
  } catch (err) {
    res.clearCookie("token");
    res.json({ loggedIn: false });
  }
};

const logoutOwner = (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
};

const requestResetPasswordOwner = async (req, res, pool) => {
  try {
    const { error, value } = ownerUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { email } = value;

    const ownerResult = await pool.query(getOwnerByEmail, [email]);
    if (ownerResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No account found with this email" });
    }

    const owner = ownerResult.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(insertPasswordResetOwner, [
      owner.id,
      token,
      expiresAt,
    ]);

    const resetUrl = `${FRONT_END_URL}:${envPORT}/reset-password-owner.html?token=${token}`;
    await sendResetPasswordEmail(owner, resetUrl);

    res.json({ message: "Reset link sent. Check your email." });
  } catch (err) {
    console.error("❌ Error in requestPasswordReset:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const resetPasswordOwner = async (req, res, pool) => {
  try {
    const { token, password } = req.body;

    const result = await pool.query(
      `SELECT * FROM password_resets_owners WHERE token = $1`,
      [token]
    );

    const resetRequest = result.rows[0];
    if (!resetRequest || resetRequest.used || new Date() > new Date(resetRequest.expires_at)) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token." });
    }

    const ownerResult = await pool.query(`SELECT * FROM owners WHERE id = $1`, [
      resetRequest.owner_id,
    ]);
    const owner = ownerResult.rows[0];

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await pool.query(updateOwnerPassword, [hashedPassword, owner.id]);

    await pool.query(
      `UPDATE password_resets_owners SET used = TRUE WHERE id = $1`,
      [resetRequest.id]
    );

    res.json({ message: "Password successfully updated." });
  } catch (err) {
    console.error("❌ Error in resetPassword:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const checkResetPasswordTokenOwner = async (req, res, pool) => {
  try {
    const { token } = req.body;
    const result = await pool.query(
      `SELECT * FROM password_resets_owners WHERE token = $1`,
      [token]
    );

    const resetRequest = result.rows[0];
    if (!resetRequest || resetRequest.used || new Date() > new Date(resetRequest.expires_at)) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token." });
    }
    // If we reach here, the token is valid
    res.json({ valid: true });
  } catch (err) {
    console.error("❌ Error in checkResetPasswordTokenOwner:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const loginOwner = async (req, res, pool) => {
  const { email, password } = req.body;
  const { error } = loginSchemaOwner.validate({ email, password });
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const ownerResult = await pool.query(getOwnerByEmail, [email]);
    if (ownerResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    const owner = ownerResult.rows[0];

    const validPassword = await bcrypt.compare(password, owner.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const payload = {
      id: owner.id,
      email: owner.email,
      role: "owner",
      name: owner.name,
      confirmed_user: owner.confirmed_user,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
    
    res.cookie("token", token, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      path: "/",
      sameSite: "Lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // 👇 THE CRITICAL FIX: Return the full payload object as the 'owner' property.
    res.json({
      message: "Login successful",
      owner: payload,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const updateOwnerDetails = async (req, res, pool) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token found" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const ownerId = decoded.id;

    const { error, value } = ownerUpdateSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { name, email, password, phone } = value;
    
    let hashedPassword;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const updateFields = [];
    const updateValues = [];
    let counter = 1;

    if (name) { updateFields.push(`name = $${counter++}`); updateValues.push(name); }
    if (email) { updateFields.push(`email = $${counter++}`); updateValues.push(email); }
    if (phone) { updateFields.push(`phone = $${counter++}`); updateValues.push(phone); }
    if (hashedPassword) { updateFields.push(`password = $${counter++}`); updateValues.push(hashedPassword); }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    updateValues.push(ownerId);
    const result = await pool.query(updateOwner(updateFields.join(", "), counter), updateValues);
    
    res.json({ message: "Owner updated successfully", owner: result.rows[0] });
  } catch (err) {
    console.error("❌ Error in updateOwnerDetails:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getOwnerProfile = async (req, res, pool) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token found" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const ownerQuery = await pool.query(getOwnerById, [decoded.id]);
    
    if (ownerQuery.rows.length === 0) {
      return res.status(404).json({ message: "Owner not found" });
    }

    res.json({ ...ownerQuery.rows[0], role: "owner" });
  } catch (error) {
    console.error("❌ Error in getOwnerProfile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyOwnerEmail = async (req, res, pool) => {
  try {
    const { token } = req.query;
    if (!token)
      return res.status(400).json({ message: "Invalid or expired token" });

    const decoded = jwt.verify(token, JWT_SECRET);
    await pool.query(confirmOwner, [decoded.id]);
    
    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: "Invalid or expired token" });
  }
};

const resendVerificationEmailToOwner = async (req, res, pool) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });

  try {
    const existingOwner = await pool.query(getOwnerByEmail, [email]);

    if (existingOwner.rows.length === 0) {
      return res.status(404).json({ message: "Owner not found." });
    }

    const owner = existingOwner.rows[0];

    if (owner.confirmed_user) {
      return res.status(400).json({ message: "Owner is already verified." });
    }

    await sendVerificationEmail(owner);

    res.json({ message: "Verification email resent! Check your inbox." });
  } catch (error) {
    console.error("Error in resendVerificationEmailToOwner:", error);
    res.status(500).json({ message: "Error resending verification email." });
  }
};

module.exports = {
  registerOwner,
  checkAuthStatus,
  logoutOwner,
  requestResetPasswordOwner,
  resetPasswordOwner,
  checkResetPasswordTokenOwner,
  loginOwner,
  updateOwnerDetails,
  getOwnerProfile,
  verifyOwnerEmail,
  resendVerificationEmailToOwner,
};