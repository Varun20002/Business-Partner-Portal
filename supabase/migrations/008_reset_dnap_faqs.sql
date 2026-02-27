-- ═══════════════════════════════════════════════════════════════
-- Reset: DNAP Incentive Program FAQs (11)
-- Goal:
-- - Keep ONLY the DNAP FAQs listed below (remove any other FAQs)
-- - Ensure question/answer text + display_order match the latest campaign FAQ
-- ═══════════════════════════════════════════════════════════════

-- 1) Remove any FAQ not part of the DNAP set
DELETE FROM faqs
WHERE question NOT IN (
  'What is the DNAP Incentive Program?',
  'Who is a New Derivatives User (NDU)?',
  'What volume is required?',
  'How much incentive will I receive?',
  'What is the maximum payout?',
  'What is Baseline?',
  'What is Incremental Volume?',
  'What is the rebate offer?',
  'What is the maximum rebate?',
  'Does Options volume count for any Incentive?',
  'When will payout be credited for all incentives?'
);

-- 2) Replace DNAP FAQs to avoid duplicates and ensure latest content
DELETE FROM faqs
WHERE question IN (
  'What is the DNAP Incentive Program?',
  'Who is a New Derivatives User (NDU)?',
  'What volume is required?',
  'How much incentive will I receive?',
  'What is the maximum payout?',
  'What is Baseline?',
  'What is Incremental Volume?',
  'What is the rebate offer?',
  'What is the maximum rebate?',
  'Does Options volume count for any Incentive?',
  'When will payout be credited for all incentives?'
);

INSERT INTO faqs (question, answer, display_order)
VALUES
  (
    'What is the DNAP Incentive Program?',
    E'DNAP (Derivatives New Acquisition Program) is a special partner incentive program.

Business Partners earn ₹500 for every New Derivatives User (NDU) who completes ₹10 lakh derivatives trading volume in eligible products.',
    0
  ),
  (
    'Who is a New Derivatives User (NDU)?',
    E'An NDU (New Derivatives User) is:

• A newly referred user who places their first-ever Futures or US Stock Futures trade
• During 1 Feb 2026 – 31 March 2026

Even existing spot-only users are eligible if:

• They trade derivatives for the first time during the campaign period
• And complete ₹10 lakh derivatives volume',
    1
  ),
  (
    'What volume is required?',
    E'The referred user must complete:

• ₹10 lakh cumulative trading volume
• Only in Futures or US Stock Futures
• On or before 30 April 2026',
    2
  ),
  (
    'How much incentive will I receive?',
    E'You will receive:

• ₹500 per eligible NDU who meets the required derivatives volume.',
    3
  ),
  (
    'What is the maximum payout?',
    E'Maximum payout per partner:

• Maximum 200 NDUs will be counted
• Payout per NDU: ₹500

So the maximum total payout is:

• 200 × ₹500 = ₹1,00,000',
    4
  ),
  (
    'What is Baseline?',
    E'Baseline = Average monthly derivatives volume of the previous quarter.

Example (previous quarter volume):

• Oct: $5M
• Nov: $15M
• Dec: $10M

Baseline = ($5M + $15M + $10M) ÷ 3 = $10M average.

Your exact baseline number will be shared by the CoinDCX team and is final.',
    5
  ),
  (
    'What is Incremental Volume?',
    E'Incremental Volume is the extra derivatives volume you generate above your baseline in the current month.

Formula:

• Incremental Volume = Current month volume – Baseline

Example:

• Baseline = $10M
• Feb volume = $15M
• Incremental Volume = $15M – $10M = $5M',
    6
  ),
  (
    'What is the rebate offer?',
    E'Under the rebate offer, eligible Business Partners and their newly referred users get:

• Trading fee rebate on derivatives
• For the first 30 days from the user''s first derivatives trade
• Up to a maximum of ₹500 rebate per user',
    7
  ),
  (
    'What is the maximum rebate?',
    E'The maximum rebate under this offer is:

• ₹500 per user (cap on trading fee rebate).',
    8
  ),
  (
    'Does Options volume count for any Incentive?',
    E'No. Options volume does not count towards any DNAP incentives.

Only the following are eligible:

• Crypto Futures
• US Stock Futures',
    9
  ),
  (
    'When will payout be credited for all incentives?',
    E'All incentive payouts will be credited:

• Within 30 days after the campaign month ends
• Subject to internal validation and reconciliation by CoinDCX.',
    10
  );

