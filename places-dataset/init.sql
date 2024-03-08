CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255),
    place_id VARCHAR(255),
    review TEXT,
    rating INTEGER,
    place_name VARCHAR(255)
);

INSERT INTO reviews (user_email, place_id, review, rating, place_name)
VALUES
  ('user1@example.com', 'place1', 'Great place!', 5, 'Restaurant A'),
  ('user2@example.com', 'place2', 'Awesome service!', 4, 'Cafe B');
