-- Profiles Table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger to automatically assign user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', new.email));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Products Table
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Reports (Laporan Keuangan)
CREATE TABLE public.financial_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    is_attached BOOLEAN DEFAULT false,
    credit NUMERIC DEFAULT 0,
    debit NUMERIC DEFAULT 0,
    notes TEXT,
    balance NUMERIC DEFAULT 0,
    source_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales Reports (Laporan Penjualan)
CREATE TABLE public.sales_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER DEFAULT 1,
    price NUMERIC NOT NULL,
    shipping_cost NUMERIC DEFAULT 0,
    is_attached BOOLEAN DEFAULT false,
    notes TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses (List Pengeluaran)
CREATE TABLE public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    price NUMERIC NOT NULL,
    is_attached BOOLEAN DEFAULT false,
    notes TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- AUTOMATIC SYNC TRIGGERS
-- ==========================================

-- Function to Sync Sales to Financial Reports
CREATE OR REPLACE FUNCTION public.sync_sale_to_finance()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.financial_reports (profile_id, date, description, debit, credit, notes, is_attached, source_id, created_at)
        VALUES (
            NEW.profile_id, 
            NEW.date, 
            'Penjualan Produk (Otomatis)', 
            (NEW.price + COALESCE(NEW.shipping_cost, 0)), 
            0, 
            NEW.notes, 
            NEW.is_attached, 
            NEW.id,
            NEW.created_at
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE public.financial_reports 
        SET 
            date = NEW.date,
            debit = (NEW.price + COALESCE(NEW.shipping_cost, 0)),
            notes = NEW.notes,
            is_attached = NEW.is_attached
        WHERE source_id = NEW.id;
    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM public.financial_reports WHERE source_id = OLD.id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Sales
DROP TRIGGER IF EXISTS trg_sync_sales ON public.sales_reports;
CREATE TRIGGER trg_sync_sales
AFTER INSERT OR UPDATE OR DELETE ON public.sales_reports
FOR EACH ROW EXECUTE PROCEDURE public.sync_sale_to_finance();

-- Function to Sync Expenses to Financial Reports
CREATE OR REPLACE FUNCTION public.sync_expense_to_finance()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.financial_reports (profile_id, date, description, debit, credit, notes, is_attached, source_id, created_at)
        VALUES (
            NEW.profile_id, 
            NEW.date, 
            'Pembelian: ' || NEW.product_name, 
            0, 
            NEW.price, 
            NEW.notes, 
            NEW.is_attached, 
            NEW.id,
            NEW.created_at
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE public.financial_reports 
        SET 
            date = NEW.date,
            description = 'Pembelian: ' || NEW.product_name,
            credit = NEW.price,
            notes = NEW.notes,
            is_attached = NEW.is_attached
        WHERE source_id = NEW.id;
    ELSIF (TG_OP = 'DELETE') THEN
        DELETE FROM public.financial_reports WHERE source_id = OLD.id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for Expenses
DROP TRIGGER IF EXISTS trg_sync_expenses ON public.expenses;
CREATE TRIGGER trg_sync_expenses
AFTER INSERT OR UPDATE OR DELETE ON public.expenses
FOR EACH ROW EXECUTE PROCEDURE public.sync_expense_to_finance();
