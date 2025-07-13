import { describe, it, expect } from 'vitest';
import { fromMySQLImproved } from '../mysql-improved';

describe('MySQL Integration Tests', () => {
    describe('E-Commerce Database Schema', () => {
        it('should parse a complete e-commerce database', async () => {
            const sql = `
                -- E-commerce database schema
                CREATE TABLE categories (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL,
                    parent_id INT,
                    slug VARCHAR(100) UNIQUE NOT NULL,
                    description TEXT,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE,
                    INDEX idx_parent (parent_id),
                    INDEX idx_active (is_active)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE brands (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL,
                    slug VARCHAR(100) UNIQUE NOT NULL,
                    logo_url VARCHAR(500),
                    website VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE products (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    sku VARCHAR(50) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    brand_id INT,
                    category_id INT NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    compare_at_price DECIMAL(10,2),
                    cost DECIMAL(10,2),
                    quantity INT DEFAULT 0,
                    weight DECIMAL(8,3),
                    status ENUM('active', 'draft', 'archived') DEFAULT 'draft',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
                    FOREIGN KEY (category_id) REFERENCES categories(id),
                    INDEX idx_sku (sku),
                    INDEX idx_category (category_id),
                    INDEX idx_brand (brand_id),
                    INDEX idx_status (status),
                    FULLTEXT idx_search (name, description)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE product_images (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    product_id INT NOT NULL,
                    image_url VARCHAR(500) NOT NULL,
                    alt_text VARCHAR(255),
                    position INT DEFAULT 0,
                    is_primary BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                    INDEX idx_product (product_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE customers (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    first_name VARCHAR(100),
                    last_name VARCHAR(100),
                    phone VARCHAR(20),
                    email_verified BOOLEAN DEFAULT FALSE,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_email (email)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE addresses (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    customer_id INT NOT NULL,
                    type ENUM('billing', 'shipping', 'both') DEFAULT 'both',
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    company VARCHAR(100),
                    address_line1 VARCHAR(255) NOT NULL,
                    address_line2 VARCHAR(255),
                    city VARCHAR(100) NOT NULL,
                    state_province VARCHAR(100),
                    postal_code VARCHAR(20),
                    country_code CHAR(2) NOT NULL,
                    phone VARCHAR(20),
                    is_default BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                    INDEX idx_customer (customer_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE carts (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    customer_id INT,
                    session_id VARCHAR(128),
                    status ENUM('active', 'abandoned', 'converted') DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP NULL,
                    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
                    INDEX idx_customer (customer_id),
                    INDEX idx_session (session_id),
                    INDEX idx_status (status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE cart_items (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    cart_id INT NOT NULL,
                    product_id INT NOT NULL,
                    quantity INT NOT NULL DEFAULT 1,
                    price DECIMAL(10,2) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id),
                    UNIQUE KEY uk_cart_product (cart_id, product_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE orders (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    order_number VARCHAR(50) UNIQUE NOT NULL,
                    customer_id INT NOT NULL,
                    billing_address_id INT NOT NULL,
                    shipping_address_id INT NOT NULL,
                    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
                    subtotal DECIMAL(10,2) NOT NULL,
                    tax_amount DECIMAL(10,2) DEFAULT 0.00,
                    shipping_amount DECIMAL(10,2) DEFAULT 0.00,
                    discount_amount DECIMAL(10,2) DEFAULT 0.00,
                    total_amount DECIMAL(10,2) NOT NULL,
                    currency_code CHAR(3) DEFAULT 'USD',
                    payment_status ENUM('pending', 'paid', 'partially_paid', 'refunded', 'failed') DEFAULT 'pending',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (customer_id) REFERENCES customers(id),
                    FOREIGN KEY (billing_address_id) REFERENCES addresses(id),
                    FOREIGN KEY (shipping_address_id) REFERENCES addresses(id),
                    INDEX idx_order_number (order_number),
                    INDEX idx_customer (customer_id),
                    INDEX idx_status (status),
                    INDEX idx_created (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE order_items (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    order_id INT NOT NULL,
                    product_id INT NOT NULL,
                    product_name VARCHAR(255) NOT NULL,
                    product_sku VARCHAR(50) NOT NULL,
                    quantity INT NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    total DECIMAL(10,2) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                    FOREIGN KEY (product_id) REFERENCES products(id),
                    INDEX idx_order (order_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE payments (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    order_id INT NOT NULL,
                    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'stripe', 'bank_transfer') NOT NULL,
                    transaction_id VARCHAR(255) UNIQUE,
                    amount DECIMAL(10,2) NOT NULL,
                    currency_code CHAR(3) DEFAULT 'USD',
                    status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
                    gateway_response JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (order_id) REFERENCES orders(id),
                    INDEX idx_order (order_id),
                    INDEX idx_transaction (transaction_id),
                    INDEX idx_status (status)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE reviews (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    product_id INT NOT NULL,
                    customer_id INT NOT NULL,
                    order_id INT,
                    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                    title VARCHAR(255),
                    comment TEXT,
                    is_verified_purchase BOOLEAN DEFAULT FALSE,
                    is_featured BOOLEAN DEFAULT FALSE,
                    helpful_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
                    UNIQUE KEY uk_product_customer (product_id, customer_id),
                    INDEX idx_product (product_id),
                    INDEX idx_rating (rating),
                    INDEX idx_created (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE coupons (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    code VARCHAR(50) UNIQUE NOT NULL,
                    description TEXT,
                    discount_type ENUM('fixed', 'percentage') NOT NULL,
                    discount_amount DECIMAL(10,2) NOT NULL,
                    minimum_amount DECIMAL(10,2),
                    usage_limit INT,
                    usage_count INT DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    valid_from DATETIME NOT NULL,
                    valid_until DATETIME,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_code (code),
                    INDEX idx_active (is_active),
                    INDEX idx_valid_dates (valid_from, valid_until)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE order_coupons (
                    order_id INT NOT NULL,
                    coupon_id INT NOT NULL,
                    discount_amount DECIMAL(10,2) NOT NULL,
                    PRIMARY KEY (order_id, coupon_id),
                    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                    FOREIGN KEY (coupon_id) REFERENCES coupons(id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `;

            const result = await fromMySQLImproved(sql);

            // Verify all tables are parsed
            expect(result.tables).toHaveLength(14);

            const expectedTables = [
                'addresses',
                'brands',
                'cart_items',
                'carts',
                'categories',
                'coupons',
                'customers',
                'order_coupons',
                'order_items',
                'orders',
                'payments',
                'product_images',
                'products',
                'reviews',
            ];

            expect(result.tables.map((t) => t.name).sort()).toEqual(
                expectedTables
            );

            // Verify key relationships
            expect(
                result.relationships.some(
                    (r) =>
                        r.sourceTable === 'products' &&
                        r.targetTable === 'categories'
                )
            ).toBe(true);

            expect(
                result.relationships.some(
                    (r) =>
                        r.sourceTable === 'cart_items' &&
                        r.targetTable === 'products'
                )
            ).toBe(true);

            expect(
                result.relationships.some(
                    (r) =>
                        r.sourceTable === 'orders' &&
                        r.targetTable === 'customers'
                )
            ).toBe(true);

            // Check self-referencing relationship
            expect(
                result.relationships.some(
                    (r) =>
                        r.sourceTable === 'categories' &&
                        r.targetTable === 'categories' &&
                        r.sourceColumn === 'parent_id'
                )
            ).toBe(true);

            // Verify ENUMs are parsed
            const products = result.tables.find((t) => t.name === 'products');
            const statusColumn = products?.columns.find(
                (c) => c.name === 'status'
            );
            expect(statusColumn?.type).toBe('ENUM');

            // Verify indexes
            expect(
                products?.indexes.some((idx) => idx.name === 'idx_sku')
            ).toBe(true);
        });
    });

    describe('Social Media Platform Schema', () => {
        it('should parse a social media database with complex relationships', async () => {
            const sql = `
                CREATE TABLE users (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    display_name VARCHAR(100),
                    bio TEXT,
                    avatar_url VARCHAR(500),
                    cover_image_url VARCHAR(500),
                    is_verified BOOLEAN DEFAULT FALSE,
                    is_private BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_username (username),
                    INDEX idx_email (email)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE posts (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    user_id BIGINT NOT NULL,
                    content TEXT NOT NULL,
                    visibility ENUM('public', 'followers', 'private') DEFAULT 'public',
                    reply_to_id BIGINT,
                    repost_of_id BIGINT,
                    like_count INT DEFAULT 0,
                    reply_count INT DEFAULT 0,
                    repost_count INT DEFAULT 0,
                    view_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (reply_to_id) REFERENCES posts(id) ON DELETE CASCADE,
                    FOREIGN KEY (repost_of_id) REFERENCES posts(id) ON DELETE CASCADE,
                    INDEX idx_user (user_id),
                    INDEX idx_created (created_at),
                    FULLTEXT idx_content (content)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE follows (
                    follower_id BIGINT NOT NULL,
                    following_id BIGINT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (follower_id, following_id),
                    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_following (following_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE likes (
                    user_id BIGINT NOT NULL,
                    post_id BIGINT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, post_id),
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                    INDEX idx_post (post_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE hashtags (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    tag VARCHAR(100) UNIQUE NOT NULL,
                    post_count INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_tag (tag)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE post_hashtags (
                    post_id BIGINT NOT NULL,
                    hashtag_id INT NOT NULL,
                    PRIMARY KEY (post_id, hashtag_id),
                    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                    FOREIGN KEY (hashtag_id) REFERENCES hashtags(id) ON DELETE CASCADE,
                    INDEX idx_hashtag (hashtag_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

                CREATE TABLE messages (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    sender_id BIGINT NOT NULL,
                    recipient_id BIGINT NOT NULL,
                    content TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_recipient (recipient_id, is_read),
                    INDEX idx_created (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

                CREATE TABLE notifications (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    user_id BIGINT NOT NULL,
                    type ENUM('like', 'follow', 'reply', 'repost', 'mention') NOT NULL,
                    actor_id BIGINT NOT NULL,
                    post_id BIGINT,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
                    INDEX idx_user_unread (user_id, is_read),
                    INDEX idx_created (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `;

            const result = await fromMySQLImproved(sql);

            expect(result.tables).toHaveLength(8);

            // Check self-referencing relationships in posts
            const postRelationships = result.relationships.filter(
                (r) => r.sourceTable === 'posts'
            );
            expect(
                postRelationships.some(
                    (r) =>
                        r.targetTable === 'posts' &&
                        r.sourceColumn === 'reply_to_id'
                )
            ).toBe(true);
            expect(
                postRelationships.some(
                    (r) =>
                        r.targetTable === 'posts' &&
                        r.sourceColumn === 'repost_of_id'
                )
            ).toBe(true);

            // Check many-to-many relationships
            expect(
                result.relationships.some(
                    (r) =>
                        r.sourceTable === 'follows' &&
                        r.sourceColumn === 'follower_id' &&
                        r.targetTable === 'users'
                )
            ).toBe(true);

            expect(
                result.relationships.some(
                    (r) =>
                        r.sourceTable === 'follows' &&
                        r.sourceColumn === 'following_id' &&
                        r.targetTable === 'users'
                )
            ).toBe(true);

            // Verify composite primary keys
            const follows = result.tables.find((t) => t.name === 'follows');
            const followerCol = follows?.columns.find(
                (c) => c.name === 'follower_id'
            );
            const followingCol = follows?.columns.find(
                (c) => c.name === 'following_id'
            );
            expect(followerCol?.primaryKey).toBe(true);
            expect(followingCol?.primaryKey).toBe(true);
        });
    });

    describe('Financial System Schema', () => {
        it('should parse a financial system with decimal precision and constraints', async () => {
            const sql = `
                CREATE TABLE currencies (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    code CHAR(3) UNIQUE NOT NULL,
                    name VARCHAR(50) NOT NULL,
                    symbol VARCHAR(5),
                    decimal_places TINYINT DEFAULT 2,
                    is_active BOOLEAN DEFAULT TRUE
                ) ENGINE=InnoDB;

                CREATE TABLE accounts (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    account_number VARCHAR(20) UNIQUE NOT NULL,
                    account_type ENUM('checking', 'savings', 'investment', 'credit') NOT NULL,
                    currency_id INT NOT NULL,
                    balance DECIMAL(19,4) DEFAULT 0.0000,
                    available_balance DECIMAL(19,4) DEFAULT 0.0000,
                    credit_limit DECIMAL(19,4),
                    interest_rate DECIMAL(5,4),
                    status ENUM('active', 'frozen', 'closed') DEFAULT 'active',
                    opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    closed_at TIMESTAMP NULL,
                    FOREIGN KEY (currency_id) REFERENCES currencies(id),
                    INDEX idx_account_number (account_number),
                    INDEX idx_status (status),
                    CHECK (balance >= 0 OR account_type = 'credit'),
                    CHECK (available_balance <= balance OR account_type = 'credit')
                ) ENGINE=InnoDB;

                CREATE TABLE transactions (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    transaction_ref VARCHAR(50) UNIQUE NOT NULL,
                    from_account_id BIGINT,
                    to_account_id BIGINT,
                    amount DECIMAL(19,4) NOT NULL,
                    currency_id INT NOT NULL,
                    type ENUM('deposit', 'withdrawal', 'transfer', 'fee', 'interest') NOT NULL,
                    status ENUM('pending', 'processing', 'completed', 'failed', 'reversed') DEFAULT 'pending',
                    description TEXT,
                    metadata JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed_at TIMESTAMP NULL,
                    FOREIGN KEY (from_account_id) REFERENCES accounts(id),
                    FOREIGN KEY (to_account_id) REFERENCES accounts(id),
                    FOREIGN KEY (currency_id) REFERENCES currencies(id),
                    INDEX idx_ref (transaction_ref),
                    INDEX idx_from_account (from_account_id),
                    INDEX idx_to_account (to_account_id),
                    INDEX idx_created (created_at),
                    INDEX idx_status (status),
                    CHECK (from_account_id IS NOT NULL OR to_account_id IS NOT NULL)
                ) ENGINE=InnoDB;

                CREATE TABLE exchange_rates (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    from_currency_id INT NOT NULL,
                    to_currency_id INT NOT NULL,
                    rate DECIMAL(19,10) NOT NULL,
                    effective_date DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (from_currency_id) REFERENCES currencies(id),
                    FOREIGN KEY (to_currency_id) REFERENCES currencies(id),
                    UNIQUE KEY uk_currency_pair_date (from_currency_id, to_currency_id, effective_date),
                    INDEX idx_effective_date (effective_date)
                ) ENGINE=InnoDB;

                CREATE TABLE audit_logs (
                    id BIGINT PRIMARY KEY AUTO_INCREMENT,
                    entity_type VARCHAR(50) NOT NULL,
                    entity_id BIGINT NOT NULL,
                    action VARCHAR(50) NOT NULL,
                    user_id BIGINT,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    old_values JSON,
                    new_values JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_entity (entity_type, entity_id),
                    INDEX idx_created (created_at),
                    INDEX idx_action (action)
                ) ENGINE=InnoDB;
            `;

            const result = await fromMySQLImproved(sql);

            expect(result.tables).toHaveLength(5);

            // Check decimal precision is preserved
            const accounts = result.tables.find((t) => t.name === 'accounts');
            const balanceCol = accounts?.columns.find(
                (c) => c.name === 'balance'
            );
            expect(balanceCol?.type).toBe('DECIMAL');

            const transactionFKs = result.relationships.filter(
                (r) => r.sourceTable === 'transactions'
            );

            expect(
                transactionFKs.some(
                    (r) =>
                        r.sourceColumn === 'from_account_id' &&
                        r.targetTable === 'accounts'
                )
            ).toBe(true);

            expect(
                transactionFKs.some(
                    (r) =>
                        r.sourceColumn === 'to_account_id' &&
                        r.targetTable === 'accounts'
                )
            ).toBe(true);

            // Check composite unique constraint
            const exchangeRates = result.tables.find(
                (t) => t.name === 'exchange_rates'
            );
            expect(
                exchangeRates?.indexes.some(
                    (idx) =>
                        idx.name === 'uk_currency_pair_date' &&
                        idx.unique === true
                )
            ).toBe(true);
        });
    });
});
