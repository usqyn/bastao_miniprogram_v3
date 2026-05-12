# Supabase 配置指南

## 第一步：创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 **Start your project** 或 **New Project**
3. 填写项目信息：
   - **Name**: `bastao-leads` (或任意名称)
   - **Database Password**: 设置一个强密码（记住它）
   - **Region**: 选择 `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`
4. 点击 **Create new project**，等待项目创建完成（约 2 分钟）

---

## 第二步：获取 API 密钥

1. 进入项目后，点击左侧菜单 **Settings** (齿轮图标)
2. 点击 **API**
3. 复制以下两个值：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 第三步：创建数据库表

1. 点击左侧菜单 **SQL Editor**
2. 点击 **New query**
3. 复制粘贴以下 SQL 脚本：

```sql
-- 创建客户线索表
create table customers (
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

-- 创建索引加速查询
create index customers_status_idx on customers(status);
create index customers_created_at_idx on customers(created_at desc);

-- 启用行级安全 (RLS)
alter table customers enable row level security;

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
```

4. 点击 **Run** 执行脚本

---

## 第四步：更新小程序配置

修改 `config/supabase.js` 文件：

```javascript
const SUPABASE_URL = 'https://你的项目ID.supabase.co'
const SUPABASE_ANON_KEY = '你的anon-key'

module.exports = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY
}
```

---

## 第五步：测试

1. 在微信开发者工具中打开小程序
2. 进入 **获取方案** 页面
3. 填写表单并提交
4. 进入 **后台管理** 页面 (`/pages/admin-leads/admin-leads`)
5. 查看是否显示刚才提交的数据

---

## 常见问题

### Q: 提交失败怎么办？
A: 检查以下几点：
- Supabase URL 和 Key 是否正确
- 数据库表是否创建成功
- RLS 策略是否正确配置

### Q: 如何查看数据？
A: 在 Supabase 控制台点击 **Table Editor** → **customers**

### Q: 如何导出数据？
A: 在 Table Editor 中点击右上角 **Export** 按钮

---

## 安全建议

生产环境建议：
1. 使用 Supabase Auth 进行用户认证
2. 为管理员创建单独的认证策略
3. 限制 anon key 的权限范围
