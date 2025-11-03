/**
 * Database Seeding Script
 * Populates the database with realistic dummy data for testing
 * 
 * Usage: node scripts/seed.js
 */

require("dotenv").config();
const pool = require("../config/db.config");
const bcrypt = require("bcryptjs");

// Configuration
const DEFAULT_PASSWORD = "Password123";
const SALT_ROUNDS = 10;

// Greek city locations
const LOCATIONS = ["Αθήνα", "Θεσσαλονίκη", "Πάτρα", "Ηράκλειο", "Λάρισα", "Βόλος"];

// Cuisine types
const CUISINES = ["Ιταλική", "Ελληνική", "Ασιατική", "Μεσογειακή", "Αμερικανική", "Μεξικάνικη", "Γαλλική", "Ιαπωνική"];

// Greek restaurant names
const RESTAURANT_NAMES = [
  "Το Καλό Φαΐ",
  "Μεζεδοπολείο Ο Θύλακας",
  "Ταβέρνα Η Αγκαλιά",
  "Restaurant Da Vinci",
  "Το Σαλόνι",
  "Ο Μεζεδοπότης",
  "Οι Φίλοι",
  "Η Κουζίνα",
  "Το Πάρκο",
  "Ο Μύλος",
  "Sea Breeze",
  "Urban Kitchen"
];

// Sample menu items by cuisine
const MENU_ITEMS = {
  "Ιταλική": [
    { name: "Μαργκερίτα", description: "Πίτσα με ντομάτα, μοτσαρέλα, βασιλικό", price: 12.50 },
    { name: "Καρμπονάρα", description: "Μακαρόνια με μπέικον, αυγό και παρμεζάνα", price: 15.00 },
    { name: "Λαζάνια", description: "Στοιβαγμένη παστίτσια με μοτσαρέλα", price: 18.00 },
    { name: "Ρισότο με μανιτάρια", description: "Ρύζι αρμύρικο με φρέσκα μανιτάρια", price: 16.50 },
    { name: "Τιραμισού", description: "Ιταλικό επιδόρπιο", price: 8.00 }
  ],
  "Ελληνική": [
    { name: "Μοσχάρι Στιφάδο", description: "Μοσχάρι με κρεμμύδια και κρασί", price: 22.00 },
    { name: "Μουσακάς", description: "Παστίτσια με μελιτζάνες και κιμά", price: 18.50 },
    { name: "Σουβλάκι", description: "4 ξυλάκια χοιρινό με πατάτες", price: 14.00 },
    { name: "Γύρος Πίτα", description: "Γύρος με πατάτες και τζατζίκι", price: 6.50 },
    { name: "Χωριάτικη Σαλάτα", description: "Φρέσκα λαχανικά με φέτα", price: 9.00 },
    { name: "Τζατζίκι", description: "Γιαούρτι με σκόρδο και αγγούρι", price: 5.00 }
  ],
  "Ασιατική": [
    { name: "Pad Thai", description: "Ταϊλανδέζικο ρύζι με κοτόπουλο", price: 14.50 },
    { name: "Sushi Mix", description: "10 κομμάτια σούσι", price: 24.00 },
    { name: "Wonton Soup", description: "Σούπα με wontons", price: 8.50 },
    { name: "Chicken Curry", description: "Κάρυ κοτόπουλο", price: 16.00 },
    { name: "Spring Rolls", description: "6 τηγανητά spring rolls", price: 7.00 }
  ],
  "Μεσογειακή": [
    { name: "Παστίτσιο", description: "Μακαρόνια με κιμά", price: 17.00 },
    { name: "Σουπακάκι", description: "Σουβλάκι ψαριού", price: 19.00 },
    { name: "Σαλάτα Ταραμοσαλάτα", description: "Ταραμοσαλάτα με ψωμί", price: 10.50 },
    { name: "Αστακός Linguine", description: "Μακαρόνια με αστακό", price: 28.00 }
  ],
  "Αμερικανική": [
    { name: "Burger Classic", description: "Μπιφτέκι με πατάτες", price: 13.50 },
    { name: "BBQ Ribs", description: "Πλευρά μοσχαριού", price: 24.00 },
    { name: "Caesar Salad", description: "Σαλάτα με κοτόπουλο", price: 12.00 },
    { name: "Chicken Wings", description: "6 φτερούγες", price: 11.00 }
  ]
};

/**
 * Hash password
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Generate random date within next 30 days
 */
function getRandomFutureDate() {
  const today = new Date();
  const daysToAdd = Math.floor(Math.random() * 30) + 1;
  const date = new Date(today);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
}

/**
 * Generate random time (between 12:00 and 22:00)
 */
function getRandomTime() {
  const hour = Math.floor(Math.random() * 11) + 12;
  const minute = Math.random() < 0.5 ? "00" : "30";
  return `${hour.toString().padStart(2, '0')}:${minute}`;
}

/**
 * Seed users (customers only - owners are in separate table)
 */
async function seedUsers() {
  console.log("🌱 Seeding users (customers)...");
  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
  
  const customers = [
    { name: "Γιάννης Παπαδόπουλος", email: "giannis@example.com", role: "customer" },
    { name: "Μαρία Γεωργίου", email: "maria@example.com", role: "customer" },
    { name: "Κώστας Δημητρίου", email: "kostas@example.com", role: "customer" },
    { name: "Ελένη Νικολάου", email: "eleni@example.com", role: "customer" },
    { name: "Νίκος Αντωνίου", email: "nikos@example.com", role: "customer" },
    { name: "Σοφία Παπαγεωργίου", email: "sofia@example.com", role: "customer" },
    { name: "Δημήτρης Κωνσταντίνου", email: "dimitris@example.com", role: "customer" },
    { name: "Αναστασία Βασιλείου", email: "anastasia@example.com", role: "customer" },
  ];

  const customerIds = [];

  for (const customer of customers) {
    try {
      // First try to get existing user
      const existing = await pool.query(
        `SELECT id FROM users WHERE email = $1`,
        [customer.email]
      );

      if (existing.rows.length > 0) {
        customerIds.push(existing.rows[0].id);
        console.log(`  - Customer already exists: ${customer.name} (${customer.email}) - ID: ${existing.rows[0].id}`);
      } else {
        // Insert new customer
        const result = await pool.query(
          `INSERT INTO users (name, email, password, role, confirmed_user, loyalty_points)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            customer.name,
            customer.email,
            hashedPassword,
            customer.role,
            true,
            Math.floor(Math.random() * 500)
          ]
        );
        customerIds.push(result.rows[0].id);
        console.log(`  ✓ Created customer: ${customer.name} (${customer.email}) - ID: ${result.rows[0].id}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create customer ${customer.email}:`, error.message);
      // Try to get ID anyway if user exists
      try {
        const existing = await pool.query(
          `SELECT id FROM users WHERE email = $1`,
          [customer.email]
        );
        if (existing.rows.length > 0) {
          customerIds.push(existing.rows[0].id);
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  return { customerIds };
}

/**
 * Seed owners (separate table from users)
 */
async function seedOwners() {
  console.log("\n🌱 Seeding owners...");
  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
  
  const owners = [
    { name: "Παύλος Ρέστας", email: "owner1@example.com", phone: "+302101111111" },
    { name: "Ευαγγελία Μακρή", email: "owner2@example.com", phone: "+302102222222" },
    { name: "Γιώργος Στεργίου", email: "owner3@example.com", phone: "+302103333333" },
    { name: "Αικατερίνη Μπάρμπα", email: "owner4@example.com", phone: "+302104444444" },
    { name: "Μιχάλης Καραγιάννης", email: "owner5@example.com", phone: "+302105555555" },
  ];

  const ownerIds = [];

  for (const owner of owners) {
    try {
      // First try to get existing owner
      const existing = await pool.query(
        `SELECT id FROM owners WHERE email = $1`,
        [owner.email]
      );

      if (existing.rows.length > 0) {
        ownerIds.push(existing.rows[0].id);
        console.log(`  - Owner already exists: ${owner.name} (${owner.email}) - ID: ${existing.rows[0].id}`);
      } else {
        // Insert new owner
        const result = await pool.query(
          `INSERT INTO owners (name, email, password, phone, role, google_id, facebook_id, newsletter_subscribed, profile_image, confirmed_user)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [
            owner.name,
            owner.email,
            hashedPassword,
            owner.phone,
            "owner",
            null,
            null,
            false,
            null,
            true
          ]
        );
        ownerIds.push(result.rows[0].id);
        console.log(`  ✓ Created owner: ${owner.name} (${owner.email}) - ID: ${result.rows[0].id}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to create owner ${owner.email}:`, error.message);
      // Try to get ID anyway if owner exists
      try {
        const existing = await pool.query(
          `SELECT id FROM owners WHERE email = $1`,
          [owner.email]
        );
        if (existing.rows.length > 0) {
          ownerIds.push(existing.rows[0].id);
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  return { ownerIds };
}

/**
 * Seed restaurants
 */
async function seedRestaurants(ownerIds) {
  console.log("\n🌱 Seeding restaurants...");
  const restaurantIds = [];

  // Filter out invalid ownerIds (check owners table, not users)
  const validOwnerIds = [];
  for (const ownerId of ownerIds) {
    if (!ownerId) continue;
    try {
      const check = await pool.query(
        `SELECT id FROM owners WHERE id = $1`,
        [ownerId]
      );
      if (check.rows.length > 0) {
        validOwnerIds.push(ownerId);
      }
    } catch (e) {
      console.error(`  ⚠ Skipping invalid owner ID: ${ownerId}`);
    }
  }

  if (validOwnerIds.length === 0) {
    console.log("  ⚠ No valid owners found. Cannot create restaurants.");
    return restaurantIds;
  }

  for (let i = 0; i < Math.min(RESTAURANT_NAMES.length, validOwnerIds.length); i++) {
    const ownerId = validOwnerIds[i];
    const name = RESTAURANT_NAMES[i];
    const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const cuisine = CUISINES[Math.floor(Math.random() * CUISINES.length)];
    
    const address = JSON.stringify({
      street: ["Λεωφόρος", "Οδός", "Πλατεία"][Math.floor(Math.random() * 3)],
      number: (Math.floor(Math.random() * 200) + 1).toString(),
      postalCode: (Math.floor(Math.random() * 90000) + 10000).toString(),
      area: location
    });

    const coordinates = JSON.stringify({
      lat: 37.9 + (Math.random() * 0.1),
      lng: 23.7 + (Math.random() * 0.1)
    });

    const openingHours = JSON.stringify({
      open: "11:00",
      close: "23:00"
    });

    const contact = JSON.stringify({
      phone: `+30${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      email: `contact@${name.toLowerCase().replace(/\s/g, "")}.gr`,
      socialMedia: {
        facebook: `https://facebook.com/${name.toLowerCase().replace(/\s/g, "")}`,
        instagram: `https://instagram.com/${name.toLowerCase().replace(/\s/g, "")}`
      }
    });

    // Generate realistic ratings for trending endpoint
    // Rating between 3.5 and 5.0 (realistic restaurant ratings)
    const rating = parseFloat((Math.random() * 1.5 + 3.5).toFixed(1));

    try {
      // Check if restaurant already exists for this owner
      const existing = await pool.query(
        `SELECT id FROM restaurants WHERE owner_id = $1 AND name = $2`,
        [ownerId, name]
      );

      if (existing.rows.length > 0) {
        restaurantIds.push(existing.rows[0].id);
        console.log(`  - Restaurant ${name} already exists for owner ${ownerId}`);
        
        // Always update rating to ensure it has a value for trending endpoint
        try {
          const updateResult = await pool.query(
            `UPDATE restaurants SET rating = $1 WHERE id = $2 AND (rating IS NULL OR rating = 0)`,
            [rating, existing.rows[0].id]
          );
          if (updateResult.rowCount > 0) {
            console.log(`    ✓ Updated rating to ${rating}⭐ for existing restaurant`);
          }
        } catch (e) {
          // Ignore if rating column doesn't exist
        }
      } else {
        const result = await pool.query(
          `INSERT INTO restaurants (name, location, cuisine, address, coordinates, opening_hours, contact, owner_id, rating)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [name, location, cuisine, address, coordinates, openingHours, contact, ownerId, rating]
        );

        if (result.rows.length > 0) {
          restaurantIds.push(result.rows[0].id);
          console.log(`  ✓ Created restaurant: ${name} (${cuisine}) - Rating: ${rating}⭐ - Owner ID: ${ownerId}`);
        }
      }
    } catch (error) {
      console.error(`  ✗ Failed to create restaurant ${name}:`, error.message);
    }
  }

  // IMPORTANT: Update ALL existing restaurants that don't have ratings
  // This ensures trending endpoint works even for restaurants created before this fix
  try {
    // Get all restaurants without ratings
    const restaurantsWithoutRatings = await pool.query(
      `SELECT id FROM restaurants WHERE rating IS NULL OR rating = 0`
    );

    if (restaurantsWithoutRatings.rows.length > 0) {
      let updatedCount = 0;
      for (const row of restaurantsWithoutRatings.rows) {
        const rating = parseFloat((Math.random() * 1.5 + 3.5).toFixed(1));
        
        await pool.query(
          `UPDATE restaurants SET rating = $1 WHERE id = $2`,
          [rating, row.id]
        );
        updatedCount++;
      }
      console.log(`  ✓ Updated ratings for ${updatedCount} existing restaurants without ratings`);
    }
  } catch (e) {
    // Column might not exist, ignore
    if (!e.message.includes("does not exist")) {
      console.warn(`  ⚠ Could not update ratings for existing restaurants:`, e.message);
    }
  }

  return restaurantIds;
}

/**
 * Seed menu items
 */
async function seedMenuItems(restaurantIds) {
  console.log("\n🌱 Seeding menu items...");
  
  for (const restaurantId of restaurantIds) {
    // Get restaurant cuisine
    const restaurant = await pool.query(`SELECT cuisine FROM restaurants WHERE id = $1`, [restaurantId]);
    if (restaurant.rows.length === 0) continue;
    
    const cuisine = restaurant.rows[0].cuisine;
    const items = MENU_ITEMS[cuisine] || MENU_ITEMS["Ελληνική"]; // Fallback to Greek

    for (const item of items) {
      try {
        await pool.query(
          `INSERT INTO menu_items (name, description, price, restaurant_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [item.name, item.description, item.price, restaurantId]
        );
      } catch (error) {
        console.error(`  ✗ Failed to create menu item ${item.name}:`, error.message);
      }
    }
    console.log(`  ✓ Added ${items.length} menu items to restaurant ID ${restaurantId}`);
  }
}

/**
 * Seed coupons
 */
async function seedCoupons(restaurantIds) {
  console.log("\n🌱 Seeding coupons...");
  
  const couponDescriptions = [
    "10% έκπτωση σε όλα τα πιάτα",
    "20% έκπτωση για παρέες 4+",
    "Ελεύθερο επιδόρπιο",
    "1+1 σε όλα τα ποτά",
    "15% έκπτωση σε σουβλάκια"
  ];

  for (const restaurantId of restaurantIds) {
    // Create 2-3 coupons per restaurant
    const numCoupons = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < numCoupons; i++) {
      const description = couponDescriptions[Math.floor(Math.random() * couponDescriptions.length)];
      const discountPercentage = [10, 15, 20, 25][Math.floor(Math.random() * 4)];
      const requiredPoints = [50, 100, 150, 200][Math.floor(Math.random() * 4)];

      try {
        await pool.query(
          `INSERT INTO coupons (description, discount_percentage, required_points, restaurant_id)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [description, discountPercentage, requiredPoints, restaurantId]
        );
      } catch (error) {
        console.error(`  ✗ Failed to create coupon:`, error.message);
      }
    }
    console.log(`  ✓ Created ${numCoupons} coupons for restaurant ID ${restaurantId}`);
  }
}

/**
 * Seed special menus
 */
async function seedSpecialMenus(restaurantIds) {
  console.log("\n🌱 Seeding special menus...");
  
  const specialMenuNames = [
    "Μενού του Μήνα",
    "Σαββατιανό Μενού",
    "Ρομαντικό Μενού",
    "Οικογενειακό Μενού",
    "Business Lunch"
  ];

  for (const restaurantId of restaurantIds) {
    // Create 1-3 special menus per restaurant (for discounted endpoint)
    // Most restaurants should have at least 1 special menu
    const numMenus = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numMenus; i++) {
      const name = specialMenuNames[Math.floor(Math.random() * specialMenuNames.length)];
      const description = `Ειδικό μενού με ${name.toLowerCase()}`;
      const discountedPrice = parseFloat((Math.random() * 30 + 20).toFixed(2));

      try {
        // special_menus has: name, description, original_price (computed), 
        // discounted_price, discount_percentage (computed), photo_url, restaurant_id, availability
        const result = await pool.query(
          `INSERT INTO special_menus (name, description, original_price, discounted_price, discount_percentage, photo_url, restaurant_id, availability)
           VALUES ($1, $2, NULL, $3, NULL, NULL, $4, NULL)
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [name, description, discountedPrice, restaurantId]
        );

        if (result.rows.length > 0) {
          console.log(`  ✓ Created special menu: ${name} (€${discountedPrice}) for restaurant ID ${restaurantId}`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to create special menu:`, error.message);
      }
    }
  }
}

/**
 * Seed reservations
 */
async function seedReservations(customerIds, restaurantIds) {
  console.log("\n🌱 Seeding reservations...");
  
  const statuses = ["pending", "confirmed", "completed", "cancelled"];
  
  for (let i = 0; i < 30; i++) {
    const userId = customerIds[Math.floor(Math.random() * customerIds.length)];
    const restaurantId = restaurantIds[Math.floor(Math.random() * restaurantIds.length)];
    const date = getRandomFutureDate();
    const time = getRandomTime();
    const guestCount = Math.floor(Math.random() * 5) + 2;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    // Optional: Get a special menu for this restaurant
    const specialMenuResult = await pool.query(
      `SELECT id FROM special_menus WHERE restaurant_id = $1 LIMIT 1`,
      [restaurantId]
    );
    const specialMenuId = specialMenuResult.rows.length > 0 ? specialMenuResult.rows[0].id : null;

    // Optional: Get a coupon for this restaurant
    const couponResult = await pool.query(
      `SELECT id FROM coupons WHERE restaurant_id = $1 LIMIT 1`,
      [restaurantId]
    );
    const couponId = couponResult.rows.length > 0 ? couponResult.rows[0].id : null;

    try {
      await pool.query(
        `INSERT INTO reservations (user_id, restaurant_id, date, time, guest_count, status, special_menu_id, coupon_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT DO NOTHING`,
        [userId, restaurantId, date, time, guestCount, status, specialMenuId, couponId]
      );
    } catch (error) {
      console.error(`  ✗ Failed to create reservation:`, error.message);
    }
  }
  console.log(`  ✓ Created 30 reservations`);
}

/**
 * Main seeding function
 */
async function seed() {
  console.log("🚀 Starting database seeding...\n");

  try {
    // Test connection
    await pool.query("SELECT NOW()");
    console.log("✅ Database connection successful\n");

    // Seed in order (respecting foreign keys)
    // 1. Seed customers (users table)
    const { customerIds } = await seedUsers();
    
    // 2. Seed owners (owners table - separate from users)
    const { ownerIds } = await seedOwners();
    
    // 3. Seed restaurants (references owners table)
    const restaurantIds = await seedRestaurants(ownerIds);
    await seedMenuItems(restaurantIds);
    await seedCoupons(restaurantIds);
    await seedSpecialMenus(restaurantIds);
    await seedReservations(customerIds, restaurantIds);

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\n📝 Login credentials:");
    console.log("   Default password for all users: " + DEFAULT_PASSWORD);
    console.log("\n   Customers:");
    console.log("   - giannis@example.com");
    console.log("   - maria@example.com");
    console.log("   - kostas@example.com");
    console.log("\n   Owners:");
    console.log("   - owner1@example.com");
    console.log("   - owner2@example.com");
    console.log("   - owner3@example.com");

  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if executed directly
if (require.main === module) {
  seed();
}

module.exports = { seed };

