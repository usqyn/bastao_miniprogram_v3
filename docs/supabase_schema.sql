-- ============================================
-- 巴丝淘客户线索管理 - Supabase 数据库脚本
-- ============================================

-- 1. 创建客户线索表
create table if not exists customers (
  id bigint primary key generated always as identity,
  name text not null,
  phone text not null,
  wechat text,
  type text,
  content text,
  status text default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone
);

-- 2. 创建索引加速查询
create index if not exists customers_status_idx on customers(status);
create index if not exists customers_created_at_idx on customers(created_at desc);

-- 3. 启用行级安全 (RLS)
alter table customers enable row level security;

-- 4. 配置安全策略
-- 允许匿名用户插入（小程序提交表单）
create policy "Allow anonymous insert" on customers
  for insert to anon with check (true);

-- 允许匿名用户查询（后台管理）
create policy "Allow anonymous select" on customers
  for select to anon using (true);

-- 允许匿名用户更新
create policy "Allow anonymous update" on customers
  for update to anon using (true);

-- 允许匿名用户删除
create policy "Allow anonymous delete" on customers
  for delete to anon using (true);

-- ============================================
-- 完成！现在可以：
-- 1. 在小程序中提交客户线索
-- 2. 在后台管理中查看和管理线索
-- ============================================
