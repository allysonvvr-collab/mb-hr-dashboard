-- ============================================================
-- MACARIO BROTHERS HR DASHBOARD — SUPABASE SCHEMA
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- 1. USER PROFILES & ROLES
-- ============================================================
create type user_role as enum ('super_admin', 'admin', 'user');

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role user_role default 'user',
  avatar_initials text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case
      when new.email = 'office@macariobrotherslawncare.com' then 'super_admin'::user_role
      else 'user'::user_role
    end
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 2. EMPLOYEES
-- ============================================================
create table employees (
  id bigserial primary key,
  name text not null,
  role text not null default 'Crew Member',
  phone text,
  email text,
  start_date date,
  birthday text,
  wage numeric(8,2) default 15.00,
  strikes integer default 0,
  avatar text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. APPLICANTS (HIRING)
-- ============================================================
create table applicants (
  id bigserial primary key,
  name text not null,
  role text default 'Crew Member',
  phone text,
  email text,
  applied_date date default current_date,
  status text default 'Applied'
    check (status in ('Applied','Phone Screen','Interview','Offer','Hired','Rejected')),
  stars integer default 3 check (stars between 1 and 5),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. TIME OFF
-- ============================================================
create table time_off (
  id bigserial primary key,
  employee_id bigint references employees(id) on delete cascade,
  type text default 'Vacation'
    check (type in ('Vacation','Sick','Personal','Other')),
  dates text,
  days integer default 1,
  status text default 'Pending'
    check (status in ('Pending','Approved','Denied')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. RAISES
-- ============================================================
create table raises (
  id bigserial primary key,
  employee_id bigint references employees(id) on delete cascade,
  raise_date date default current_date,
  previous_rate numeric(8,2),
  new_rate numeric(8,2),
  increase numeric(8,2),
  reason text,
  created_at timestamptz default now()
);

-- 6. INCIDENTS
-- ============================================================
create table incidents (
  id bigserial primary key,
  employee_id bigint references employees(id) on delete cascade,
  incident_date date default current_date,
  description text,
  cost numeric(10,2) default 0,
  status text default 'Open' check (status in ('Open','Closed')),
  doc_signed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. CERTIFICATIONS
-- ============================================================
create table certifications (
  id bigserial primary key,
  employee_id bigint references employees(id) on delete cascade,
  name text not null,
  earned_date date,
  expires_date date,
  status text default 'Active'
    check (status in ('Active','Expired','In Progress','Pending Renewal')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. UNIFORMS
-- ============================================================
create table uniforms (
  id bigserial primary key,
  employee_id bigint references employees(id) on delete cascade,
  item text not null,
  size text,
  qty integer default 1,
  issued_date date default current_date,
  status text default 'Good'
    check (status in ('Good','Needs Replacement','Lost','Returned')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. REVIEWS
-- ============================================================
create table reviews (
  id bigserial primary key,
  employee_id bigint references employees(id) on delete cascade,
  review_date date default current_date,
  rating integer check (rating between 1 and 5),
  punctuality integer check (punctuality between 1 and 5),
  quality integer check (quality between 1 and 5),
  attitude integer check (attitude between 1 and 5),
  teamwork integer check (teamwork between 1 and 5),
  notes text,
  reviewed_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 10. PERFORMANCE
-- ============================================================
create table performance (
  id bigserial primary key,
  employee_id bigint references employees(id) on delete cascade,
  month text not null,
  jobs_completed integer default 0,
  complaints integer default 0,
  rating integer check (rating between 1 and 5),
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table employees enable row level security;
alter table applicants enable row level security;
alter table time_off enable row level security;
alter table raises enable row level security;
alter table incidents enable row level security;
alter table certifications enable row level security;
alter table uniforms enable row level security;
alter table reviews enable row level security;
alter table performance enable row level security;

-- Helper function: get current user's role
create or replace function get_my_role()
returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- PROFILES policies
create policy "Users can read all profiles" on profiles for select to authenticated using (true);
create policy "Users can update own profile" on profiles for update to authenticated using (auth.uid() = id);
create policy "Admins can update any profile" on profiles for update to authenticated using (get_my_role() in ('super_admin','admin'));

-- EMPLOYEES policies (all authenticated users can read; admin+ can write)
create policy "Auth users read employees" on employees for select to authenticated using (true);
create policy "Admin can insert employees" on employees for insert to authenticated with check (get_my_role() in ('super_admin','admin'));
create policy "Admin can update employees" on employees for update to authenticated using (get_my_role() in ('super_admin','admin'));
create policy "Super admin can delete employees" on employees for delete to authenticated using (get_my_role() = 'super_admin');

-- APPLICANTS policies
create policy "Auth users read applicants" on applicants for select to authenticated using (true);
create policy "Admin can insert applicants" on applicants for insert to authenticated with check (get_my_role() in ('super_admin','admin'));
create policy "Admin can update applicants" on applicants for update to authenticated using (get_my_role() in ('super_admin','admin'));
create policy "Admin can delete applicants" on applicants for delete to authenticated using (get_my_role() in ('super_admin','admin'));

-- TIME OFF policies
create policy "Auth users read time_off" on time_off for select to authenticated using (true);
create policy "Auth users insert time_off" on time_off for insert to authenticated with check (true);
create policy "Admin can update time_off" on time_off for update to authenticated using (get_my_role() in ('super_admin','admin'));
create policy "Admin can delete time_off" on time_off for delete to authenticated using (get_my_role() in ('super_admin','admin'));

-- RAISES policies
create policy "Auth users read raises" on raises for select to authenticated using (true);
create policy "Admin can insert raises" on raises for insert to authenticated with check (get_my_role() in ('super_admin','admin'));
create policy "Admin can delete raises" on raises for delete to authenticated using (get_my_role() in ('super_admin','admin'));

-- INCIDENTS policies
create policy "Auth users read incidents" on incidents for select to authenticated using (true);
create policy "Admin can manage incidents" on incidents for all to authenticated using (get_my_role() in ('super_admin','admin'));

-- CERTIFICATIONS policies
create policy "Auth users read certs" on certifications for select to authenticated using (true);
create policy "Admin can manage certs" on certifications for all to authenticated using (get_my_role() in ('super_admin','admin'));

-- UNIFORMS policies
create policy "Auth users read uniforms" on uniforms for select to authenticated using (true);
create policy "Admin can manage uniforms" on uniforms for all to authenticated using (get_my_role() in ('super_admin','admin'));

-- REVIEWS policies
create policy "Auth users read reviews" on reviews for select to authenticated using (true);
create policy "Admin can manage reviews" on reviews for all to authenticated using (get_my_role() in ('super_admin','admin'));

-- PERFORMANCE policies
create policy "Auth users read performance" on performance for select to authenticated using (true);
create policy "Admin can manage performance" on performance for all to authenticated using (get_my_role() in ('super_admin','admin'));

-- ============================================================
-- SEED SAMPLE DATA
-- ============================================================
insert into employees (name, role, phone, email, start_date, birthday, wage, strikes, avatar) values
('Mike Torres',    'Foreman',        '(555) 210-4401', 'mike.torres@yourco.com',  '2021-03-14', 'Jul 21', 24.50, 0, 'MT'),
('Jake Ramos',     'Crew Leader',    '(555) 318-7723', 'jake.ramos@yourco.com',   '2022-05-01', 'Apr 2',  20.00, 0, 'JR'),
('Derek Williams', 'Crew Member',    '(555) 407-9812', 'derek.w@yourco.com',      '2023-02-19', 'Dec 14', 17.00, 1, 'DW'),
('Aiden Park',     'Crew Member',    '(555) 512-3345', 'aiden.p@yourco.com',      '2023-06-09', 'Sep 7',  16.00, 0, 'AP'),
('Luis Garcia',    'Crew Member',    '(555) 623-8810', 'luis.g@yourco.com',       '2024-02-29', 'Jan 29', 16.50, 0, 'LG'),
('Mia Thompson',   'Office Manager', '(555) 714-2209', 'mia.t@yourco.com',        '2020-08-11', 'Mar 16', 28.00, 0, 'MT'),
('Sam Peters',     'Crew Member',    '(555) 819-5534', 'sam.p@yourco.com',        '2024-04-21', 'Jul 4',  15.50, 2, 'SP');

insert into applicants (name, role, phone, email, applied_date, status, stars, notes) values
('Tyrell Johnson', 'Crew Member',    '(555) 901-2233', 'tjohnson@gmail.com',   '2026-05-14', 'Interview',    4, '2 yrs landscaping at GreenEdge. Strong reference from prior supervisor.'),
('Bobby Chen',     'Crew Leader',    '(555) 342-8811', 'bobby.chen@gmail.com', '2026-05-21', 'Phone Screen', 3, 'Former crew lead at TruGreen. Left due to lack of growth.'),
('Amanda Flores',  'Office Assistant','(555) 210-6612','aflores@hotmail.com',  '2026-05-31', 'Applied',      5, '3 yrs admin experience, familiar with scheduling software.'),
('Devon King',     'Crew Member',    '(555) 430-9921', 'd.king@gmail.com',     '2026-06-07', 'Rejected',     2, 'No outdoor experience. No-showed first interview.');

insert into raises (employee_id, raise_date, previous_rate, new_rate, increase, reason) values
(1, '2025-06-28', 22.00, 24.50, 2.50, 'Promotion to Foreman + annual review'),
(2, '2025-06-26', 18.50, 20.00, 1.50, 'Annual raise – strong season'),
(6, '2025-06-26', 26.00, 28.00, 2.00, 'Annual raise – took on payroll duties'),
(3, '2025-06-26', 16.00, 17.00, 1.00, 'Annual raise – 1yr milestone'),
(4, '2025-06-26', 15.00, 16.00, 1.00, 'Annual raise'),
(6, '2024-06-27', 24.00, 26.00, 2.00, 'Annual raise + expanded duties'),
(1, '2024-06-27', 20.00, 22.00, 2.00, 'Annual raise – crew leader recognition');

insert into incidents (employee_id, incident_date, description, cost, status, doc_signed) values
(3, '2026-05-13', 'Backed trailer into mailbox at 221 Oak St. Mailbox destroyed.', 185, 'Closed', true),
(7, '2026-06-01', 'Mower deck struck sprinkler head at Riverside HOA. Head cracked.', 95, 'Open', false),
(2, '2025-04-27', 'Minor curb scrape on company truck #3 pulling out of the lot.', 650, 'Closed', true);

insert into certifications (employee_id, name, earned_date, expires_date, status) values
(1, 'OSHA 10',                   '2022-04-09', null,         'Active'),
(1, 'Pesticide Applicator License','2023-02-28','2027-02-28','Active'),
(2, 'OSHA 10',                   '2023-06-14', null,         'Active'),
(6, 'QuickBooks Certified',      '2021-11-19', '2024-11-19', 'Expired'),
(5, 'Pesticide Applicator License', null,       null,         'In Progress');

insert into time_off (employee_id, type, dates, days, status, notes) values
(1, 'Vacation', 'Jul 2 – Jul 6',   5, 'Approved', 'Fourth of July week'),
(3, 'Sick',     'Jun 8',           1, 'Approved', '—'),
(5, 'Personal', 'Jun 19',          1, 'Pending',  'Family appointment'),
(7, 'Vacation', 'Aug 9 – Aug 13',  5, 'Pending',  'Family trip');

insert into uniforms (employee_id, item, size, qty, issued_date, status) values
(1, 'Polo Shirt', 'L',        3, '2025-03-01', 'Good'),
(1, 'Hat',        'One Size', 2, '2025-03-01', 'Good'),
(2, 'Polo Shirt', 'M',        3, '2025-03-01', 'Good'),
(3, 'Polo Shirt', 'XL',       2, '2025-06-01', 'Needs Replacement'),
(4, 'Polo Shirt', 'S',        3, '2025-06-01', 'Good'),
(5, 'Polo Shirt', 'L',        3, '2025-06-01', 'Good'),
(6, 'Polo Shirt', 'S',        2, '2025-01-15', 'Good'),
(7, 'Polo Shirt', 'M',        2, '2025-05-01', 'Good');

insert into performance (employee_id, month, jobs_completed, complaints, rating) values
(1, 'May 2026', 42, 0, 5),
(2, 'May 2026', 38, 1, 4),
(3, 'May 2026', 29, 2, 3),
(4, 'May 2026', 31, 0, 4),
(5, 'May 2026', 33, 0, 4),
(7, 'May 2026', 22, 3, 2);
