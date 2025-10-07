-- Tabela para complementar dados dos advogados
-- Esta tabela deve ser criada no Supabase Dashboard

CREATE TABLE IF NOT EXISTS public.advogados_perfil (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pendente')),
  role TEXT DEFAULT 'advogado' CHECK (role IN ('admin', 'advogado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.advogados_perfil ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.advogados_perfil
  FOR SELECT USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.advogados_perfil
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.user_metadata->>'role' = 'admin')
    )
  );

-- Policy: Admins can insert profiles
CREATE POLICY "Admins can insert profiles" ON public.advogados_perfil
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.user_metadata->>'role' = 'admin')
    )
  );

-- Policy: Admins can update profiles
CREATE POLICY "Admins can update profiles" ON public.advogados_perfil
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.user_metadata->>'role' = 'admin')
    )
  );

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.advogados_perfil (id, nome_completo, status, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.user_metadata->>'full_name', 'Usuário'),
    'ativo',
    COALESCE(NEW.user_metadata->>'role', 'advogado')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;   
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_advogados_perfil_updated_at 
BEFORE UPDATE ON advogados_perfil 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();