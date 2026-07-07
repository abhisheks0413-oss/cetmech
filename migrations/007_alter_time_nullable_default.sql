-- Make the `time` column nullable with a default empty string
ALTER TABLE events MODIFY time VARCHAR(50) NULL DEFAULT '';
