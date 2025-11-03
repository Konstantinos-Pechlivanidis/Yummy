# Database Seeding Scripts

## Seed Database

Το `seed.js` script δημιουργεί dummy data για testing και development.

### Χρήση

```bash
npm run seed
```

ή

```bash
node scripts/seed.js
```

### Τι δημιουργεί;

Το script δημιουργεί:

- **8 Customers** (πελάτες) με ελληνικά ονόματα - στον πίνακα `users`
- **5 Owners** (ιδιοκτήτες εστιατορίων) - στον πίνακα `owners` (ξεχωριστός πίνακας)
- **12 Restaurants** με:
  - Ελληνικά ονόματα
  - Διαφορετικές κουζίνες (Ιταλική, Ελληνική, Ασιατική, κτλ)
  - Πραγματικές ελληνικές πόλεις
  - Addresses, coordinates, opening hours
  - **Rating** (3.5-5.0 ⭐) - για trending endpoint
- **Menu Items** για κάθε restaurant (5-6 πιάτα ανάλογα με την κουζίνα)
- **Coupons** (2-3 ανά restaurant)
- **Special Menus** (1-3 ανά restaurant) - για discounted endpoint
- **30 Reservations** με:
  - Διαφορετικά status (pending, confirmed, completed, cancelled)
  - Τυχαίες ημερομηνίες τις επόμενες 30 μέρες
  - Coupons και special menus όπου εφαρμόζεται

### Login Credentials

**Default Password για όλους:** `Password123`

**Customers:**
- giannis@example.com
- maria@example.com
- kostas@example.com
- eleni@example.com
- nikos@example.com
- sofia@example.com
- dimitris@example.com
- anastasia@example.com

**Owners:**
- owner1@example.com
- owner2@example.com
- owner3@example.com
- owner4@example.com
- owner5@example.com

### Σημειώσεις

- Το script χρησιμοποιεί `ON CONFLICT DO NOTHING` για να μην δημιουργήσει duplicates
- Αν ένα user ή restaurant υπάρχει ήδη, θα το skip
- Μπορείς να τρέξεις το script πολλές φορές - θα προσθέτει μόνο νέα data
- Για να καθαρίσεις τα δεδομένα, πρέπει να το κάνεις manually από το Neon console ή με SQL

### Customization

Μπορείς να τροποποιήσεις το `scripts/seed.js` για να:
- Αλλάξεις τον αριθμό των records
- Προσθέσεις περισσότερες κουζίνες ή menu items
- Αλλάξεις τα ελληνικά ονόματα
- Προσαρμόσεις τις τιμές και τις περιγραφές

