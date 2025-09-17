-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance records table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_hours DECIMAL(4,2),
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Admin can view all profiles
CREATE POLICY "profiles_admin_select_all" ON public.profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Attendance records policies
CREATE POLICY "attendance_select_own" ON public.attendance_records 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "attendance_insert_own" ON public.attendance_records 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "attendance_update_own" ON public.attendance_records 
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin can view all attendance records
CREATE POLICY "attendance_admin_select_all" ON public.attendance_records 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON public.attendance_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
