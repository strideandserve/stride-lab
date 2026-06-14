alter table profiles add column if not exists birth_year integer default null;
alter table profiles add column if not exists gender text default null;
alter table profiles add column if not exists height_in numeric default null;
alter table profiles add column if not exists weight_lb numeric default null;
