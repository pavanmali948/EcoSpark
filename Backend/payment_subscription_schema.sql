CREATE TABLE IF NOT EXISTS payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    amount DOUBLE NOT NULL,
    status VARCHAR(20) NOT NULL,
    order_id VARCHAR(255) NOT NULL UNIQUE,
    payment_id VARCHAR(255),
    signature VARCHAR(255),
    customer_id VARCHAR(255) NOT NULL,
    slot_id BIGINT NOT NULL,
    booking_id VARCHAR(255),
    created_at DATETIME
);

CREATE TABLE IF NOT EXISTS subscription_plan (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    price DOUBLE NOT NULL,
    duration_days INT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    pump_admin_id VARCHAR(255) NOT NULL,
    plan_id BIGINT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL
);
