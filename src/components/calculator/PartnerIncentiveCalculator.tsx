"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Users,
  Percent,
  Trophy,
  Target,
  TrendingUp,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CALCULATOR, SLABS } from "@/lib/constants";
import { getSlabIndex } from "@/lib/slab-utils";

// ─── Animated Number Component ─────────────────────────────────
function AnimatedNumber({
  value,
  currency = true,
}: {
  value: number;
  currency?: boolean;
}) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) =>
    currency
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(Math.round(current))
      : Math.round(current).toString()
  );

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

// ─── Breakdown Card ────────────────────────────────────────────
interface CardProps {
  title: string;
  value: number;
  color: "blue" | "purple" | "orange";
  icon: React.ReactNode;
  delay?: number;
}

function BreakdownCard({ title, value, color, icon, delay = 0 }: CardProps) {
  const iconStyles = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn(
        "rounded-2xl p-5 border shadow-sm flex flex-col justify-between transition-transform hover:-translate-y-1 duration-300",
        "bg-white border-gray-100"
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("p-2 rounded-lg", iconStyles[color])}>{icon}</div>
        <span className="text-sm font-semibold text-gray-600 font-body">
          {title}
        </span>
      </div>

      <div className="text-2xl font-bold text-gray-900 font-heading">
        <AnimatedNumber value={value} />
      </div>

      <div
        className={cn(
          "h-1 w-full mt-4 rounded-full opacity-20",
          color === "blue"
            ? "bg-blue-500"
            : color === "purple"
            ? "bg-purple-500"
            : "bg-orange-500"
        )}
      />
    </motion.div>
  );
}

// ─── Main Calculator ───────────────────────────────────────────
interface PartnerIncentiveCalculatorProps {
  rsrPercentage?: number;
}

export function PartnerIncentiveCalculator({ rsrPercentage }: PartnerIncentiveCalculatorProps) {
  // State
  const [newUsers, setNewUsers] = useState(100);
  const [avgMargin, setAvgMargin] = useState(1000);
  const [leverage, setLeverage] = useState(25);
  const [tradesPerUser, setTradesPerUser] = useState(10);

  // Use dynamic RSR from props, fallback to default 20%
  const sharePercent = rsrPercentage ?? CALCULATOR.FIXED_REVENUE_SHARE;

  // Calculations
  const volPerUser = useMemo(
    () => avgMargin * leverage * tradesPerUser,
    [avgMargin, leverage, tradesPerUser]
  );

  const totalVolINR = useMemo(
    () => Math.max(0, newUsers * volPerUser),
    [newUsers, volPerUser]
  );

  const totalVolUSD = useMemo(
    () => totalVolINR / CALCULATOR.USD_RATE,
    [totalVolINR]
  );

  const acquisitionIncome = useMemo(
    () => Math.max(0, newUsers * CALCULATOR.ACQUISITION_BOUNTY),
    [newUsers]
  );

  const commissionIncome = useMemo(
    () => totalVolINR * CALCULATOR.FEE_PERCENT * (sharePercent / 100),
    [totalVolINR, sharePercent]
  );

  const slabIndex = useMemo(
    () => getSlabIndex(totalVolUSD),
    [totalVolUSD]
  );

  const slabIncome = useMemo(
    () => (slabIndex >= 0 ? SLABS[slabIndex].payout : 0),
    [slabIndex]
  );

  const netTotal = useMemo(
    () => acquisitionIncome + slabIncome + commissionIncome,
    [acquisitionIncome, slabIncome, commissionIncome]
  );

  // Confetti on tier-up
  const prevSlabIndexRef = useRef(slabIndex);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevSlabIndexRef.current = slabIndex;
      return;
    }

    if (slabIndex > prevSlabIndexRef.current) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10CF84", "#0033FF", "#FA4A29"],
      });
    }
    prevSlabIndexRef.current = slabIndex;
  }, [slabIndex]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-heading font-bold text-gray-900 tracking-tight">
          How Much Can I Earn
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 space-y-6">
            {/* New Users Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-gray-700 flex items-center gap-2 font-body text-sm">
                  <Users className="w-4 h-4 text-blue-500" />
                  New Users
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={newUsers}
                  onChange={(e) => {
                    const val = Math.min(
                      200,
                      Math.max(0, Number(e.target.value))
                    );
                    setNewUsers(val);
                  }}
                  className="w-16 text-center bg-blue-50 text-brand-primary px-2 py-1 rounded-full text-sm font-bold border border-blue-100 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none font-heading"
                />
              </div>

              <div className="relative pt-2">
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="1"
                  value={newUsers}
                  onChange={(e) => setNewUsers(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium font-body">
                  <span>0</span>
                  <span>100</span>
                  <span>200</span>
                </div>
              </div>
            </div>

            {/* Volume Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2 text-sm font-body">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Volume Calculation
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Average Margin per User */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider font-body">
                    AVG Margin/User
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                      ₹
                    </span>
                    <input
                      type="text"
                      value={new Intl.NumberFormat("en-IN").format(avgMargin)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        setAvgMargin(raw === "" ? 0 : Number(raw));
                      }}
                      className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium font-body"
                    />
                  </div>
                </div>

                {/* Leverage */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider font-body">
                    Leverage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={leverage === 0 ? "" : leverage}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          setLeverage(0);
                          return;
                        }
                        setLeverage(Number(val));
                      }}
                      onBlur={() => {
                        let finalVal = Math.max(1, Math.min(100, leverage));
                        if (leverage === 0) finalVal = 1;
                        setLeverage(finalVal);
                      }}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium font-body"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                      x
                    </span>
                  </div>
                </div>

                {/* Trades per Month per User */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider font-body">
                    Trades / Month / User
                  </label>
                  <input
                    type="text"
                    value={tradesPerUser}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "");
                      setTradesPerUser(raw === "" ? 0 : Number(raw));
                    }}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-gray-900 font-medium font-body"
                  />
                </div>
              </div>

              {/* Calculated Volume per User */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex justify-between items-center text-sm">
                <span className="text-emerald-700 font-medium font-body">
                  Calculated Volume / User
                </span>
                <span className="text-emerald-800 font-bold font-heading">
                  <AnimatedNumber value={volPerUser} />
                </span>
              </div>
            </div>

            {/* Revenue Share */}
            <div className="space-y-4">
              <label className="font-semibold text-gray-700 flex items-center gap-2 text-sm font-body">
                <Percent className="w-4 h-4 text-purple-500" />
                Revenue Share
              </label>
              <div className="flex bg-gray-100/80 p-1.5 rounded-2xl">
                <button
                  disabled
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-brand-primary bg-white shadow-sm border border-gray-200/50 font-heading"
                >
                  {sharePercent}%
                </button>
              </div>
            </div>

            {/* Total Volume */}
            <div className="pt-6 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-body">
                  Total Volume (INR)
                </span>
                <span className="font-medium text-gray-700 font-heading">
                  <AnimatedNumber value={totalVolINR} />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 space-y-4 flex flex-col">
          {/* Net Total Card */}
          <motion.div
            layout
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 lg:p-10 text-white relative overflow-hidden group border border-white/10 flex-grow flex flex-col justify-center min-h-[280px]"
          >
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-brand-accent/30 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl -ml-16 -mb-16 group-hover:bg-brand-primary/30 transition-colors duration-500" />

            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4">
              <h3 className="text-emerald-300 font-semibold tracking-wider uppercase text-xs flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-heading">
                <Trophy className="w-3 h-3" />
                Net Monthly Earnings
              </h3>
              <div className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight drop-shadow-lg font-heading">
                <AnimatedNumber value={netTotal} />
              </div>
              <p className="text-gray-400 text-sm md:text-base font-body">
                Total estimated payout based on current performance
              </p>
            </div>
          </motion.div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <BreakdownCard
              title="New Users"
              value={acquisitionIncome}
              icon={<Users className="w-4 h-4" />}
              color="blue"
              delay={0.1}
            />
            <BreakdownCard
              title="Volume Incentives"
              value={slabIncome}
              icon={<Target className="w-4 h-4" />}
              color="purple"
              delay={0.2}
            />
            <BreakdownCard
              title="Brokerage"
              value={commissionIncome}
              icon={<IndianRupee className="w-4 h-4" />}
              color="orange"
              delay={0.3}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
