-- ============================================================
-- 又又模块 Phase 2-5: 身体发育 + 健康管理(疫苗 + 就医)
-- ============================================================

-- helper: auto-update updated_at on row change
create or replace function youyou_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── 身体发育记录 ─────────────────────────────────────────
create table if not exists youyou_growth_records (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  height_cm   numeric(5,1),
  weight_kg   numeric(5,2),
  head_cm     numeric(5,1),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(date)
);

alter table youyou_growth_records enable row level security;
create policy "growth_records_select" on youyou_growth_records for select using (true);
create policy "growth_records_insert" on youyou_growth_records for insert with check (auth.role() = 'authenticated');
create policy "growth_records_update" on youyou_growth_records for update using (auth.role() = 'authenticated');
create policy "growth_records_delete" on youyou_growth_records for delete using (auth.role() = 'authenticated');

create trigger trg_youyou_growth_records_updated_at
  before update on youyou_growth_records
  for each row execute function youyou_set_updated_at();

-- ── 疫苗接种记录 ─────────────────────────────────────────
create table if not exists youyou_vaccinations (
  id              uuid primary key default gen_random_uuid(),
  vaccine_name    text not null,
  dose_number     int not null default 1,
  scheduled_date  date,
  actual_date     date,
  location        text,
  notes           text,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table youyou_vaccinations enable row level security;
create policy "vaccinations_select" on youyou_vaccinations for select using (true);
create policy "vaccinations_insert" on youyou_vaccinations for insert with check (auth.role() = 'authenticated');
create policy "vaccinations_update" on youyou_vaccinations for update using (auth.role() = 'authenticated');
create policy "vaccinations_delete" on youyou_vaccinations for delete using (auth.role() = 'authenticated');

create trigger trg_youyou_vaccinations_updated_at
  before update on youyou_vaccinations
  for each row execute function youyou_set_updated_at();

-- ── 就医记录 ─────────────────────────────────────────────
create table if not exists youyou_medical_records (
  id          uuid primary key default gen_random_uuid(),
  date        date not null,
  type        text not null default 'checkup',
  title       text not null,
  symptoms    text,
  diagnosis   text,
  treatment   text,
  hospital    text,
  doctor      text,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table youyou_medical_records enable row level security;
create policy "medical_records_select" on youyou_medical_records for select using (true);
create policy "medical_records_insert" on youyou_medical_records for insert with check (auth.role() = 'authenticated');
create policy "medical_records_update" on youyou_medical_records for update using (auth.role() = 'authenticated');
create policy "medical_records_delete" on youyou_medical_records for delete using (auth.role() = 'authenticated');

create trigger trg_youyou_medical_records_updated_at
  before update on youyou_medical_records
  for each row execute function youyou_set_updated_at();

-- ── 预置中国国家免疫规划疫苗（又又生日 2025-04-17）────────
-- 按接种时间排序
insert into youyou_vaccinations (vaccine_name, dose_number, scheduled_date, sort_order) values
  -- 出生
  ('乙肝疫苗', 1, '2025-04-17', 1),
  ('卡介苗',   1, '2025-04-17', 2),
  -- 1月龄
  ('乙肝疫苗', 2, '2025-05-17', 3),
  -- 2月龄
  ('脊灰灭活疫苗 (IPV)', 1, '2025-06-17', 4),
  -- 3月龄
  ('脊灰减毒疫苗 (bOPV)', 1, '2025-07-17', 5),
  ('百白破疫苗 (DTaP)',   1, '2025-07-17', 6),
  -- 4月龄
  ('脊灰减毒疫苗 (bOPV)', 2, '2025-08-17', 7),
  ('百白破疫苗 (DTaP)',   2, '2025-08-17', 8),
  -- 5月龄
  ('百白破疫苗 (DTaP)',   3, '2025-09-17', 9),
  -- 6月龄
  ('乙肝疫苗', 3, '2025-10-17', 10),
  ('A群流脑多糖疫苗', 1, '2025-10-17', 11),
  -- 8月龄
  ('麻腮风疫苗 (MMR)', 1, '2025-12-17', 12),
  ('乙脑灭活疫苗',     1, '2025-12-17', 13),
  -- 9月龄
  ('A群流脑多糖疫苗', 2, '2026-01-17', 14),
  -- 12月龄
  ('乙脑灭活疫苗', 2, '2026-04-17', 15),
  -- 18月龄
  ('百白破疫苗 (DTaP)', 4, '2026-10-17', 16),
  ('麻腮风疫苗 (MMR)',  2, '2026-10-17', 17),
  ('甲肝灭活疫苗',     1, '2026-10-17', 18),
  -- 24月龄
  ('甲肝灭活疫苗', 2, '2027-04-17', 19),
  ('乙脑灭活疫苗', 3, '2027-04-17', 20),
  -- 3岁
  ('A+C群流脑多糖疫苗', 1, '2028-04-17', 21),
  -- 4岁
  ('脊灰减毒疫苗 (bOPV)', 3, '2029-04-17', 22),
  -- 6岁
  ('白破疫苗 (DT)',       1, '2031-04-17', 23),
  ('A+C群流脑多糖疫苗',   2, '2031-04-17', 24),
  ('乙脑灭活疫苗',        4, '2031-04-17', 25);
