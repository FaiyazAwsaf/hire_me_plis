"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useInView } from "framer-motion";
import { 
  BrainCircuit, 
  MessageSquare, 
  FolderUp, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  Target, 
  Layers, 
  LineChart 
} from "lucide-react";

// Sample tags based on your video
const TAGS_DATA = [
  { text: "Investment Banker" },
  { text: "Management Consultant" },
  { text: "Quantitative Trader" },
  { text: "AI Engineer" },
  { text: "Creative Director" },
  { text: "Corporate Lawyer" },
  { text: "Product Manager" },
  { text: "Venture Capitalist" },
  { text: "Data Scientist" },
  { text: "Chief of Staff" },
  { text: "Growth Marketing Director" },
  { text: "Solutions Architect" },
  { text: "Private Equity Analyst" },
  { text: "UX Architect" },
  { text: "Blockchain Architect" },
  { text: "Machine Learning Scientist" },
  { text: "Strategy Director" },
  { text: "Sedge Fund Analyst" },
  { text: "DevOps Architect" },
  { text: "Information Security Officer" },
  { text: "Engineering Manager" },
  { text: "SaaS Executive" },
  { text: "Financial Engineer" }
];

// Feature dataset explicitly tracking requested features with matching premium icons
const FEATURES_DATA = [
  {
    title: "Job Hunter",
    description: "Deploy semantic search agents across live pipelines to gather tailored role openings matching your exact intent.",
    direction: "left",
    icon: <BrainCircuit className="h-5 w-5 text-red-500" />,
    iconBg: "bg-red-50 border-red-100/50"
  },
  {
    title: "AI Chat",
    description: "Consult your conversational co-pilot, grounded directly by your background data nodes for contextual insights.",
    direction: "right",
    icon: <MessageSquare className="h-5 w-5 text-blue-500" />,
    iconBg: "bg-blue-50 border-blue-100/50"
  },
  {
    title: "CV Builder",
    description: "Ingest, split, and embed resume data directly into a dedicated vector store for real-time document mapping.",
    direction: "left",
    icon: <FolderUp className="h-5 w-5 text-emerald-500" />,
    iconBg: "bg-emerald-50 border-emerald-100/50"
  },
  {
    title: "AI Nudges",
    description: "Receive priority system flags alerting you to critical roadmap changes and fast-approaching openings.",
    direction: "right",
    icon: <Sparkles className="h-5 w-5 text-purple-500" />,
    iconBg: "bg-purple-50 border-purple-100/50"
  },
  {
    title: "Fit Score",
    description: "Evaluate your alignment with comprehensive percentage checks and deep, qualitative skill breakdown indices.",
    direction: "left",
    icon: <TrendingUp className="h-5 w-5 text-orange-500" />,
    iconBg: "bg-orange-50 border-orange-100/50"
  },
  {
    title: "Calendar & To-Do",
    description: "Keep step with deadline track elements and operational logs seamlessly integrated inside your workspace view.",
    direction: "right",
    icon: <Calendar className="h-5 w-5 text-indigo-500" />,
    iconBg: "bg-indigo-50 border-indigo-100/50"
  },
  {
    title: "Goal Settings",
    description: "Configure specific iteration tasks like tracking applications or courses to hit performance benchmarks.",
    direction: "left",
    icon: <Target className="h-5 w-5 text-rose-500" />,
    iconBg: "bg-rose-50 border-rose-100/50"
  },
  {
    title: "Kanban Application Tracker",
    description: "Organize your pipeline into functional stages: Applied, Interviewing, Offer, and Rejected.",
    direction: "right",
    icon: <Layers className="h-5 w-5 text-amber-500" />,
    iconBg: "bg-amber-50 border-amber-100/50"
  },
  {
    title: "Progress Dashboard",
    description: "Aggregate core production analytics including total metrics, skills metadata, and active streak markers.",
    direction: "left",
    icon: <LineChart className="h-5 w-5 text-cyan-500" />,
    iconBg: "bg-cyan-50 border-cyan-100/50"
  }
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out mouse tracking
  const smoothMouseX = useSpring(mouseX, { stiffness: 120, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 120, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Calculate mouse position relative to the container center
      mouseX.set(e.clientX - rect.left - rect.width / 2);
      mouseY.set(e.clientY - rect.top - rect.height / 2);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <main 
      ref={containerRef} 
      className="relative w-full min-h-screen bg-white text-gray-900 overflow-x-hidden font-sans select-none text-left"
    >
      {/* --- HERO TRACKING CANVAS CONTAINER --- */}
      <div className="relative w-full h-screen overflow-hidden flex items-center justify-center">
        {/* --- HEADER NAVBAR --- */}
        <header className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-5 max-w-7xl left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-12">
            {/* Replaced Wellfound logo with CareerPilot */}
            <Link href="/" className="flex items-center text-2xl font-black tracking-tight text-black cursor-pointer">
              Hire Me Plis<span className="text-red-500 font-extrabold ml-0.5">:</span>
            </Link>
          </div>

          {/* --- ACTIONS BUTTONS --- */}
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors inline-block"
            >
              Log In
            </Link>
            <Link 
              href="/register" 
              className="px-5 py-2.5 text-sm font-medium bg-black text-white rounded-xl hover:bg-gray-800 transition-colors inline-block"
            >
              Sign Up
            </Link>
          </div>
        </header>

        {/* --- BACKGROUND INTERACTIVE FLOATING TAGS LAYER --- */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          {TAGS_DATA.map((tag, index) => (
            <FloatingTag 
              key={index} 
              text={tag.text} 
              index={index} 
              total={TAGS_DATA.length}
              mouseX={smoothMouseX}
              mouseY={smoothMouseY}
            />
          ))}
        </div>

        {/* --- HERO CENTERPIECE CONTENT --- */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <div className="flex items-center bg-white/40 backdrop-blur-sm p-6 rounded-3xl border border-dashed border-red-400/80 px-10">
            <h1 className="text-4xl md:text-6xl font-black text-black tracking-tight pointer-events-auto">
              Pilot Your Career
            </h1>
          </div>
        </div>

        {/* Subtle scroll down indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-400"></span>
          <div className="h-3 w-0.5 bg-neutral-300 rounded-full" />
        </div>
      </div>

      {/* --- LANDING SYSTEM FEATURES WORKSPACE WITH SOFT RADIAL GRADIENT --- */}
      <section className="relative w-full bg-gradient-to-br from-white via-red-50/20 to-slate-50/50 py-24 z-20">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <div className="pb-12 text-center space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-black sm:text-4xl">System Ecosystem Layout</h2>
            <p className="text-sm text-neutral-400 font-medium">Core functional engine modules designed for career progression tracking.</p>
          </div>

          <div className="space-y-4">
            {FEATURES_DATA.map((feat, i) => (
              <FeatureRowCard 
                key={i}
                title={feat.title}
                description={feat.description}
                direction={feat.direction}
                icon={feat.icon}
                iconBg={feat.iconBg}
              />
            ))}
          </div>
        </div>
      </section>

      {/* --- FOOTER BANNER --- */}
      <footer className="border-t border-neutral-100 py-12 text-center text-xs font-medium text-neutral-400 bg-neutral-50/50">
        &copy; 2026 Hire Me Plis. All core operational components deployed.
      </footer>
    </main>
  );
}

/* --- SEPARATE SCROLL-BOUND ANIMATING CARD COMPONENT --- */
interface FeatureRowCardProps {
  title: string;
  description: string;
  direction: string;
  icon: React.ReactNode;
  iconBg: string;
}

function FeatureRowCard({ title, description, direction, icon, iconBg }: FeatureRowCardProps) {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, margin: "-120px" });
  const isLeft = direction === "left";

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ type: "spring", stiffness: 80, damping: 18 }}
      className={`flex w-full ${isLeft ? "justify-start" : "justify-end"}`}
    >
      <div className="w-full md:w-[70%] bg-white border border-neutral-100 hover:border-neutral-200 p-5 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.015)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition-all duration-300 flex items-start gap-4 group">
        <div className={`p-3 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 duration-200 ${iconBg}`}>
          {icon}
        </div>
        <div className="space-y-1 min-w-0">
          <h3 className="text-base font-bold text-neutral-900 tracking-tight group-hover:text-black transition-colors">
            {title}
          </h3>
          <p className="text-xs text-neutral-500 font-medium leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* --- SEPARATE FLOATING TAG COMPONENT FOR INDIVIDUAL PHYSICS CALCULATIONS --- */
interface FloatingTagProps {
  text: string;
  index: number;
  total: number;
  mouseX: any;
  mouseY: any;
}

function FloatingTag({ text, index, total, mouseX, mouseY }: FloatingTagProps) {
  const tagRef = useRef<HTMLButtonElement>(null);
  
  // Calculate a uniquely spread distribution across the screen canvas space
  const angle = (index / total) * Math.PI * 2;
  const radiusX = 280 + (index % 3) * 110; 
  const radiusY = 160 + (index % 2) * 90;

  // Static starting positions based on standard elliptical distribution rings
  const initialX = Math.cos(angle) * radiusX;
  const initialY = Math.sin(angle) * radiusY;

  // Add subtle float animations based on unique frequencies
  const [randomOffset] = useState(() => ({
    x: Math.random() * 20 - 10,
    y: Math.random() * 20 - 10,
    speed: 1.5 + Math.random() * 2,
  }));

  const [position, setPosition] = useState({ x: initialX, y: initialY });

  useEffect(() => {
    let animationFrameId: number;

    const updatePhysics = () => {
      // Natural drifting/floating effect over time
      const time = performance.now() * 0.001 * randomOffset.speed;
      const driftX = Math.sin(time + index) * 15;
      const driftY = Math.cos(time - index) * 12;

      // Mouse interactive repelling math
      const mX = mouseX.get();
      const mY = mouseY.get();

      // Vector math between this particle and mouse position
      const dx = initialX + driftX - mX;
      const dy = initialY + driftY - mY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      let forceX = 0;
      let forceY = 0;
      const maxDistance = 350; // Active mouse radius

      if (distance < maxDistance) {
        // Calculate dynamic repelling push magnitude
        const pushFactor = (maxDistance - distance) / maxDistance;
        forceX = (dx / distance) * pushFactor * 65;
        forceY = (dy / distance) * pushFactor * 65;
      }

      setPosition({
        x: initialX + driftX + forceX + randomOffset.x,
        y: initialY + driftY + forceY + randomOffset.y,
      });

      animationFrameId = requestAnimationFrame(updatePhysics);
    };

    animationFrameId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animationFrameId);
  }, [mouseX, mouseY, initialX, initialY, index, randomOffset]);

  return (
    <motion.button
      ref={tagRef}
      onClick={() => alert(`Navigating to jobs for: "${text}"`)}
      style={{
        x: "50%",
        y: "50%",
        left: `calc(50% + ${position.x}px)`,
        top: `calc(50% + ${position.y}px)`,
      }}
      className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-white text-[13px] font-medium text-gray-700 rounded-xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-red-300 hover:text-red-500 hover:shadow-[0_6px_25px_rgba(239,68,68,0.12)] transition-colors duration-200 ease-out whitespace-nowrap cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {text}
    </motion.button>
  );
}