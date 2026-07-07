INSERT INTO notices (title, type, semester, description, date, links, image, template_data)
VALUES
  (
    'Semester S6 Results Published',
    'result',
    'Semester 6',
    'The results for Semester 6 have been published. Students are requested to sign in to the KTU Student Portal and download their scorecards.',
    'JUN 28',
    '[{"name":"KTU Student Portal","url":"https://app.ktu.edu.in/login.htm"},{"name":"Announcements","url":"https://www.instagram.com/me_association.cet?igsh=MWpldDB6czlwd2J2dA=="}]',
    NULL,
    NULL
  ),
  (
    'Semester S2 Results Published',
    'result',
    'Semester 2',
    'The results for Semester 2 have been published. Students are requested to sign in to the KTU Student Portal and download their scorecards.',
    'JUN 29',
    '[{"name":"KTU Student Portal","url":"https://app.ktu.edu.in/login.htm"},{"name":"Announcements","url":"https://www.instagram.com/me_association.cet?igsh=MWpldDB6czlwd2J2dA=="}]',
    NULL,
    NULL
  ),
  (
    'Classroom Details & Room Numbers',
    'general',
    '',
    'Access complete classroom allocation, room numbers, and laboratory space assignments for all semesters.',
    'INFO',
    '[{"name":"Classroom Details Plan","url":"images/notices/odd_class_details.png"}]',
    NULL,
    NULL
  );

INSERT INTO events (title, date, venue, description, poster_url, registration_link, instagram_link)
VALUES
  (
    'Robotics & Fabrication Hub',
    '2026-07-15',

    'Robotics Lab, CET',
    'Hands-on workshop on structural assembly, Arduino path planning, and sensor calibration metrics.',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80',
    'https://forms.gle/nMktE7vQFdovGtQ67',
    ''
  ),
  (
    'Annual Technical Symposium',
    '2026-08-05',
    '09:00 AM',
    'Main Auditorium, CET',
    'Paper presentations, design competitions, and talks by industrial experts in mechanical engineering systems.',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80',
    'https://forms.gle/nMktE7vQFdovGtQ67',
    ''
  );

INSERT IGNORE INTO academics (type, scheme, semester, drive_link)
VALUES
  ('syllabus', '2024', 'Semester 1', ''),
  ('syllabus', '2024', 'Semester 2', ''),
  ('syllabus', '2024', 'Semester 3', ''),
  ('syllabus', '2024', 'Semester 4', ''),
  ('syllabus', '2024', 'Semester 5', ''),
  ('syllabus', '2024', 'Semester 6', ''),
  ('syllabus', '2024', 'Semester 7', ''),
  ('syllabus', '2024', 'Semester 8', ''),
  ('resources', '2024', 'Semester 1', ''),
  ('resources', '2024', 'Semester 2', ''),
  ('resources', '2024', 'Semester 3', ''),
  ('resources', '2024', 'Semester 4', ''),
  ('resources', '2024', 'Semester 5', ''),
  ('resources', '2024', 'Semester 6', ''),
  ('resources', '2024', 'Semester 7', ''),
  ('resources', '2024', 'Semester 8', '');
