-- Enhanced Demo Data Setup Function
-- Run this after creating all auth users in Supabase Auth Dashboard

-- Drop the function if it exists
drop function if exists setup_enhanced_demo_data();

-- Create the enhanced demo data setup function
create or replace function setup_enhanced_demo_data()
returns void
language plpgsql
security definer
as $$
declare
  v_super_admin_id uuid;
  v_cs_admin_id uuid;
  v_ee_admin_id uuid;
  v_me_admin_id uuid;
  v_cs_instructor_id uuid;
  v_ee_instructor_id uuid;
  v_me_instructor_id uuid;
  v_student1_id uuid;
  v_student2_id uuid;
  v_student3_id uuid;
  v_student4_id uuid;
  v_student5_id uuid;
  v_student6_id uuid;
  
  v_cs_dept_id uuid;
  v_ee_dept_id uuid;
  v_me_dept_id uuid;
  
  v_cs_course1_id uuid;
  v_cs_course2_id uuid;
  v_cs_course3_id uuid;
  v_ee_course1_id uuid;
  v_ee_course2_id uuid;
  v_ee_course3_id uuid;
  v_me_course1_id uuid;
  v_me_course2_id uuid;
  v_me_course3_id uuid;
  
  v_workshop1_id uuid;
  v_workshop2_id uuid;
  v_workshop3_id uuid;
  v_workshop4_id uuid;
  v_workshop5_id uuid;
  v_workshop6_id uuid;
begin
  raise notice 'Starting enhanced demo data setup...';
  
  -- Get user IDs from auth.users
  select id into v_super_admin_id from auth.users where email = 'super@admin.com';
  select id into v_cs_admin_id from auth.users where email = 'cs-admin@test.com';
  select id into v_ee_admin_id from auth.users where email = 'ee-admin@test.com';
  select id into v_me_admin_id from auth.users where email = 'me-admin@test.com';
  select id into v_cs_instructor_id from auth.users where email = 'cs-instructor@test.com';
  select id into v_ee_instructor_id from auth.users where email = 'ee-instructor@test.com';
  select id into v_me_instructor_id from auth.users where email = 'me-instructor@test.com';
  select id into v_student1_id from auth.users where email = 'student1@test.com';
  select id into v_student2_id from auth.users where email = 'student2@test.com';
  select id into v_student3_id from auth.users where email = 'student3@test.com';
  select id into v_student4_id from auth.users where email = 'student4@test.com';
  select id into v_student5_id from auth.users where email = 'student5@test.com';
  select id into v_student6_id from auth.users where email = 'student6@test.com';
  
  -- Get department IDs
  select id into v_cs_dept_id from departments where code = 'CS';
  select id into v_ee_dept_id from departments where code = 'EE';
  select id into v_me_dept_id from departments where code = 'ME';
  
  raise notice 'Assigning users to departments...';
  
  -- Update profiles with department assignments and names
  update profiles set department_id = null, name = 'Super Admin' where id = v_super_admin_id;
  update profiles set department_id = v_cs_dept_id, name = 'CS Department Admin' where id = v_cs_admin_id;
  update profiles set department_id = v_ee_dept_id, name = 'EE Department Admin' where id = v_ee_admin_id;
  update profiles set department_id = v_me_dept_id, name = 'ME Department Admin' where id = v_me_admin_id;
  update profiles set department_id = v_cs_dept_id, name = 'CS Instructor' where id = v_cs_instructor_id;
  update profiles set department_id = v_ee_dept_id, name = 'EE Instructor' where id = v_ee_instructor_id;
  update profiles set department_id = v_me_dept_id, name = 'ME Instructor' where id = v_me_instructor_id;
  update profiles set department_id = v_cs_dept_id, name = 'Alice Johnson', student_id = 'CS2024001' where id = v_student1_id;
  update profiles set department_id = v_ee_dept_id, name = 'Bob Smith', student_id = 'EE2024001' where id = v_student2_id;
  update profiles set department_id = v_me_dept_id, name = 'Carol Williams', student_id = 'ME2024001' where id = v_student3_id;
  update profiles set department_id = v_cs_dept_id, name = 'David Brown', student_id = 'CS2024002' where id = v_student4_id;
  update profiles set department_id = v_ee_dept_id, name = 'Emma Davis', student_id = 'EE2024002' where id = v_student5_id;
  update profiles set department_id = v_me_dept_id, name = 'Frank Miller', student_id = 'ME2024002' where id = v_student6_id;
  
  raise notice 'Assigning roles...';
  
  -- Assign roles
  insert into user_roles (user_id, role) values
    (v_super_admin_id, 'super_admin'),
    (v_cs_admin_id, 'department_admin'),
    (v_ee_admin_id, 'department_admin'),
    (v_me_admin_id, 'department_admin'),
    (v_cs_instructor_id, 'instructor'),
    (v_ee_instructor_id, 'instructor'),
    (v_me_instructor_id, 'instructor'),
    (v_student1_id, 'student'),
    (v_student2_id, 'student'),
    (v_student3_id, 'student'),
    (v_student4_id, 'student'),
    (v_student5_id, 'student'),
    (v_student6_id, 'student')
  on conflict (user_id, role) do nothing;
  
  raise notice 'Creating CS department courses...';
  
  -- CS Department Courses
  -- Create CS courses with correct columns
  insert into courses (title, description, instructor_id, instructor_name, department_id, category, level, duration, thumbnail)
  values 
    ('Introduction to React', 'Learn the fundamentals of React.js, including components, props, state, and hooks. Perfect for beginners starting their web development journey.', 
     v_cs_instructor_id, (select name from public.profiles where id = v_cs_instructor_id limit 1), v_cs_dept_id, 'Web Development', 'beginner', '8 weeks', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee')
  returning id into v_cs_course1_id;
  
  insert into courses (title, description, instructor_id, instructor_name, department_id, category, level, duration, thumbnail)
  values 
    ('Advanced JavaScript', 'Master advanced JavaScript concepts including closures, prototypes, async programming, and ES6+ features.', 
     v_cs_instructor_id, (select name from public.profiles where id = v_cs_instructor_id limit 1), v_cs_dept_id, 'Programming', 'advanced', '12 weeks', 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a')
  returning id into v_cs_course2_id;
  
  insert into courses (title, description, instructor_id, instructor_name, department_id, category, level, duration, thumbnail)
  values 
    ('Data Structures in Python', 'Learn essential data structures and algorithms using Python. Covers arrays, linked lists, trees, graphs, and more.', 
     v_cs_instructor_id, (select name from public.profiles where id = v_cs_instructor_id limit 1), v_cs_dept_id, 'Programming', 'intermediate', '10 weeks', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5')
  returning id into v_cs_course3_id;
  
  -- CS Course 1 Lessons
  insert into lessons (course_id, title, description, video_url, duration, order_index)
  values 
    (v_cs_course1_id, 'React Basics', 'Introduction to React and JSX syntax', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '45 min', 1),
    (v_cs_course1_id, 'Components and Props', 'Learn how to create reusable components', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '50 min', 2),
    (v_cs_course1_id, 'State and Lifecycle', 'Understanding component state management', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '55 min', 3),
    (v_cs_course1_id, 'React Hooks', 'Master useState, useEffect, and custom hooks', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '60 min', 4);
  
  -- CS Course 2 Lessons
  insert into lessons (course_id, title, description, video_url, duration, order_index)
  values 
    (v_cs_course2_id, 'Closures and Scope', 'Deep dive into JavaScript closures', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '40 min', 1),
    (v_cs_course2_id, 'Prototypes and Inheritance', 'Understanding JavaScript prototype chain', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '45 min', 2),
    (v_cs_course2_id, 'Async Programming', 'Promises, async/await, and event loop', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '50 min', 3),
    (v_cs_course2_id, 'ES6+ Features', 'Modern JavaScript syntax and features', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '45 min', 4),
    (v_cs_course2_id, 'Design Patterns', 'Common JavaScript design patterns', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '55 min', 5);
  
  -- CS Course 3 Lessons
  insert into lessons (course_id, title, description, video_url, duration, order_index)
  values 
    (v_cs_course3_id, 'Arrays and Lists', 'Working with Python lists and arrays', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '40 min', 1),
    (v_cs_course3_id, 'Stacks and Queues', 'Implementation and use cases', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '45 min', 2),
    (v_cs_course3_id, 'Trees and Graphs', 'Tree structures and graph algorithms', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '60 min', 3),
    (v_cs_course3_id, 'Sorting Algorithms', 'Compare different sorting techniques', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '50 min', 4);
  
  raise notice 'Creating EE department courses...';
  
  -- EE Department Courses
  insert into courses (title, description, instructor_id, instructor_name, department_id, category, level, duration, thumbnail)
  values 
    ('Circuit Analysis Fundamentals', 'Master the basics of circuit analysis including Ohm''s law, Kirchhoff''s laws, and circuit theorems.', 
     v_ee_instructor_id, (select name from public.profiles where id = v_ee_instructor_id limit 1), v_ee_dept_id, 'Electronics', 'beginner', '8 weeks', 'https://images.unsplash.com/photo-1518770660439-4636190af475')
  returning id into v_ee_course1_id;
  
  insert into courses (title, description, instructor_id, instructor_name, department_id, category, level, duration, thumbnail)
  values 
    ('Digital Signal Processing', 'Advanced course covering signal processing techniques, FFT, filters, and real-time processing.', 
     v_ee_instructor_id, (select name from public.profiles where id = v_ee_instructor_id limit 1), v_ee_dept_id, 'Signal Processing', 'advanced', '12 weeks', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa')
  returning id into v_ee_course2_id;
  
  insert into courses (title, description, instructor_id, instructor_name, department_id, category, level, duration, thumbnail)
  values 
    ('Microcontroller Programming', 'Learn to program microcontrollers using C/C++ for embedded systems applications.', 
     v_ee_instructor_id, (select name from public.profiles where id = v_ee_instructor_id limit 1), v_ee_dept_id, 'Embedded Systems', 'intermediate', '10 weeks', 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0')
  returning id into v_ee_course3_id;
  
  -- EE Course 1 Lessons
  insert into lessons (course_id, title, description, video_url, duration, order_index)
  values 
    (v_ee_course1_id, 'Introduction to Circuits', 'Basic circuit components and terminology', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '40 min', 1),
    (v_ee_course1_id, 'Ohm''s Law', 'Understanding voltage, current, and resistance', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '35 min', 2),
    (v_ee_course1_id, 'Kirchhoff''s Laws', 'KVL and KCL for circuit analysis', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '45 min', 3),
    (v_ee_course1_id, 'Series and Parallel Circuits', 'Analyzing complex circuit configurations', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '50 min', 4);
  
  -- EE Course 2 Lessons
  insert into lessons (course_id, title, description, video_url, duration, order_index)
  values 
    (v_ee_course2_id, 'Signal Representation', 'Time and frequency domain analysis', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '45 min', 1),
    (v_ee_course2_id, 'Fourier Transform', 'Understanding FFT and spectral analysis', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '55 min', 2),
    (v_ee_course2_id, 'Digital Filters', 'FIR and IIR filter design', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '60 min', 3),
    (v_ee_course2_id, 'Sampling Theory', 'Nyquist theorem and aliasing', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '50 min', 4),
    (v_ee_course2_id, 'Real-time Processing', 'DSP implementation techniques', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '65 min', 5);
  
  -- EE Course 3 Lessons
  insert into lessons (course_id, title, description, video_url, duration, order_index)
  values 
    (v_ee_course3_id, 'Microcontroller Basics', 'Architecture and programming fundamentals', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '45 min', 1),
    (v_ee_course3_id, 'GPIO Programming', 'Working with digital I/O pins', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '40 min', 2),
    (v_ee_course3_id, 'Interrupts and Timers', 'Event-driven programming', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '50 min', 3),
    (v_ee_course3_id, 'Serial Communication', 'UART, SPI, and I2C protocols', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '55 min', 4);
  
  raise notice 'Creating ME department courses...';
  
  -- ME Department Courses
  insert into courses (title, description, instructor_id, instructor_name, department_id, category, level, duration, thumbnail)
  values 
    ('Thermodynamics Basics', 'Introduction to thermodynamics principles, laws of thermodynamics, and energy systems.', 
     v_me_instructor_id, (select name from public.profiles where id = v_me_instructor_id limit 1), v_me_dept_id, 'Thermal Engineering', 'beginner', '8 weeks', 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e')
  returning id into v_me_course1_id;
  
  insert into courses (title, description, instructor_id, instructor_name, department_id, category, level, duration, thumbnail)
  values 
    ('CAD Design with SolidWorks', 'Learn 3D modeling, assembly design, and engineering drawings using SolidWorks.', 
     v_me_instructor_id, (select name from public.profiles where id = v_me_instructor_id limit 1), v_me_dept_id, 'Design', 'intermediate', '10 weeks', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12')
  returning id into v_me_course2_id;
  
  insert into courses (title, description, instructor_id, instructor_name, department_id, category, level, duration, thumbnail)
  values 
    ('Fluid Mechanics', 'Advanced study of fluid dynamics, flow analysis, and hydraulic systems.', 
     v_me_instructor_id, (select name from public.profiles where id = v_me_instructor_id limit 1), v_me_dept_id, 'Mechanics', 'advanced', '12 weeks', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19')
  returning id into v_me_course3_id;
  
  -- ME Course 1 Lessons
  insert into lessons (course_id, title, description, video_url, duration, order_index)
  values 
    (v_me_course1_id, 'Introduction to Thermodynamics', 'Basic concepts and definitions', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '40 min', 1),
    (v_me_course1_id, 'First Law of Thermodynamics', 'Energy conservation principles', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '45 min', 2),
    (v_me_course1_id, 'Second Law of Thermodynamics', 'Entropy and heat engines', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '50 min', 3),
    (v_me_course1_id, 'Thermodynamic Cycles', 'Carnot, Otto, and Rankine cycles', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '55 min', 4);
  
  -- ME Course 2 Lessons
  insert into lessons (course_id, title, description, video_url, duration, order_index)
  values 
    (v_me_course2_id, 'SolidWorks Interface', 'Getting started with SolidWorks', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '35 min', 1),
    (v_me_course2_id, 'Sketching Basics', 'Creating 2D sketches and constraints', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '40 min', 2),
    (v_me_course2_id, '3D Modeling Techniques', 'Extrude, revolve, and sweep features', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '50 min', 3),
    (v_me_course2_id, 'Assembly Design', 'Creating and managing assemblies', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '55 min', 4),
    (v_me_course2_id, 'Engineering Drawings', 'Creating technical drawings', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '45 min', 5);
  
  -- ME Course 3 Lessons
  insert into lessons (course_id, title, description, video_url, duration, order_index)
  values 
    (v_me_course3_id, 'Fluid Properties', 'Density, viscosity, and surface tension', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '40 min', 1),
    (v_me_course3_id, 'Fluid Statics', 'Pressure distribution in fluids', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '45 min', 2),
    (v_me_course3_id, 'Bernoulli Equation', 'Energy conservation in flowing fluids', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '50 min', 3),
    (v_me_course3_id, 'Pipe Flow', 'Friction losses and pressure drop', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '55 min', 4);
  
  raise notice 'Creating workshops...';
  
  -- Workshops
  insert into workshops (title, description, instructor_id, instructor_name, department_id, category, thumbnail, max_students, status)
  values 
    ('React Best Practices Workshop', 'Hands-on workshop covering React performance optimization and best practices.', 
     v_cs_instructor_id, (select name from public.profiles where id = v_cs_instructor_id limit 1), v_cs_dept_id, 'Web Development', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee', 30, 'upcoming')
  returning id into v_workshop1_id;
  
  insert into workshops (title, description, instructor_id, instructor_name, department_id, category, thumbnail, max_students, status)
  values 
    ('Web Accessibility Workshop', 'Learn to build accessible web applications with WCAG 2.1 compliance.', 
     v_cs_instructor_id, (select name from public.profiles where id = v_cs_instructor_id limit 1), v_cs_dept_id, 'Web Development', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085', 25, 'ongoing')
  returning id into v_workshop2_id;
  
  insert into workshops (title, description, instructor_id, instructor_name, department_id, category, thumbnail, max_students, status)
  values 
    ('PCB Design Workshop', 'Practical PCB design using industry-standard tools.', 
     v_ee_instructor_id, (select name from public.profiles where id = v_ee_instructor_id limit 1), v_ee_dept_id, 'Electronics', 'https://images.unsplash.com/photo-1518770660439-4636190af475', 20, 'upcoming')
  returning id into v_workshop3_id;
  
  insert into workshops (title, description, instructor_id, instructor_name, department_id, category, thumbnail, max_students, status)
  values 
    ('Arduino Projects Workshop', 'Build exciting projects with Arduino microcontrollers.', 
     v_ee_instructor_id, (select name from public.profiles where id = v_ee_instructor_id limit 1), v_ee_dept_id, 'Electronics', 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0', 25, 'completed')
  returning id into v_workshop4_id;
  
  insert into workshops (title, description, instructor_id, instructor_name, department_id, category, thumbnail, max_students, status)
  values 
    ('3D Printing Techniques', 'Learn advanced 3D printing techniques and materials.', 
     v_me_instructor_id, (select name from public.profiles where id = v_me_instructor_id limit 1), v_me_dept_id, 'Manufacturing', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12', 15, 'ongoing')
  returning id into v_workshop5_id;
  
  insert into workshops (title, description, instructor_id, instructor_name, department_id, category, thumbnail, max_students, status)
  values 
    ('CNC Machining Basics', 'Introduction to CNC programming and operation.', 
     v_me_instructor_id, (select name from public.profiles where id = v_me_instructor_id limit 1), v_me_dept_id, 'Manufacturing', 'https://images.unsplash.com/photo-1565089953238-0bcf8c8eb5ef', 12, 'upcoming')
  returning id into v_workshop6_id;
  
  -- Workshop Sessions
  insert into workshop_sessions (workshop_id, date, start_time, end_time, vimeo_live_url, is_live)
  values 
    (v_workshop1_id, (current_date + interval '7 days')::date, '09:00:00', '12:00:00', null, false),
    (v_workshop1_id, (current_date + interval '14 days')::date, '09:00:00', '12:00:00', null, false),
    (v_workshop2_id, (current_date - interval '3 days')::date, '14:00:00', '16:00:00', null, false),
    (v_workshop2_id, (current_date + interval '4 days')::date, '14:00:00', '16:00:00', null, false),
    (v_workshop3_id, (current_date + interval '10 days')::date, '10:00:00', '14:00:00', null, false),
    (v_workshop4_id, (current_date - interval '30 days')::date, '13:00:00', '16:00:00', null, false),
    (v_workshop5_id, (current_date - interval '5 days')::date, '13:00:00', '16:00:00', null, false),
    (v_workshop5_id, (current_date + interval '2 days')::date, '13:00:00', '16:00:00', null, false),
    (v_workshop6_id, (current_date + interval '15 days')::date, '09:00:00', '13:00:00', null, false);
  
  raise notice 'Creating enrollments...';
  
  -- Course Enrollments (students enrolled in 2-3 courses each, some cross-department)
  insert into course_enrollments (course_id, student_id)
  values 
    -- Student 1 (CS) - enrolled in CS courses
    (v_cs_course1_id, v_student1_id),
    (v_cs_course2_id, v_student1_id),
    -- Student 2 (EE) - enrolled in EE courses + 1 CS course
    (v_ee_course1_id, v_student2_id),
    (v_ee_course3_id, v_student2_id),
    (v_cs_course1_id, v_student2_id),
    -- Student 3 (ME) - enrolled in ME courses
    (v_me_course1_id, v_student3_id),
    (v_me_course2_id, v_student3_id),
    -- Student 4 (CS) - enrolled in CS courses + 1 EE course
    (v_cs_course1_id, v_student4_id),
    (v_cs_course3_id, v_student4_id),
    (v_ee_course1_id, v_student4_id),
    -- Student 5 (EE) - enrolled in EE courses
    (v_ee_course1_id, v_student5_id),
    (v_ee_course2_id, v_student5_id),
    (v_ee_course3_id, v_student5_id),
    -- Student 6 (ME) - enrolled in ME courses + 1 CS course
    (v_me_course1_id, v_student6_id),
    (v_me_course3_id, v_student6_id),
    (v_cs_course1_id, v_student6_id)
  on conflict do nothing;
  
  -- Workshop Enrollments
  insert into workshop_enrollments (workshop_id, student_id)
  values 
    (v_workshop1_id, v_student1_id),
    (v_workshop2_id, v_student1_id),
    (v_workshop3_id, v_student2_id),
    (v_workshop4_id, v_student2_id),
    (v_workshop5_id, v_student3_id),
    (v_workshop6_id, v_student3_id),
    (v_workshop1_id, v_student4_id),
    (v_workshop2_id, v_student4_id),
    (v_workshop3_id, v_student5_id),
    (v_workshop4_id, v_student5_id),
    (v_workshop5_id, v_student6_id),
    (v_workshop6_id, v_student6_id)
  on conflict do nothing;
  
  raise notice 'Creating progress data...';
  
  -- Course Progress (varying completion rates)
  insert into course_progress (user_id, course_id, completion_percentage, last_accessed, total_time_spent)
  values 
    (v_student1_id, v_cs_course1_id, 75, now() - interval '1 day', 180),
    (v_student1_id, v_cs_course2_id, 25, now() - interval '3 days', 90),
    (v_student2_id, v_ee_course1_id, 100, now() - interval '2 days', 200),
    (v_student2_id, v_ee_course3_id, 50, now() - interval '1 day', 150),
    (v_student2_id, v_cs_course1_id, 30, now() - interval '5 days', 60),
    (v_student3_id, v_me_course1_id, 60, now() - interval '2 days', 120),
    (v_student3_id, v_me_course2_id, 40, now() - interval '4 days', 100),
    (v_student4_id, v_cs_course1_id, 90, now() - interval '1 day', 200),
    (v_student4_id, v_cs_course3_id, 35, now() - interval '6 days', 80),
    (v_student4_id, v_ee_course1_id, 20, now() - interval '7 days', 50),
    (v_student5_id, v_ee_course1_id, 100, now() - interval '3 days', 180),
    (v_student5_id, v_ee_course2_id, 70, now() - interval '1 day', 220),
    (v_student5_id, v_ee_course3_id, 45, now() - interval '2 days', 130),
    (v_student6_id, v_me_course1_id, 80, now() - interval '1 day', 160),
    (v_student6_id, v_me_course3_id, 15, now() - interval '8 days', 40),
    (v_student6_id, v_cs_course1_id, 50, now() - interval '3 days', 100)
  on conflict do nothing;
  
  -- Lesson Progress (for students with course progress)
  insert into lesson_progress (course_progress_id, lesson_id, completed, time_spent, video_watch_time, current_position, last_watched)
  select 
    cp.id,
    l.id,
    (random() > 0.3)::boolean,
    floor(random() * 1800)::integer,
    floor(random() * 1800)::integer,
    floor(random() * 1800)::integer,
    now() - (floor(random() * 7)::int || ' days')::interval
  from course_progress cp
  join lessons l on l.course_id = cp.course_id
  where cp.completion_percentage > 0
  on conflict do nothing;
  
  raise notice 'Creating comments and certificates...';
  
  -- Comments on workshops
  insert into comments (workshop_id, user_id, user_name, message, created_at)
  values 
    (v_workshop2_id, v_student1_id, (select name from public.profiles where id = v_student1_id), 'Great workshop! Learned a lot about accessibility best practices.', now() - interval '2 days'),
    (v_workshop4_id, v_student2_id, (select name from public.profiles where id = v_student2_id), 'The Arduino projects were very hands-on and practical.', now() - interval '25 days'),
    (v_workshop2_id, v_student4_id, (select name from public.profiles where id = v_student4_id), 'Really helpful for understanding ARIA attributes.', now() - interval '1 day'),
    (v_workshop4_id, v_student5_id, (select name from public.profiles where id = v_student5_id), 'Looking forward to applying these skills in my projects!', now() - interval '25 days');
  
  -- Certificates for completed workshops
  insert into certificates (workshop_id, workshop_title, student_id, student_name, instructor_id, instructor_name, issued_at)
  values 
    (
      v_workshop4_id,
      (select title from workshops where id = v_workshop4_id),
      v_student2_id,
      (select name from public.profiles where id = v_student2_id),
      (select instructor_id from workshops where id = v_workshop4_id),
      (select name from public.profiles where id = (select instructor_id from workshops where id = v_workshop4_id)),
      now() - interval '25 days'
    ),
    (
      v_workshop4_id,
      (select title from workshops where id = v_workshop4_id),
      v_student5_id,
      (select name from public.profiles where id = v_student5_id),
      (select instructor_id from workshops where id = v_workshop4_id),
      (select name from public.profiles where id = (select instructor_id from workshops where id = v_workshop4_id)),
      now() - interval '25 days'
    );
  
  raise notice 'Creating notifications...';
  
  -- Notifications
  insert into notifications (user_id, item_id, item_title, item_type, type, message, is_read, created_at)
  values 
    -- Enrollment confirmations
    (v_student1_id, v_cs_course1_id::text, 'Introduction to React', 'course', 'enrollment', 'You have been enrolled in Introduction to React', true, now() - interval '29 days'),
    (v_student1_id, v_cs_course2_id::text, 'Advanced JavaScript', 'course', 'enrollment', 'You have been enrolled in Advanced JavaScript', true, now() - interval '27 days'),
    (v_student2_id, v_ee_course1_id::text, 'Circuit Analysis Fundamentals', 'course', 'enrollment', 'You have been enrolled in Circuit Analysis Fundamentals', true, now() - interval '28 days'),
    (v_student3_id, v_me_course1_id::text, 'Thermodynamics Basics', 'course', 'enrollment', 'You have been enrolled in Thermodynamics Basics', true, now() - interval '26 days'),
    -- Workshop notifications
    (v_student1_id, v_workshop1_id::text, 'React Best Practices Workshop', 'workshop', 'workshop_update', 'React Best Practices Workshop starts in 7 days', false, now() - interval '6 days'),
    (v_student2_id, v_workshop3_id::text, 'PCB Design Workshop', 'workshop', 'workshop_update', 'PCB Design Workshop starts in 10 days', false, now() - interval '9 days'),
    (v_student3_id, v_workshop6_id::text, 'CNC Machining Basics', 'workshop', 'workshop_update', 'CNC Machining Basics starts in 15 days', false, now() - interval '14 days'),
    -- Certificate notifications
    (v_student2_id, v_workshop4_id::text, 'Arduino Projects Workshop', 'workshop', 'certificate_issued', 'Your certificate for Arduino Projects Workshop is ready', true, now() - interval '25 days'),
    (v_student5_id, v_workshop4_id::text, 'Arduino Projects Workshop', 'workshop', 'certificate_issued', 'Your certificate for Arduino Projects Workshop is ready', true, now() - interval '25 days'),
    -- Course updates
    (v_student1_id, v_cs_course3_id::text, 'Data Structures in Python', 'course', 'course_update', 'New course available: Data Structures in Python', false, now() - interval '5 days'),
    (v_student2_id, v_ee_course2_id::text, 'Digital Signal Processing', 'course', 'course_update', 'Digital Signal Processing course is now open for enrollment', false, now() - interval '4 days');
  
  raise notice 'Enhanced demo data setup completed successfully!';
end;
$$;

-- Instructions for running this setup
comment on function setup_enhanced_demo_data() is 
'Enhanced demo data setup function. 

Prerequisites:
1. Create these auth users in Supabase Auth Dashboard (all with password Test123!):
   - super@admin.com
   - cs-admin@test.com
   - ee-admin@test.com
   - me-admin@test.com
   - cs-instructor@test.com
   - ee-instructor@test.com
   - me-instructor@test.com
   - student1@test.com
   - student2@test.com
   - student3@test.com
   - student4@test.com
   - student5@test.com
   - student6@test.com

2. Run this function:
   select setup_enhanced_demo_data();

3. Verify with:
   select 
     d.name as department,
     d.code,
     count(distinct p.id) filter (where ur.role = ''department_admin'') as admins,
     count(distinct p.id) filter (where ur.role = ''instructor'') as instructors,
     count(distinct p.id) filter (where ur.role = ''student'') as students,
     count(distinct c.id) as courses,
     count(distinct w.id) as workshops
   from public.departments d
   left join public.profiles p on p.department_id = d.id
   left join public.user_roles ur on ur.user_id = p.id
   left join public.courses c on c.department_id = d.id
   left join public.workshops w on w.department_id = d.id
   group by d.id, d.name, d.code
   order by d.name;
';
