
-- 1) Knowledge base table for Gemini coaching
create table if not exists public.ai_guides (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh
drop trigger if exists set_ai_guides_updated_at on public.ai_guides;
create trigger set_ai_guides_updated_at
before update on public.ai_guides
for each row execute function public.update_updated_at_column();

-- Enable RLS and grant read-only access to authenticated users
alter table public.ai_guides enable row level security;

drop policy if exists "Authenticated users can read guides" on public.ai_guides;
create policy "Authenticated users can read guides"
on public.ai_guides
for select
using (auth.uid() is not null);

-- No insert/update/delete policies = write access only via service role or SQL console

-- Optional: helpful indexes
create index if not exists ai_guides_is_active_idx on public.ai_guides (is_active);
create index if not exists ai_guides_created_at_idx on public.ai_guides (created_at desc);
create index if not exists ai_guides_tags_idx on public.ai_guides using gin (tags);

-- 2) Seed your budgeting guide
insert into public.ai_guides (slug, title, content, tags)
values (
  'budgeting-comprehensive-v1',
  'Comprehensive Guide to Financial Budgeting: From Beginner to Expert',
  $$
Comprehensive Guide to Financial Budgeting: From Beginner to Expert

This guide provides a structured list of educational topics and key questions designed to help individuals create, maintain, and optimize a financial budget. It's organized progressively, starting with foundational concepts for beginners and advancing to sophisticated strategies for experts. The goal is to build skills over time, turning budgeting into a habitual, data-driven practice that supports long-term financial health.

Each level includes:
- Educational Topics: Core concepts to learn.
- Key Questions: Prompts for self-reflection or discussion to apply the knowledge.
- Practical Exercises: Actionable steps to reinforce learning.

Beginner Level: Building the Basics (Focus on Awareness and Simple Setup)
Educational Topics:
1. Definition and purpose of a budget (a plan for income allocation to needs, wants, and savings).
2. Difference between fixed vs. variable expenses.
3. Basic income sources (salary, freelance, etc.) and how to calculate net income after taxes.
4. Emergency funds: Why start one and how much to aim for initially (1-3 months of expenses).
5. Common budgeting myths (e.g., "Budgeting is restrictive" vs. "It provides freedom").
6. Tools for beginners: Free apps like Mint, spreadsheets, or paper trackers.

Key Questions:
1. What are my monthly income sources, and how much do I take home after deductions?
2. What are my essential needs (rent, food, utilities) vs. wants (dining out, subscriptions)?
3. How much am I spending on non-essentials each month?
4. Do I have any debt, and what's the minimum payment required?
5. What small changes can I make to reduce unnecessary expenses?

Practical Exercises:
- Track all expenses for one week using a notebook or app.
- Create a simple one-month budget template dividing income into 50% needs, 30% wants, 20% savings/debt (50/30/20 rule).
- Set one short-term goal, like saving $100 for an emergency fund.

Intermediate Level: Refining and Automating (Focus on Habits and Adjustments)
Educational Topics:
1. Categorizing expenses in detail (housing, transportation, entertainment) and setting limits per category.
2. Tracking methods: Zero-based budgeting vs. envelope system.
3. Inflation and cost-of-living adjustments: How to factor in rising prices.
4. Debt management strategies (snowball vs. avalanche).
5. Financial goals: Short-term, medium-term, long-term.
6. Basic tax implications: Deductions, credits, and how they affect budgeting.
7. Using technology: Bank integrations, overspending alerts, automated transfers to savings.

Key Questions:
1. How do my actual expenses compare to my budgeted amounts over the past month?
2. What unexpected expenses have arisen, and how can I plan for them in the future?
3. Am I allocating enough toward debt repayment to minimize interest?
4. What are my top three financial goals, and how much do I need to save monthly for each?
5. How can I automate my budget to reduce manual effort (e.g., auto-pay bills)?
6. Are there areas where I can negotiate lower costs (e.g., insurance, subscriptions)?

Practical Exercises:
- Review three months of bank statements to identify spending trends and adjust categories.
- Build a six-month budget forecast, including seasonal expenses like holidays.
- Experiment with a budgeting app to set up category alerts and auto-savings.

Advanced/Expert Level: Optimization and Strategy (Focus on Wealth Building and Risk Management)
Educational Topics:
1. Advanced frameworks: Rolling budgets, scenario-based planning.
2. Investment integration: Budgeting for stocks, bonds, retirement accounts (401(k), IRA), diversification.
3. Tax optimization: Roth conversions, charitable giving, loss harvesting.
4. Risk assessment: Insurance needs and a comprehensive net worth statement.
5. Behavioral finance: Biases like impulse spending and over-optimism.
6. Scaling complexity: Families, businesses, multiple income streams.
7. Metrics and KPIs: Net worth growth, savings rate, debt-to-income ratio.
8. Economic factors: Interest rates, market volatility, global events.

Key Questions:
1. What's my current savings rate, and how can I increase it to 30%+ without sacrificing quality of life?
2. How diversified is my investment portfolio, and does my budget support regular contributions?
3. What scenarios (recession, medical emergency) could derail my budget, and what's my contingency plan?
4. Am I maximizing tax-advantaged accounts, and how can I adjust allocations?
5. How does my budget align with long-term goals like early retirement or philanthropy?
6. What data analytics can I use to predict future cash flow?
7. Are there opportunities for side income, and how would that integrate into my budget?

Practical Exercises:
- Create a multi-year budget projection using spreadsheets with formulas for compound interest.
- Conduct a quarterly budget audit against benchmarks like average savings rates.
- Simulate scenarios (e.g., 20% income drop) and adjust your budget accordingly.
- Integrate budgeting with investment tracking tools to monitor portfolio performance.

Essential Elements for an AI's Knowledge Base on Financial Budgeting
- Core Principles: Budgeting methodologies (50/30/20, zero-based, pay-yourself-first), financial ratios (emergency fund coverage, debt-to-income <36%), psychological aspects (anchoring bias).
- Tools and Resources: Popular apps (YNAB, PocketGuard), templates (Excel/Google Sheets), free resources (Khan Academy, CFPB).
- Legal/Regulatory: Basics of taxes, consumer rights, region-specific norms.
- Data Handling: Secure processing, visualizations, calculations (e.g., FV = PV(1+r)^n).
- Personalization: Adapt advice to demographics, life stages, and economic contexts.
- Ethics: Privacy, non-judgmental guidance, recommend consulting professionals when needed.
- Updates: Real-time economic awareness with pointers to verified sources.

Prompts for a Guided User Experience
1. Beginner Onboarding: "Let's start with the basics. What is your monthly take-home income? List your top 5 expenses, and I'll help categorize them into a simple budget."
2. Habit Building: "Based on your tracking last week, where did you overspend? What one change can you commit to this month?"
3. Goal Setting: "What are your short-term and long-term financial goals? Let's calculate how much you need to save weekly to achieve them."
4. Adjustment Check-In: "How has your budget performed this month? Share any unexpected costs, and I'll suggest tweaks."
5. Advanced Optimization: "Upload your last three months' expenses (anonymized), and I'll analyze trends to recommend investment allocations or cost-cutting strategies."
6. Scenario Planning: "Imagine your income drops by 10%—how would you adjust? Let's model it together."
7. Review and Scale: "On a scale of 1-10, how confident are you in your budget? What expert-level topic do you want to explore next?"
$$,
  array['budgeting','goals','prompting','beginner','intermediate','advanced','coach']
)
on conflict (slug) do update
set title = excluded.title,
    content = excluded.content,
    tags = excluded.tags,
    is_active = true,
    updated_at = now();
