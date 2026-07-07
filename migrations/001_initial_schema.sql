CREATE TABLE IF NOT EXISTS notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  semester VARCHAR(100),
  description TEXT NOT NULL,
  date VARCHAR(50) NOT NULL,
  links TEXT NOT NULL,
  image TEXT,
  template_data TEXT
);

CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date VARCHAR(50) NOT NULL,
  venue VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  registration_link TEXT,
  instagram_link TEXT
);

CREATE TABLE IF NOT EXISTS academics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  scheme VARCHAR(50) NOT NULL,
  semester VARCHAR(100) NOT NULL,
  drive_link TEXT NOT NULL,
  UNIQUE KEY unique_academics_entry (type, scheme, semester)
);
