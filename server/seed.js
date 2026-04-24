const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  const client = await pool.connect();

  try {
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS invoices CASCADE;
      DROP TABLE IF EXISTS forecasts CASCADE;
      DROP TABLE IF EXISTS maintenance_requests CASCADE;
      DROP TABLE IF EXISTS competitors CASCADE;
      DROP TABLE IF EXISTS promotions CASCADE;
      DROP TABLE IF EXISTS staff CASCADE;
      DROP TABLE IF EXISTS reviews CASCADE;
      DROP TABLE IF EXISTS analytics CASCADE;
      DROP TABLE IF EXISTS reservations CASCADE;
      DROP TABLE IF EXISTS upsell_rules CASCADE;
      DROP TABLE IF EXISTS housekeeping_tasks CASCADE;
      DROP TABLE IF EXISTS guests CASCADE;
      DROP TABLE IF EXISTS channels CASCADE;
      DROP TABLE IF EXISTS pricing_rules CASCADE;
      DROP TABLE IF EXISTS rooms CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log('Creating tables...');
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE rooms (
        id SERIAL PRIMARY KEY,
        room_number VARCHAR(20) NOT NULL,
        type VARCHAR(100) NOT NULL,
        floor INTEGER DEFAULT 1,
        capacity INTEGER DEFAULT 2,
        base_price DECIMAL(10,2) DEFAULT 100.00,
        status VARCHAR(50) DEFAULT 'available',
        amenities TEXT DEFAULT '',
        description TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE pricing_rules (
        id SERIAL PRIMARY KEY,
        room_type VARCHAR(100) NOT NULL,
        base_price DECIMAL(10,2) NOT NULL,
        min_price DECIMAL(10,2) DEFAULT 0,
        max_price DECIMAL(10,2) DEFAULT 9999,
        season VARCHAR(50) DEFAULT 'regular',
        day_of_week VARCHAR(50) DEFAULT 'all',
        occupancy_threshold DECIMAL(5,2) DEFAULT 0,
        adjustment_percent DECIMAL(5,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE channels (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        commission_rate DECIMAL(5,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 1,
        allocation_percent DECIMAL(5,2) DEFAULT 0,
        avg_booking_value DECIMAL(10,2) DEFAULT 0,
        performance_score DECIMAL(5,2) DEFAULT 0,
        contract_end DATE,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE guests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT '',
        nationality VARCHAR(100) DEFAULT '',
        vip_level VARCHAR(50) DEFAULT 'standard',
        total_stays INTEGER DEFAULT 0,
        preferences JSONB DEFAULT '{}',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE housekeeping_tasks (
        id SERIAL PRIMARY KEY,
        room_number VARCHAR(20) NOT NULL,
        task_type VARCHAR(100) NOT NULL,
        assigned_to VARCHAR(255) DEFAULT '',
        priority VARCHAR(20) DEFAULT 'medium',
        status VARCHAR(50) DEFAULT 'pending',
        scheduled_date DATE DEFAULT CURRENT_DATE,
        scheduled_time VARCHAR(10) DEFAULT '09:00',
        estimated_duration INTEGER DEFAULT 30,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE upsell_rules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        target_segment VARCHAR(100) DEFAULT 'all',
        trigger_event VARCHAR(100) DEFAULT 'check-in',
        offer_description TEXT DEFAULT '',
        discount_percent DECIMAL(5,2) DEFAULT 0,
        revenue_potential DECIMAL(10,2) DEFAULT 0,
        success_rate DECIMAL(5,2) DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE reservations (
        id SERIAL PRIMARY KEY,
        guest_name VARCHAR(255) NOT NULL,
        guest_email VARCHAR(255) DEFAULT '',
        room_number VARCHAR(20) NOT NULL,
        room_type VARCHAR(100) DEFAULT 'Standard',
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        nights INTEGER DEFAULT 1,
        total_price DECIMAL(10,2) DEFAULT 0,
        channel VARCHAR(100) DEFAULT 'Direct',
        status VARCHAR(50) DEFAULT 'confirmed',
        special_requests TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE analytics (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        revenue DECIMAL(12,2) DEFAULT 0,
        occupancy_rate DECIMAL(5,2) DEFAULT 0,
        adr DECIMAL(10,2) DEFAULT 0,
        revpar DECIMAL(10,2) DEFAULT 0,
        channel VARCHAR(100) DEFAULT 'all',
        room_type VARCHAR(100) DEFAULT 'all',
        total_bookings INTEGER DEFAULT 0,
        cancellations INTEGER DEFAULT 0,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE reviews (
        id SERIAL PRIMARY KEY,
        guest_name VARCHAR(255) NOT NULL,
        room_number VARCHAR(20) DEFAULT '',
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        title VARCHAR(255) DEFAULT '',
        comment TEXT NOT NULL,
        sentiment VARCHAR(50) DEFAULT 'pending',
        stay_date DATE DEFAULT CURRENT_DATE,
        response TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE staff (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT '',
        role VARCHAR(100) NOT NULL,
        department VARCHAR(100) DEFAULT '',
        shift VARCHAR(50) DEFAULT 'Morning',
        status VARCHAR(50) DEFAULT 'Active',
        hire_date DATE DEFAULT CURRENT_DATE,
        salary DECIMAL(10,2) DEFAULT 0,
        performance_score DECIMAL(5,2) DEFAULT 0,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE promotions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        description TEXT DEFAULT '',
        discount_percent DECIMAL(5,2) DEFAULT 0,
        min_nights INTEGER DEFAULT 1,
        max_nights INTEGER DEFAULT 30,
        valid_from DATE DEFAULT CURRENT_DATE,
        valid_until DATE,
        applicable_room_types VARCHAR(255) DEFAULT 'All',
        promo_code VARCHAR(100) DEFAULT '',
        is_active BOOLEAN DEFAULT true,
        times_used INTEGER DEFAULT 0,
        revenue_generated DECIMAL(12,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE competitors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) DEFAULT '',
        star_rating INTEGER DEFAULT 3,
        avg_rate DECIMAL(10,2) DEFAULT 0,
        our_rate DECIMAL(10,2) DEFAULT 0,
        rate_difference DECIMAL(10,2) DEFAULT 0,
        occupancy_estimate DECIMAL(5,2) DEFAULT 0,
        strengths TEXT DEFAULT '',
        weaknesses TEXT DEFAULT '',
        last_checked DATE DEFAULT CURRENT_DATE,
        source VARCHAR(255) DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE maintenance_requests (
        id SERIAL PRIMARY KEY,
        room_number VARCHAR(20) NOT NULL,
        category VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT '',
        reported_by VARCHAR(255) DEFAULT '',
        assigned_to VARCHAR(255) DEFAULT '',
        priority VARCHAR(50) DEFAULT 'Medium',
        status VARCHAR(50) DEFAULT 'Open',
        estimated_cost DECIMAL(10,2) DEFAULT 0,
        actual_cost DECIMAL(10,2) DEFAULT 0,
        reported_date DATE DEFAULT CURRENT_DATE,
        completed_date DATE,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE forecasts (
        id SERIAL PRIMARY KEY,
        forecast_date DATE NOT NULL,
        period VARCHAR(50) NOT NULL,
        predicted_occupancy DECIMAL(5,2) DEFAULT 0,
        predicted_revenue DECIMAL(12,2) DEFAULT 0,
        predicted_adr DECIMAL(10,2) DEFAULT 0,
        confidence_score DECIMAL(5,2) DEFAULT 0,
        factors TEXT DEFAULT '',
        actual_occupancy DECIMAL(5,2),
        actual_revenue DECIMAL(12,2),
        variance DECIMAL(5,2),
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        reservation_id INTEGER,
        guest_name VARCHAR(255) NOT NULL,
        guest_email VARCHAR(255) DEFAULT '',
        room_number VARCHAR(20) NOT NULL,
        check_in DATE,
        check_out DATE,
        nights INTEGER DEFAULT 1,
        room_charges DECIMAL(10,2) DEFAULT 0,
        tax_rate DECIMAL(5,2) DEFAULT 10,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        additional_charges DECIMAL(10,2) DEFAULT 0,
        discounts DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'Credit Card',
        payment_status VARCHAR(50) DEFAULT 'Pending',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        priority VARCHAR(50) DEFAULT 'medium',
        category VARCHAR(50) DEFAULT 'general',
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Seeding users...');
    const passwordHash = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (name, email, password_hash, role) VALUES
      ('Admin User', 'admin@hotel.com', $1, 'admin'),
      ('Sarah Johnson', 'sarah@hotel.com', $1, 'manager'),
      ('Mike Chen', 'mike@hotel.com', $1, 'staff'),
      ('Emily Davis', 'emily@hotel.com', $1, 'staff'),
      ('Robert Wilson', 'robert@hotel.com', $1, 'receptionist'),
      ('Lisa Anderson', 'lisa@hotel.com', $1, 'housekeeping'),
      ('David Martinez', 'david@hotel.com', $1, 'manager'),
      ('Jennifer Taylor', 'jennifer@hotel.com', $1, 'staff'),
      ('James Brown', 'james@hotel.com', $1, 'receptionist'),
      ('Maria Garcia', 'maria@hotel.com', $1, 'housekeeping'),
      ('Thomas Lee', 'thomas@hotel.com', $1, 'staff'),
      ('Amanda White', 'amanda@hotel.com', $1, 'manager'),
      ('Chris Robinson', 'chris@hotel.com', $1, 'staff'),
      ('Nicole Harris', 'nicole@hotel.com', $1, 'receptionist'),
      ('Kevin Clark', 'kevin@hotel.com', $1, 'staff')
    `, [passwordHash]);

    console.log('Seeding rooms...');
    await client.query(`
      INSERT INTO rooms (room_number, type, floor, capacity, base_price, status, amenities, description) VALUES
      ('101', 'Standard', 1, 2, 120.00, 'available', 'WiFi, TV, Mini-bar, Air conditioning', 'Cozy standard room with city view'),
      ('102', 'Standard', 1, 2, 120.00, 'occupied', 'WiFi, TV, Mini-bar, Air conditioning', 'Standard room with garden view'),
      ('103', 'Standard', 1, 3, 140.00, 'available', 'WiFi, TV, Mini-bar, Air conditioning, Sofa bed', 'Spacious standard room with extra bed'),
      ('201', 'Deluxe', 2, 2, 200.00, 'available', 'WiFi, TV, Mini-bar, Air conditioning, Balcony, Coffee machine', 'Deluxe room with panoramic city view'),
      ('202', 'Deluxe', 2, 2, 200.00, 'maintenance', 'WiFi, TV, Mini-bar, Air conditioning, Balcony, Coffee machine', 'Deluxe room with ocean view'),
      ('203', 'Deluxe', 2, 3, 220.00, 'occupied', 'WiFi, TV, Mini-bar, Air conditioning, Balcony, Coffee machine, Sofa bed', 'Deluxe family room'),
      ('301', 'Suite', 3, 2, 350.00, 'available', 'WiFi, TV, Mini-bar, Air conditioning, Balcony, Coffee machine, Living area, Jacuzzi', 'Junior suite with living area'),
      ('302', 'Suite', 3, 4, 400.00, 'available', 'WiFi, TV, Mini-bar, Air conditioning, Balcony, Coffee machine, Living area, Kitchen', 'Family suite with kitchenette'),
      ('303', 'Suite', 3, 2, 380.00, 'occupied', 'WiFi, TV, Mini-bar, Air conditioning, Balcony, Coffee machine, Living area, Office desk', 'Business suite'),
      ('401', 'Presidential', 4, 4, 800.00, 'available', 'WiFi, TV, Mini-bar, Air conditioning, Terrace, Coffee machine, Living area, Jacuzzi, Butler service, Dining room', 'Presidential suite with full amenities'),
      ('104', 'Standard', 1, 2, 110.00, 'available', 'WiFi, TV, Air conditioning', 'Economy standard room'),
      ('105', 'Standard', 1, 1, 95.00, 'available', 'WiFi, TV, Air conditioning', 'Single standard room'),
      ('204', 'Deluxe', 2, 2, 210.00, 'available', 'WiFi, TV, Mini-bar, Air conditioning, Balcony, Bathrobe', 'Deluxe room with spa bath'),
      ('304', 'Suite', 3, 3, 420.00, 'available', 'WiFi, TV, Mini-bar, Air conditioning, Balcony, Living area, Dining area', 'Executive suite'),
      ('106', 'Standard', 1, 2, 130.00, 'cleaning', 'WiFi, TV, Mini-bar, Air conditioning, Desk', 'Standard business room')
    `);

    console.log('Seeding pricing rules...');
    await client.query(`
      INSERT INTO pricing_rules (room_type, base_price, min_price, max_price, season, day_of_week, occupancy_threshold, adjustment_percent, is_active, notes) VALUES
      ('Standard', 120.00, 80.00, 200.00, 'regular', 'all', 0, 0, true, 'Base standard pricing'),
      ('Standard', 120.00, 90.00, 250.00, 'high', 'all', 0, 25, true, 'High season standard markup'),
      ('Standard', 120.00, 60.00, 150.00, 'low', 'all', 0, -20, true, 'Low season standard discount'),
      ('Deluxe', 200.00, 150.00, 350.00, 'regular', 'all', 0, 0, true, 'Base deluxe pricing'),
      ('Deluxe', 200.00, 180.00, 400.00, 'high', 'all', 0, 30, true, 'High season deluxe markup'),
      ('Deluxe', 200.00, 120.00, 280.00, 'low', 'all', 0, -15, true, 'Low season deluxe discount'),
      ('Suite', 350.00, 250.00, 600.00, 'regular', 'all', 0, 0, true, 'Base suite pricing'),
      ('Suite', 350.00, 300.00, 700.00, 'high', 'all', 0, 35, true, 'High season suite markup'),
      ('Presidential', 800.00, 600.00, 1500.00, 'regular', 'all', 0, 0, true, 'Base presidential pricing'),
      ('Presidential', 800.00, 700.00, 2000.00, 'high', 'all', 0, 40, true, 'High season presidential markup'),
      ('Standard', 120.00, 100.00, 220.00, 'regular', 'weekend', 0, 15, true, 'Weekend standard surge'),
      ('Deluxe', 200.00, 170.00, 380.00, 'regular', 'weekend', 0, 20, true, 'Weekend deluxe surge'),
      ('Standard', 120.00, 100.00, 240.00, 'regular', 'all', 80, 20, true, 'High occupancy standard surge'),
      ('Deluxe', 200.00, 170.00, 400.00, 'regular', 'all', 80, 25, true, 'High occupancy deluxe surge'),
      ('Suite', 350.00, 280.00, 650.00, 'regular', 'weekend', 0, 18, true, 'Weekend suite surge')
    `);

    console.log('Seeding channels...');
    await client.query(`
      INSERT INTO channels (name, commission_rate, is_active, priority, allocation_percent, avg_booking_value, performance_score, contract_end, notes) VALUES
      ('Booking.com', 15.00, true, 1, 30.00, 245.00, 88.50, '2026-12-31', 'Primary OTA partner, highest volume'),
      ('Expedia', 18.00, true, 2, 20.00, 230.00, 82.30, '2026-10-15', 'Strong US market presence'),
      ('Hotels.com', 17.00, true, 3, 10.00, 210.00, 75.00, '2026-08-30', 'Part of Expedia group, loyalty program'),
      ('Direct Website', 0.00, true, 1, 25.00, 280.00, 95.00, null, 'No commission, highest margin channel'),
      ('Airbnb', 14.00, true, 4, 5.00, 190.00, 70.00, '2026-06-30', 'Growing alternative accommodation market'),
      ('TripAdvisor', 12.00, true, 5, 3.00, 255.00, 78.00, '2026-09-30', 'Strong review-driven bookings'),
      ('Agoda', 16.00, true, 3, 4.00, 200.00, 72.00, '2026-11-30', 'Strong in Asian markets'),
      ('Google Hotels', 10.00, true, 2, 8.00, 260.00, 85.00, '2026-12-31', 'Growing metasearch channel'),
      ('Phone Reservations', 0.00, true, 2, 5.00, 300.00, 90.00, null, 'Traditional booking, high-value guests'),
      ('Walk-in', 0.00, true, 5, 3.00, 150.00, 60.00, null, 'Last minute bookings, lower rates'),
      ('Corporate Portal', 5.00, true, 2, 10.00, 320.00, 88.00, '2027-03-31', 'B2B corporate agreements'),
      ('Travel Agents', 10.00, true, 4, 4.00, 275.00, 76.00, '2026-07-31', 'Traditional travel agency partnerships'),
      ('Kayak', 12.00, true, 4, 2.00, 220.00, 71.00, '2026-09-30', 'Metasearch aggregator'),
      ('Trivago', 11.00, true, 4, 1.50, 215.00, 69.00, '2026-08-31', 'European metasearch focus'),
      ('Priceline', 16.00, false, 5, 0.50, 180.00, 55.00, '2026-04-30', 'Paused - low performance')
    `);

    console.log('Seeding guests...');
    await client.query(`
      INSERT INTO guests (name, email, phone, nationality, vip_level, total_stays, preferences, notes) VALUES
      ('John Smith', 'john.smith@email.com', '+1-555-0101', 'American', 'gold', 12, '{"room_type": "Deluxe", "floor": "high", "pillow": "firm", "temperature": 22, "minibar": ["sparkling water", "red wine"], "newspaper": "Wall Street Journal"}', 'Frequent business traveler, prefers quiet rooms'),
      ('Yuki Tanaka', 'yuki.tanaka@email.jp', '+81-90-1234-5678', 'Japanese', 'platinum', 25, '{"room_type": "Suite", "floor": "high", "tea": "green tea", "slippers": true, "bathrobe": "cotton", "language": "Japanese"}', 'VIP guest, always books suites, tea ceremony enthusiast'),
      ('Marie Dupont', 'marie.dupont@email.fr', '+33-6-12-34-56-78', 'French', 'standard', 3, '{"room_type": "Standard", "breakfast": "continental", "wine": "French wines only"}', 'Leisure traveler, wine connoisseur'),
      ('Hans Mueller', 'hans.mueller@email.de', '+49-170-1234567', 'German', 'silver', 8, '{"room_type": "Deluxe", "breakfast": "full buffet", "gym": true, "newspaper": "Frankfurter Allgemeine"}', 'Business traveler, early riser, gym every morning'),
      ('Priya Sharma', 'priya.sharma@email.in', '+91-98765-43210', 'Indian', 'gold', 15, '{"room_type": "Suite", "dietary": "vegetarian", "yoga_mat": true, "ayurvedic_spa": true}', 'Wellness-focused guest, vegetarian meals required'),
      ('Carlos Rodriguez', 'carlos.rodriguez@email.mx', '+52-55-1234-5678', 'Mexican', 'standard', 2, '{"room_type": "Standard", "late_checkout": true, "minibar": ["tequila", "lime"]}', 'Leisure traveler with family'),
      ('Sophie Williams', 'sophie.williams@email.co.uk', '+44-7700-900123', 'British', 'platinum', 30, '{"room_type": "Presidential", "afternoon_tea": true, "champagne": "Moet", "butler": true}', 'Top VIP, always presidential suite, birthday in June'),
      ('Ahmed Al-Rashid', 'ahmed.alrashid@email.ae', '+971-50-123-4567', 'Emirati', 'gold', 10, '{"room_type": "Suite", "halal": true, "prayer_mat": true, "direction_mecca": true, "no_alcohol": true}', 'Requires halal dining options and prayer amenities'),
      ('Elena Petrova', 'elena.petrova@email.ru', '+7-916-123-45-67', 'Russian', 'silver', 6, '{"room_type": "Deluxe", "spa": true, "champagne": true, "late_checkout": true}', 'Loves spa treatments, usually extends stay'),
      ('Li Wei', 'li.wei@email.cn', '+86-138-1234-5678', 'Chinese', 'gold', 18, '{"room_type": "Suite", "tea": "oolong", "hot_water_kettle": true, "chinese_channels": true, "slippers": true}', 'Business executive, prefers Chinese dining options'),
      ('Isabella Rossi', 'isabella.rossi@email.it', '+39-333-123-4567', 'Italian', 'standard', 4, '{"room_type": "Deluxe", "espresso_machine": true, "breakfast": "Italian style"}', 'Fashion industry, requires express laundry'),
      ('James O''Brien', 'james.obrien@email.ie', '+353-87-123-4567', 'Irish', 'standard', 1, '{"room_type": "Standard", "pub_recommendations": true}', 'First-time guest, honeymoon trip'),
      ('Fatima Hassan', 'fatima.hassan@email.eg', '+20-10-1234-5678', 'Egyptian', 'silver', 7, '{"room_type": "Deluxe", "halal": true, "family_connecting_rooms": true}', 'Family traveler, needs connecting rooms'),
      ('Alexander Kim', 'alex.kim@email.kr', '+82-10-1234-5678', 'Korean', 'gold', 14, '{"room_type": "Suite", "korean_channels": true, "kimchi": true, "skincare_amenities": true}', 'Tech industry executive, long stays'),
      ('Ana Santos', 'ana.santos@email.br', '+55-11-98765-4321', 'Brazilian', 'standard', 5, '{"room_type": "Deluxe", "pool_access": true, "tropical_fruits": true, "music": "bossa nova"}', 'Annual vacation guest, brings family')
    `);

    console.log('Seeding housekeeping tasks...');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    await client.query(`
      INSERT INTO housekeeping_tasks (room_number, task_type, assigned_to, priority, status, scheduled_date, scheduled_time, estimated_duration, notes) VALUES
      ('101', 'Deep Clean', 'Maria Garcia', 'high', 'in_progress', $1, '08:00', 60, 'Guest checking in at 2 PM, VIP prep needed'),
      ('102', 'Standard Clean', 'Lisa Anderson', 'medium', 'pending', $1, '09:00', 30, 'Regular turnover cleaning'),
      ('201', 'Turndown Service', 'Maria Garcia', 'low', 'completed', $1, '18:00', 15, 'Evening turndown with chocolates'),
      ('202', 'Maintenance Check', 'Kevin Clark', 'high', 'pending', $1, '10:00', 45, 'AC unit needs inspection'),
      ('301', 'Deep Clean', 'Lisa Anderson', 'high', 'pending', $1, '11:00', 90, 'Suite deep clean, check minibar'),
      ('302', 'Linen Change', 'Maria Garcia', 'medium', 'completed', $2, '08:30', 20, 'Fresh linen replacement'),
      ('303', 'Standard Clean', 'Lisa Anderson', 'medium', 'in_progress', $1, '09:30', 30, 'Guest extended stay, light clean'),
      ('401', 'VIP Preparation', 'Maria Garcia', 'high', 'pending', $3, '14:00', 120, 'Presidential suite VIP arrival prep'),
      ('103', 'Bathroom Restock', 'Lisa Anderson', 'low', 'completed', $2, '07:00', 10, 'Restock toiletries and towels'),
      ('104', 'Standard Clean', 'Maria Garcia', 'medium', 'pending', $1, '10:30', 30, 'Regular checkout cleaning'),
      ('105', 'Carpet Cleaning', 'Kevin Clark', 'medium', 'pending', $3, '13:00', 45, 'Wine stain on carpet'),
      ('203', 'Standard Clean', 'Lisa Anderson', 'medium', 'pending', $1, '11:30', 35, 'Turnover clean'),
      ('204', 'Deep Clean', 'Maria Garcia', 'high', 'pending', $3, '09:00', 75, 'Post long-stay deep clean'),
      ('106', 'Standard Clean', 'Lisa Anderson', 'medium', 'in_progress', $1, '08:00', 30, 'Quick turnaround needed'),
      ('304', 'Minibar Restock', 'Kevin Clark', 'low', 'pending', $1, '16:00', 15, 'Restock premium spirits and snacks')
    `, [today, yesterday, tomorrow]);

    console.log('Seeding upsell rules...');
    await client.query(`
      INSERT INTO upsell_rules (name, category, target_segment, trigger_event, offer_description, discount_percent, revenue_potential, success_rate, is_active) VALUES
      ('Room Upgrade - Deluxe', 'room_upgrade', 'standard_guests', 'check-in', 'Upgrade from Standard to Deluxe room with balcony and city view', 10.00, 80.00, 35.00, true),
      ('Room Upgrade - Suite', 'room_upgrade', 'deluxe_guests', 'check-in', 'Upgrade from Deluxe to Suite with living area and premium amenities', 15.00, 150.00, 22.00, true),
      ('Spa Package', 'spa', 'all', 'post-booking', 'Relaxation spa package: 60-min massage, facial, and pool access', 20.00, 120.00, 28.00, true),
      ('Romantic Dinner', 'dining', 'couples', 'check-in', 'Candlelit dinner for two at rooftop restaurant with wine pairing', 0.00, 95.00, 40.00, true),
      ('Late Checkout', 'convenience', 'all', 'day-before-checkout', 'Extend your stay until 2 PM for a relaxed departure', 0.00, 50.00, 55.00, true),
      ('Airport Transfer', 'transportation', 'all', 'pre-arrival', 'Private luxury car airport transfer service', 5.00, 75.00, 30.00, true),
      ('Breakfast Package', 'dining', 'room_only_guests', 'check-in', 'Full buffet breakfast for your entire stay', 10.00, 35.00, 48.00, true),
      ('City Tour', 'experience', 'leisure', 'check-in', 'Guided half-day city tour with local expert', 15.00, 65.00, 18.00, true),
      ('Wine Tasting', 'dining', 'couples', 'during-stay', 'Premium wine tasting experience in hotel cellar', 0.00, 55.00, 25.00, true),
      ('Gym & Wellness Pass', 'wellness', 'business', 'check-in', 'Full access to gym, sauna, and wellness center', 0.00, 25.00, 42.00, true),
      ('Kids Club', 'family', 'families', 'check-in', 'Full-day kids club with activities and lunch included', 10.00, 45.00, 60.00, true),
      ('Anniversary Package', 'special_occasion', 'returning', 'pre-arrival', 'Champagne, flowers, and chocolate in room for special celebration', 0.00, 85.00, 32.00, true),
      ('Business Center Access', 'business', 'corporate', 'check-in', 'Private meeting room and business services for 4 hours', 0.00, 60.00, 38.00, true),
      ('Minibar Premium Upgrade', 'amenity', 'suite_guests', 'check-in', 'Upgrade minibar with premium spirits and artisan snacks', 0.00, 40.00, 45.00, true),
      ('Photography Session', 'experience', 'couples', 'during-stay', 'Professional 1-hour photography session at scenic hotel spots', 20.00, 90.00, 15.00, true)
    `);

    console.log('Seeding reservations...');
    await client.query(`
      INSERT INTO reservations (guest_name, guest_email, room_number, room_type, check_in, check_out, nights, total_price, channel, status, special_requests) VALUES
      ('John Smith', 'john.smith@email.com', '201', 'Deluxe', '2026-03-18', '2026-03-21', 3, 600.00, 'Direct Website', 'checked-in', 'Quiet room, high floor, firm pillows'),
      ('Yuki Tanaka', 'yuki.tanaka@email.jp', '301', 'Suite', '2026-03-19', '2026-03-25', 6, 2100.00, 'Direct Website', 'confirmed', 'Green tea in room, Japanese newspaper'),
      ('Marie Dupont', 'marie.dupont@email.fr', '103', 'Standard', '2026-03-20', '2026-03-23', 3, 420.00, 'Booking.com', 'confirmed', 'Continental breakfast, French wine in minibar'),
      ('Hans Mueller', 'hans.mueller@email.de', '203', 'Deluxe', '2026-03-17', '2026-03-20', 3, 660.00, 'Expedia', 'checked-in', 'Gym access, early breakfast at 6 AM'),
      ('Priya Sharma', 'priya.sharma@email.in', '303', 'Suite', '2026-03-16', '2026-03-22', 6, 2280.00, 'Direct Website', 'checked-in', 'Vegetarian meals only, yoga mat in room'),
      ('Sophie Williams', 'sophie.williams@email.co.uk', '401', 'Presidential', '2026-03-22', '2026-03-28', 6, 4800.00, 'Phone Reservations', 'confirmed', 'Champagne on arrival, butler service, afternoon tea daily'),
      ('Carlos Rodriguez', 'carlos.rodriguez@email.mx', '101', 'Standard', '2026-03-14', '2026-03-18', 4, 480.00, 'Booking.com', 'completed', 'Late checkout requested'),
      ('Ahmed Al-Rashid', 'ahmed.alrashid@email.ae', '302', 'Suite', '2026-03-21', '2026-03-26', 5, 2000.00, 'Agoda', 'confirmed', 'Halal dining, prayer mat, Mecca direction indicator'),
      ('Elena Petrova', 'elena.petrova@email.ru', '204', 'Deluxe', '2026-03-19', '2026-03-23', 4, 840.00, 'Hotels.com', 'confirmed', 'Spa booking, champagne in room'),
      ('Li Wei', 'li.wei@email.cn', '304', 'Suite', '2026-03-15', '2026-03-19', 4, 1680.00, 'Corporate Portal', 'checked-in', 'Chinese TV channels, hot water kettle, oolong tea'),
      ('Isabella Rossi', 'isabella.rossi@email.it', '102', 'Standard', '2026-03-13', '2026-03-16', 3, 360.00, 'Expedia', 'completed', 'Express laundry service needed'),
      ('Alexander Kim', 'alex.kim@email.kr', '203', 'Deluxe', '2026-03-23', '2026-03-30', 7, 1540.00, 'Booking.com', 'confirmed', 'Extended stay, Korean channels, skincare amenities'),
      ('Ana Santos', 'ana.santos@email.br', '302', 'Suite', '2026-03-28', '2026-04-02', 5, 2100.00, 'Direct Website', 'confirmed', 'Pool access, tropical fruits daily'),
      ('James O''Brien', 'james.obrien@email.ie', '105', 'Standard', '2026-03-19', '2026-03-22', 3, 285.00, 'Airbnb', 'confirmed', 'Honeymoon, romantic setup if possible'),
      ('Fatima Hassan', 'fatima.hassan@email.eg', '201', 'Deluxe', '2026-03-25', '2026-03-29', 4, 800.00, 'TripAdvisor', 'confirmed', 'Connecting rooms for family, halal meals')
    `);

    console.log('Seeding analytics...');
    const analyticsValues = [];
    const analyticsParams = [];
    let paramIndex = 1;

    for (let i = 0; i < 20; i++) {
      const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      const revenue = (8000 + Math.random() * 7000).toFixed(2);
      const occupancy = (55 + Math.random() * 35).toFixed(2);
      const adr = (180 + Math.random() * 120).toFixed(2);
      const revpar = (occupancy / 100 * adr).toFixed(2);
      const channels = ['Booking.com', 'Expedia', 'Direct Website', 'Hotels.com', 'Agoda'];
      const channel = channels[i % channels.length];
      const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Presidential', 'all'];
      const roomType = roomTypes[i % roomTypes.length];
      const bookings = Math.floor(5 + Math.random() * 15);
      const cancellations = Math.floor(Math.random() * 3);

      analyticsValues.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6}, $${paramIndex+7}, $${paramIndex+8}, $${paramIndex+9})`);
      analyticsParams.push(date, revenue, occupancy, adr, revpar, channel, roomType, bookings, cancellations, `Daily analytics for ${date}`);
      paramIndex += 10;
    }

    await client.query(
      `INSERT INTO analytics (date, revenue, occupancy_rate, adr, revpar, channel, room_type, total_bookings, cancellations, notes) VALUES ${analyticsValues.join(', ')}`,
      analyticsParams
    );

    console.log('Seeding reviews...');
    await client.query(`
      INSERT INTO reviews (guest_name, room_number, rating, title, comment, sentiment, stay_date, response) VALUES
      ('John Smith', '201', 5, 'Excellent Business Stay', 'Wonderful experience as always. The room was immaculate, staff remembered my preferences, and the WiFi was lightning fast. The firm pillows I requested were already in the room. Top-notch service!', 'positive', '2026-03-10', 'Thank you, Mr. Smith! We always look forward to welcoming you back.'),
      ('Marie Dupont', '103', 4, 'Charming Hotel, Minor Issues', 'Beautiful hotel with great character. The breakfast was superb with real French pastries. Only issue was some noise from the street at night. Would recommend asking for a room facing the garden.', 'positive', '2026-03-08', 'Merci, Marie! We will note your preference for a quieter room next time.'),
      ('Carlos Rodriguez', '101', 2, 'Disappointing Experience', 'Room was smaller than expected from the photos. The air conditioning was noisy and the minibar was not fully stocked. Front desk was unhelpful when I complained. Expected better for the price.', 'negative', '2026-03-05', 'We sincerely apologize for the inconvenience, Mr. Rodriguez. We are addressing these issues.'),
      ('Priya Sharma', '303', 5, 'Perfect Wellness Retreat', 'The suite was absolutely gorgeous. They arranged a yoga mat and vegetarian meals without me having to ask twice. The spa was incredible. This hotel truly understands personalized service.', 'positive', '2026-03-12', 'Namaste, Ms. Sharma! We are delighted you enjoyed your wellness experience.'),
      ('Hans Mueller', '203', 4, 'Good for Business Travel', 'Efficient check-in, excellent gym facilities, and the breakfast buffet had great variety. Room was clean and comfortable. The desk area could be larger for working. Good business hotel overall.', 'positive', '2026-03-07', 'Thank you, Mr. Mueller. We value your feedback about the desk area.'),
      ('Sophie Williams', '401', 5, 'Absolutely Outstanding', 'The Presidential Suite exceeded all expectations. Butler James was exceptional. The afternoon tea service was impeccable, and the champagne upon arrival was a lovely touch. Pure luxury at its finest!', 'positive', '2026-03-01', 'Lady Williams, it was our absolute pleasure hosting you. We eagerly await your return.'),
      ('Elena Petrova', '204', 3, 'Mixed Feelings', 'The spa was amazing and the room had a beautiful view. However, the check-in process was slow and the room service took over an hour. The bed was comfortable but the bathroom could use an update.', 'neutral', '2026-03-06', 'Thank you for your honest feedback, Ms. Petrova. We are working to improve our service times.'),
      ('Li Wei', '304', 4, 'Great Suite, Good Service', 'The executive suite was spacious and well-appointed. Appreciated the Chinese TV channels and the oolong tea selection. The business center was well-equipped. Minor issue with housekeeping timing.', 'positive', '2026-03-09', 'Thank you, Mr. Li. We will adjust housekeeping schedules for your next visit.'),
      ('James O''Brien', '105', 3, 'Decent but Basic', 'Good location and friendly staff. The room was clean but quite basic for a honeymoon trip. We expected more romantic touches. The bed was comfortable though, and the breakfast was good.', 'neutral', '2026-03-11', 'Congratulations on your wedding! We apologize for not meeting honeymoon expectations.'),
      ('Isabella Rossi', '102', 4, 'Stylish and Comfortable', 'Loved the design of the hotel. The espresso machine in the room was a wonderful touch. The express laundry service saved me during fashion week. Would definitely return.', 'positive', '2026-03-04', 'Grazie, Ms. Rossi! We are glad our services suited your busy schedule.'),
      ('Alexander Kim', '203', 5, 'Home Away From Home', 'After 14 stays, this hotel still impresses me. The staff knows exactly what I need. The skincare amenities were premium quality. The extended stay rate was very reasonable. My go-to hotel.', 'positive', '2026-03-03', 'We are honored by your loyalty, Mr. Kim. Your comfort is our priority.'),
      ('Fatima Hassan', '201', 4, 'Family-Friendly Excellence', 'Traveling with kids can be stressful, but this hotel made it easy. The connecting rooms were perfect, and the halal meal options were authentic and delicious. Kids loved the pool area.', 'positive', '2026-03-02', 'Thank you, Mrs. Hassan! We love welcoming families and are glad the kids enjoyed it.'),
      ('Ana Santos', '302', 3, 'Good but Overpriced', 'The suite was nice and the pool area was fantastic. Loved the tropical fruit basket. However, I felt the pricing was a bit high for what you get. The minibar prices were especially steep.', 'neutral', '2026-02-28', 'Thank you for your feedback, Ms. Santos. We are reviewing our pricing structure.'),
      ('Ahmed Al-Rashid', '302', 5, 'Exceptional Cultural Sensitivity', 'Truly impressed by how well this hotel accommodates our cultural needs. The prayer mat and Mecca direction were already set up. Halal dining options were extensive and authentic. First-class service.', 'positive', '2026-02-25', 'Shukran, Mr. Al-Rashid. Cultural sensitivity is a cornerstone of our hospitality.'),
      ('Guest Anonymous', '106', 1, 'Terrible Night', 'Worst hotel experience ever. Room was not cleaned properly, found hair in the bathroom. The heating did not work and nobody came to fix it despite calling three times. Will never return.', 'negative', '2026-02-20', 'We are deeply sorry for this unacceptable experience. Our GM would like to discuss this with you directly.')
    `);

    console.log('Seeding staff...');
    await client.query(`
      INSERT INTO staff (name, email, phone, role, department, shift, status, hire_date, salary, performance_score, notes) VALUES
      ('Sarah Johnson', 'sarah.j@hotel.com', '+1-555-0201', 'Manager', 'Front Office', 'Morning', 'Active', '2020-03-15', 65000.00, 92.50, 'Experienced front office manager, excellent leadership skills'),
      ('Mike Chen', 'mike.c@hotel.com', '+1-555-0202', 'Receptionist', 'Front Office', 'Morning', 'Active', '2021-06-01', 38000.00, 88.00, 'Bilingual English/Mandarin, great with VIP guests'),
      ('Maria Garcia', 'maria.g@hotel.com', '+1-555-0203', 'Housekeeper', 'Housekeeping', 'Morning', 'Active', '2019-08-20', 32000.00, 95.00, 'Most reliable housekeeper, specializes in suite preparation'),
      ('David Martinez', 'david.m@hotel.com', '+1-555-0204', 'Concierge', 'Guest Services', 'Afternoon', 'Active', '2022-01-10', 42000.00, 90.00, 'Extensive local knowledge, great restaurant connections'),
      ('Emily Davis', 'emily.d@hotel.com', '+1-555-0205', 'Chef', 'Food & Beverage', 'Morning', 'Active', '2018-05-12', 55000.00, 87.50, 'Executive chef, specializes in international cuisine'),
      ('Robert Wilson', 'robert.w@hotel.com', '+1-555-0206', 'Maintenance', 'Engineering', 'Morning', 'Active', '2020-11-03', 40000.00, 85.00, 'HVAC certified, handles most technical issues'),
      ('Lisa Anderson', 'lisa.a@hotel.com', '+1-555-0207', 'Housekeeper', 'Housekeeping', 'Afternoon', 'Active', '2021-03-22', 31000.00, 82.00, 'Detail-oriented, good with deep cleaning tasks'),
      ('James Brown', 'james.b@hotel.com', '+1-555-0208', 'Security', 'Security', 'Night', 'Active', '2019-12-01', 36000.00, 91.00, 'Former law enforcement, handles night security'),
      ('Jennifer Taylor', 'jennifer.t@hotel.com', '+1-555-0209', 'Receptionist', 'Front Office', 'Night', 'Active', '2022-07-15', 37000.00, 86.00, 'Night audit specialist, very detail-oriented'),
      ('Kevin Clark', 'kevin.c@hotel.com', '+1-555-0210', 'Bellboy', 'Guest Services', 'Morning', 'Active', '2023-02-01', 28000.00, 79.00, 'Enthusiastic, good with luggage and guest assistance'),
      ('Nicole Harris', 'nicole.h@hotel.com', '+1-555-0211', 'Manager', 'Food & Beverage', 'Afternoon', 'Active', '2019-04-10', 58000.00, 93.00, 'F&B manager, excellent wine knowledge'),
      ('Thomas Lee', 'thomas.l@hotel.com', '+1-555-0212', 'Chef', 'Food & Beverage', 'Afternoon', 'Active', '2021-09-05', 48000.00, 84.00, 'Pastry chef, handles dessert menu and afternoon tea'),
      ('Amanda White', 'amanda.w@hotel.com', '+1-555-0213', 'Concierge', 'Guest Services', 'Morning', 'On Leave', '2020-06-18', 41000.00, 89.00, 'On maternity leave, returns next month'),
      ('Chris Robinson', 'chris.r@hotel.com', '+1-555-0214', 'Maintenance', 'Engineering', 'Afternoon', 'Active', '2022-04-20', 38000.00, 81.00, 'Electrician certified, plumbing skills'),
      ('Patricia Moore', 'patricia.m@hotel.com', '+1-555-0215', 'Housekeeper', 'Housekeeping', 'Night', 'Off Duty', '2023-01-08', 30000.00, 76.00, 'Night turndown service specialist'),
      ('Daniel Jackson', 'daniel.j@hotel.com', '+1-555-0216', 'Security', 'Security', 'Afternoon', 'Active', '2021-11-15', 35000.00, 88.50, 'CPR certified, handles daytime security and parking')
    `);

    console.log('Seeding promotions...');
    await client.query(`
      INSERT INTO promotions (name, type, description, discount_percent, min_nights, max_nights, valid_from, valid_until, applicable_room_types, promo_code, is_active, times_used, revenue_generated) VALUES
      ('Summer Escape', 'Seasonal', 'Enjoy sunny days with our summer special rate including breakfast and pool access', 20.00, 3, 14, '2026-06-01', '2026-08-31', 'All', 'SUMMER26', true, 145, 52000.00),
      ('Weekend Getaway', 'Weekend', 'Friday to Sunday special with complimentary late checkout and welcome drink', 15.00, 2, 3, '2026-01-01', '2026-12-31', 'Standard,Deluxe', 'WKND15', true, 230, 38000.00),
      ('Holiday Magic', 'Holiday', 'Christmas and New Year special package with festive dinner and decorations', 10.00, 2, 10, '2026-12-20', '2027-01-05', 'All', 'HOLIDAY26', true, 0, 0.00),
      ('Early Bird Saver', 'Early Bird', 'Book 30+ days in advance and save big on any room type', 25.00, 1, 30, '2026-01-01', '2026-12-31', 'All', 'EARLY25', true, 312, 89000.00),
      ('Last Minute Deal', 'Last Minute', 'Book within 48 hours of stay for exclusive last-minute savings', 30.00, 1, 3, '2026-01-01', '2026-12-31', 'Standard,Deluxe', 'LASTMIN30', true, 178, 24000.00),
      ('Romantic Package', 'Package', 'Suite with champagne, rose petals, couples spa treatment and candlelit dinner', 0.00, 2, 5, '2026-01-01', '2026-12-31', 'Suite,Presidential', 'ROMANCE', true, 67, 45000.00),
      ('Loyalty Platinum Reward', 'Loyalty', 'Exclusive rate for platinum loyalty members with complimentary upgrade', 20.00, 1, 30, '2026-01-01', '2026-12-31', 'All', 'PLAT20', true, 89, 62000.00),
      ('Business Traveler', 'Package', 'Weekday rate with breakfast, WiFi premium, and meeting room access', 10.00, 1, 14, '2026-01-01', '2026-12-31', 'Deluxe,Suite', 'BIZ10', true, 256, 71000.00),
      ('Spring Bloom', 'Seasonal', 'Spring special with garden view room and afternoon tea included', 15.00, 2, 7, '2026-03-01', '2026-05-31', 'Deluxe,Suite', 'SPRING15', true, 98, 33000.00),
      ('Family Fun', 'Package', 'Family package with kids eat free, connecting rooms, and activity passes', 12.00, 3, 10, '2026-01-01', '2026-12-31', 'Standard,Deluxe', 'FAMILY12', true, 134, 41000.00),
      ('Loyalty Gold Reward', 'Loyalty', 'Special rate for gold loyalty members with welcome amenity', 15.00, 1, 30, '2026-01-01', '2026-12-31', 'All', 'GOLD15', true, 156, 48000.00),
      ('Extended Stay', 'Package', 'Stay 7+ nights and receive daily housekeeping and laundry credit', 18.00, 7, 30, '2026-01-01', '2026-12-31', 'All', 'EXTEND18', true, 45, 67000.00),
      ('Winter Warmth', 'Seasonal', 'Winter getaway with fireplace suite, hot cocoa bar, and spa access', 15.00, 2, 10, '2026-11-01', '2027-02-28', 'Suite,Presidential', 'WINTER15', true, 72, 54000.00),
      ('Flash Sale Friday', 'Last Minute', 'Every Friday flash sale with deep discounts for same-weekend stays', 35.00, 1, 2, '2026-01-01', '2026-12-31', 'Standard', 'FLASH35', true, 89, 12000.00),
      ('Anniversary Special', 'Package', 'Celebrate your anniversary with suite upgrade, dinner, and photo session', 0.00, 2, 5, '2026-01-01', '2026-12-31', 'Suite,Presidential', 'ANNIV', true, 34, 28000.00),
      ('Midweek Saver', 'Weekend', 'Tuesday to Thursday special with complimentary breakfast', 20.00, 2, 3, '2026-01-01', '2026-12-31', 'Standard,Deluxe', 'MIDWK20', true, 167, 29000.00)
    `);

    console.log('Seeding competitors...');
    await client.query(`
      INSERT INTO competitors (name, location, star_rating, avg_rate, our_rate, rate_difference, occupancy_estimate, strengths, weaknesses, last_checked, source, notes) VALUES
      ('Grand Plaza Hotel', '0.5 miles downtown', 5, 320.00, 280.00, -40.00, 78.00, 'Luxury brand recognition, rooftop bar, Michelin restaurant', 'Higher prices, older renovation, slow check-in process', '2026-03-18', 'Booking.com', 'Main luxury competitor, targets high-end corporate'),
      ('City Center Inn', '0.3 miles east', 3, 110.00, 120.00, 10.00, 85.00, 'Budget-friendly, central location, large room inventory', 'Basic amenities, no restaurant, limited services', '2026-03-18', 'Expedia', 'Competes on price for budget travelers'),
      ('Harbor View Resort', '1.2 miles waterfront', 4, 250.00, 220.00, -30.00, 72.00, 'Ocean views, beach access, large pool area, spa', 'Further from city center, limited dining options', '2026-03-17', 'Hotels.com', 'Strong leisure competitor, seasonal demand'),
      ('The Metropolitan', '0.8 miles north', 4, 230.00, 220.00, -10.00, 80.00, 'Modern design, tech-forward rooms, co-working spaces', 'Small rooms, no pool, limited parking', '2026-03-18', 'TripAdvisor', 'Growing business hotel brand, aggressive marketing'),
      ('Comfort Suites Downtown', '0.4 miles south', 3, 140.00, 140.00, 0.00, 82.00, 'All-suite property, free breakfast, parking included', 'Chain hotel feel, average service, no unique character', '2026-03-16', 'Booking.com', 'Mid-range competitor, strong with families'),
      ('Boutique Hotel Maison', '0.2 miles west', 4, 280.00, 260.00, -20.00, 68.00, 'Unique design, personalized service, local art gallery', 'Only 30 rooms, no gym, limited availability', '2026-03-18', 'Direct website', 'Boutique competitor, targets experience seekers'),
      ('Skyline Tower Hotel', '1.0 miles downtown', 5, 350.00, 280.00, -70.00, 75.00, 'Iconic building, panoramic views, celebrity clientele', 'Very expensive, pretentious atmosphere, dated rooms', '2026-03-15', 'Agoda', 'Luxury landmark, less direct competition'),
      ('EcoStay Green Hotel', '0.6 miles east', 3, 130.00, 120.00, -10.00, 70.00, 'Eco-certified, sustainable practices, organic restaurant', 'Limited luxury amenities, small rooms, no room service', '2026-03-17', 'Booking.com', 'Appeals to eco-conscious travelers'),
      ('Business Park Hotel', '1.5 miles airport road', 4, 190.00, 200.00, 10.00, 88.00, 'Airport shuttle, large conference center, corporate rates', 'Far from attractions, no character, highway noise', '2026-03-18', 'Corporate portal', 'Strong corporate competitor near business district'),
      ('Heritage Palace Hotel', '0.7 miles old town', 4, 260.00, 240.00, -20.00, 65.00, 'Historic building, elegant decor, award-winning restaurant', 'No modern gym, slow WiFi, difficult parking', '2026-03-16', 'TripAdvisor', 'Heritage tourism competitor'),
      ('Budget Express Hotel', '0.9 miles south', 2, 75.00, 120.00, 45.00, 90.00, 'Cheapest in area, clean rooms, 24/7 reception', 'Very basic, no restaurant, no amenities', '2026-03-18', 'Booking.com', 'Not direct competitor but captures budget market'),
      ('Seaside Wellness Retreat', '2.0 miles coast', 4, 300.00, 250.00, -50.00, 60.00, 'Full spa, wellness programs, yoga classes, healthy dining', 'Remote location, limited nightlife access, seasonal', '2026-03-15', 'Hotels.com', 'Wellness tourism competitor, niche market'),
      ('Central Station Hotel', '0.1 miles station', 3, 150.00, 140.00, -10.00, 83.00, 'Best location for transit, modern renovations, rooftop bar', 'Train noise, small lobby, no pool', '2026-03-18', 'Expedia', 'Location advantage for transit travelers'),
      ('Royal Gardens Hotel', '0.5 miles park district', 4, 240.00, 230.00, -10.00, 74.00, 'Beautiful gardens, family-friendly, cooking classes', 'Older property, slow renovation pace, inconsistent service', '2026-03-17', 'Booking.com', 'Good family and leisure competitor'),
      ('Tech Hub Hotel', '1.3 miles tech district', 4, 210.00, 200.00, -10.00, 77.00, 'Smart rooms, app-controlled, fast WiFi, gaming lounge', 'Impersonal service, no traditional dining, young crowd only', '2026-03-18', 'Direct website', 'Targets tech-savvy younger demographic')
    `);

    console.log('Seeding maintenance requests...');
    await client.query(`
      INSERT INTO maintenance_requests (room_number, category, title, description, reported_by, assigned_to, priority, status, estimated_cost, actual_cost, reported_date, completed_date, notes) VALUES
      ('202', 'HVAC', 'AC unit not cooling', 'Guest reported that the air conditioning is blowing warm air. Thermostat shows correct setting but room temperature is 28C.', 'Front Desk', 'Robert Wilson', 'Critical', 'In Progress', 450.00, 0.00, $1, null, 'Technician inspecting compressor unit'),
      ('106', 'Plumbing', 'Bathroom faucet dripping', 'Persistent drip from bathroom sink faucet. Washer likely needs replacement.', 'Housekeeping', 'Chris Robinson', 'Low', 'Open', 25.00, 0.00, $1, null, 'Standard faucet repair'),
      ('301', 'Electrical', 'Bedside lamp flickering', 'Left bedside lamp flickers intermittently. May be a wiring issue or faulty bulb socket.', 'Guest', 'Robert Wilson', 'Medium', 'Open', 80.00, 0.00, $1, null, 'Check wiring before replacing fixture'),
      ('103', 'Furniture', 'Desk chair wobbly', 'Office desk chair has a loose leg and wobbles when sitting. Safety concern.', 'Housekeeping', 'Chris Robinson', 'Medium', 'Awaiting Parts', 120.00, 0.00, $2, null, 'Replacement chair ordered from supplier'),
      ('401', 'Appliance', 'Minibar refrigerator noise', 'Presidential suite minibar making loud humming noise at night. Guest complained.', 'Concierge', 'Robert Wilson', 'High', 'In Progress', 300.00, 0.00, $1, null, 'VIP suite - priority repair needed'),
      ('204', 'Cosmetic', 'Wall paint peeling', 'Paint peeling near bathroom door frame due to humidity. Approximately 2 sq ft area affected.', 'Housekeeping', 'Chris Robinson', 'Low', 'Open', 50.00, 0.00, $2, null, 'Schedule during next vacancy'),
      ('105', 'Plumbing', 'Toilet running continuously', 'Toilet cistern not stopping water flow after flush. Flapper valve likely needs replacement.', 'Guest', 'Robert Wilson', 'High', 'Completed', 35.00, 30.00, $3, $2, 'Replaced flapper valve and fill valve'),
      ('302', 'Safety', 'Smoke detector beeping', 'Smoke detector giving low battery warning beep every 30 seconds.', 'Night Staff', 'Robert Wilson', 'Critical', 'Completed', 15.00, 12.00, $3, $3, 'Battery replaced and unit tested'),
      ('201', 'Electrical', 'Power outlet not working', 'Right-side power outlet near desk is dead. No power to any device plugged in.', 'Guest', 'Chris Robinson', 'Medium', 'Open', 100.00, 0.00, $1, null, 'May need electrician for outlet replacement'),
      ('303', 'HVAC', 'Heating thermostat malfunction', 'Digital thermostat display is blank. Cannot control room temperature.', 'Front Desk', 'Robert Wilson', 'High', 'In Progress', 200.00, 0.00, $1, null, 'Replacement thermostat being installed'),
      ('104', 'Structural', 'Window seal broken', 'Cold draft coming through bedroom window. Seal around window frame has deteriorated.', 'Guest', 'Chris Robinson', 'Medium', 'Awaiting Parts', 250.00, 0.00, $3, null, 'Custom window seal ordered'),
      ('203', 'Furniture', 'Wardrobe door off track', 'Sliding wardrobe door has come off its track. Cannot open or close properly.', 'Housekeeping', 'Chris Robinson', 'Low', 'Open', 60.00, 0.00, $1, null, 'Realign track and rollers'),
      ('304', 'Appliance', 'Coffee machine error', 'In-room coffee machine displaying error E04. Will not brew.', 'Guest', 'Robert Wilson', 'Medium', 'Completed', 0.00, 0.00, $3, $2, 'Descaled machine and reset - working now'),
      ('101', 'Cosmetic', 'Carpet stain near entrance', 'Large red wine stain on carpet near room entrance. Regular cleaning did not remove it.', 'Housekeeping', 'Lisa Anderson', 'Low', 'Open', 150.00, 0.00, $2, null, 'Professional carpet cleaning needed'),
      ('102', 'Safety', 'Door lock sticking', 'Electronic door lock occasionally fails to respond to key card. Intermittent issue.', 'Front Desk', 'Robert Wilson', 'High', 'In Progress', 180.00, 0.00, $1, null, 'Lock mechanism being replaced today'),
      ('205', 'Plumbing', 'Shower drain slow', 'Shower draining very slowly, water pooling during use. Likely hair/debris blockage.', 'Housekeeping', 'Chris Robinson', 'Medium', 'Completed', 20.00, 15.00, $3, $1, 'Drain cleared with snake tool')
    `, [today, yesterday, new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]]);

    console.log('Seeding forecasts...');
    const forecastValues = [];
    const forecastParams = [];
    let forecastParamIndex = 1;

    for (let i = 1; i <= 18; i++) {
      const forecastDate = new Date(Date.now() + i * 86400000).toISOString().split('T')[0];
      const isWeekend = [0, 5, 6].includes(new Date(Date.now() + i * 86400000).getDay());
      const baseOccupancy = isWeekend ? 80 : 65;
      const predictedOccupancy = (baseOccupancy + Math.random() * 15).toFixed(2);
      const predictedAdr = isWeekend ? (220 + Math.random() * 60).toFixed(2) : (180 + Math.random() * 40).toFixed(2);
      const predictedRevenue = (predictedOccupancy / 100 * 15 * predictedAdr).toFixed(2);
      const confidence = (0.70 + Math.random() * 0.25).toFixed(2);
      const factors = isWeekend
        ? 'Weekend demand surge, leisure travelers, local events'
        : 'Weekday business travel, corporate bookings, conference season';
      const notes = `AI-generated forecast for ${forecastDate}`;

      forecastValues.push(`($${forecastParamIndex}, $${forecastParamIndex+1}, $${forecastParamIndex+2}, $${forecastParamIndex+3}, $${forecastParamIndex+4}, $${forecastParamIndex+5}, $${forecastParamIndex+6}, $${forecastParamIndex+7})`);
      forecastParams.push(forecastDate, 'Daily', predictedOccupancy, predictedRevenue, predictedAdr, confidence, factors, notes);
      forecastParamIndex += 8;
    }

    await client.query(
      `INSERT INTO forecasts (forecast_date, period, predicted_occupancy, predicted_revenue, predicted_adr, confidence_score, factors, notes) VALUES ${forecastValues.join(', ')}`,
      forecastParams
    );

    console.log('Seeding invoices...');
    await client.query(`
      INSERT INTO invoices (invoice_number, reservation_id, guest_name, guest_email, room_number, check_in, check_out, nights, room_charges, tax_rate, tax_amount, additional_charges, discounts, total_amount, payment_method, payment_status, notes) VALUES
      ('INV-001', 1, 'John Smith', 'john@email.com', '101', '2025-12-15', '2025-12-18', 3, 450.00, 10, 45.00, 25.00, 0, 520.00, 'Credit Card', 'Paid', 'Room service included'),
      ('INV-002', 2, 'Maria Garcia', 'maria@email.com', '205', '2025-12-20', '2025-12-25', 5, 1250.00, 10, 125.00, 75.00, 50.00, 1400.00, 'Bank Transfer', 'Paid', 'Corporate booking'),
      ('INV-003', 3, 'Yuki Tanaka', 'yuki@email.com', '301', '2026-01-05', '2026-01-08', 3, 900.00, 10, 90.00, 0, 0, 990.00, 'Credit Card', 'Pending', 'Suite upgrade'),
      ('INV-004', 4, 'Ahmed Hassan', 'ahmed@email.com', '102', '2026-01-10', '2026-01-12', 2, 300.00, 10, 30.00, 50.00, 0, 380.00, 'Cash', 'Paid', 'Minibar charges added'),
      ('INV-005', 5, 'Sophie Laurent', 'sophie@email.com', '401', '2026-02-01', '2026-02-05', 4, 2000.00, 10, 200.00, 150.00, 100.00, 2250.00, 'Online Payment', 'Partially Paid', 'Presidential suite with spa'),
      ('INV-006', 6, 'James Wilson', 'james.w@email.com', '103', '2026-02-10', '2026-02-13', 3, 450.00, 10, 45.00, 0, 0, 495.00, 'Debit Card', 'Overdue', 'Payment reminder sent')
    `);

    console.log('Seeding notifications...');
    await client.query(`
      INSERT INTO notifications (title, message, type, priority, category) VALUES
      ('Welcome to Hotel Manager', 'Your hotel management system is set up and ready to use.', 'success', 'low', 'general'),
      ('Low Occupancy Alert', 'Current occupancy is below 50%. Consider running promotions.', 'warning', 'high', 'occupancy'),
      ('3 Pending Reservations', 'There are 3 reservations awaiting confirmation.', 'warning', 'medium', 'reservations'),
      ('High Priority Maintenance', '2 high-priority maintenance requests are still open.', 'danger', 'high', 'maintenance'),
      ('Promotion Expiring Soon', 'Early Bird Discount expires in 2 days.', 'warning', 'medium', 'promotions')
    `);

    console.log('Seed completed successfully!');
    console.log('Default login: admin@hotel.com / password123');
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
