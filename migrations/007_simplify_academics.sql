-- Simplify academics table: remove type and scheme columns, keep only semester and link
-- This migration creates a new simplified structure

-- Create new academics table with simplified structure
CREATE TABLE IF NOT EXISTS academics_new (
  id INT AUTO_INCREMENT PRIMARY KEY,
  semester INT NOT NULL UNIQUE,
  drive_link TEXT NOT NULL
);

-- Copy data from old table (taking the latest scheme for each semester)
INSERT INTO academics_new (semester, drive_link)
SELECT 
  CAST(SUBSTRING_INDEX(semester, ' ', -1) AS UNSIGNED) AS semester,
  drive_link
FROM academics
WHERE scheme = '2024' AND type = 'resources'
GROUP BY semester
ON DUPLICATE KEY UPDATE drive_link = VALUES(drive_link);

-- Drop old academics table
DROP TABLE IF EXISTS academics;

-- Rename new table to academics
RENAME TABLE academics_new TO academics;
