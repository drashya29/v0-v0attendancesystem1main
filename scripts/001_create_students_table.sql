-- Create students table with face encoding support
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  department TEXT,
  year INTEGER,
  photo_url TEXT,
  face_encoding TEXT, -- Store face encoding as JSON string
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create policies for students table
CREATE POLICY "Allow public read access to students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert to students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update to students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete to students" ON public.students FOR DELETE USING (true);

-- Create teachers table
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  department TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Create policies for teachers table
CREATE POLICY "Allow public read access to teachers" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert to teachers" ON public.teachers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated update to teachers" ON public.teachers FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated delete to teachers" ON public.teachers FOR DELETE USING (true);

-- Update attendance_records to reference students
ALTER TABLE public.attendance_records 
ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES public.students(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_students_student_id ON public.students(student_id);
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON public.teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance_records(student_id);
