"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  BrainCircuit, 
  MessageSquare, 
  FolderUp, 
  Sparkles, 
  TrendingUp, 
  Calendar
} from "lucide-react";

const SYSTEM_ADVANTAGES = [
  {
    title: "Job Hunter",
    description: "Deploy semantic search agents across live pipelines to gather tailored role openings matching your exact intent.",
    icon: <BrainCircuit className="h-4 w-4 transition-colors duration-200 text-neutral-800 group-hover:text-white" />,
  },
  {
    title: "AI Chat",
    description: "Consult your conversational co-pilot, grounded directly by your background data nodes for contextual insights.",
    icon: <MessageSquare className="h-4 w-4 transition-colors duration-200 text-neutral-800 group-hover:text-white" />,
  },
  {
    title: "CV Builder",
    description: "Ingest, split, and embed resume data directly into a dedicated vector store for real-time document mapping.",
    icon: <FolderUp className="h-4 w-4 transition-colors duration-200 text-neutral-800 group-hover:text-white" />,
  },
  {
    title: "AI Nudges",
    description: "Receive priority system flags alerting you to critical roadmap changes and fast-approaching openings.",
    icon: <Sparkles className="h-4 w-4 transition-colors duration-200 text-neutral-800 group-hover:text-white" />,
  },
  {
    title: "Fit Score",
    description: "Evaluate your alignment with comprehensive percentage checks and deep, qualitative skill breakdown indices.",
    icon: <TrendingUp className="h-4 w-4 transition-colors duration-200 text-neutral-800 group-hover:text-white" />,
  },
  {
    title: "Calendar & To-Do",
    description: "Keep step with deadline track elements and operational logs seamlessly integrated inside your workspace view.",
    icon: <Calendar className="h-4 w-4 transition-colors duration-200 text-neutral-800 group-hover:text-white" />,
  }
];

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.7, ease: [0.215, 0.610, 0.355, 1.000] } 
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-gradient-to-r from-[#D7E3D9] via-[#FDF5EF] to-[#F2DFD3] text-[#1A1A1A] antialiased selection:bg-neutral-200 overflow-x-hidden relative">
      
      <div className="relative z-10">
        {/* --- NAVIGATION BAR --- */}
        <header className="w-full max-w-7xl mx-auto px-6 md:px-12 py-6 flex items-center justify-between border-b border-neutral-400/30">
          <div className="flex items-center">
            <Link href="/" className="flex items-center select-none">
              <span className="font-serif text-[15px] tracking-wide text-neutral-900 flex items-center gap-[1px]">
                <span className="font-black tracking-tight uppercase text-black">HIRE ME</span>
                <span className="inline-block w-[4px] h-[4px] rounded-full bg-black mx-[4px] translate-y-[2px]" />
                <span className="font-medium italic text-neutral-600 lowercase">plis</span>
              </span>
            </Link>
          </div>

          <nav className="flex items-center gap-8 text-[11px] font-mono tracking-wider uppercase text-neutral-500">
            <Link href="/login" className="hover:text-black transition-colors font-semibold">Login</Link>
            <Link 
              href="/register" 
              className="px-5 py-2.5 bg-black text-white hover:bg-neutral-900 transition-colors tracking-widest font-mono text-[10px] uppercase flex items-center gap-3"
            >
              <span>Get Started</span>
              <span className="text-neutral-400 font-sans text-xs translate-y-[-0.5px]">&rarr;</span>
            </Link>
          </nav>
        </header>

        {/* --- HERO SECTION --- */}
        <section className="max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-32 flex flex-col items-start justify-start text-left">
          <motion.div 
            className="space-y-8 w-full max-w-5xl"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.h1 
              className="font-serif text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] text-neutral-900"
              variants={fadeInUpVariants}
            >
              Your Agentic <span className="italic font-normal text-neutral-900">Career Co-pilot</span>
            </motion.h1>
            
            <motion.p 
              className="font-serif text-lg md:text-xl text-neutral-700 max-w-3xl font-normal leading-relaxed tracking-wide"
              variants={fadeInUpVariants}
            >
              Build an AI platform that knows you — hunts jobs, scores your fit, drafts your applications, and builds your learning roadmap seamlessly.
            </motion.p>
          </motion.div>
        </section>

        {/* --- FEATURES & ADVANTAGES GRID --- */}
        <section id="advantages" className="w-full border-t border-neutral-400/30 py-24">
          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-start text-left">
            
            <motion.div 
              className="w-full pb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUpVariants}
            >
              <h2 className="font-serif text-4xl md:text-5xl font-black tracking-tight text-black border-b-2 border-black pb-4 inline-block">
                Features & Advantages
              </h2>
            </motion.div>

            {/* Content panel container cleanly layered on top of prominent background */}
            <motion.div 
              className="w-full border-t border-l border-neutral-300 bg-white shadow-md"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={containerVariants}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {SYSTEM_ADVANTAGES.map((advantage, idx) => (
                  <motion.div 
                    key={idx} 
                    className="group p-8 border-r border-b border-neutral-300 space-y-6 text-left transition-colors duration-200 hover:bg-neutral-50"
                    variants={fadeInUpVariants}
                  >
                    <div className="w-8 h-8 border border-neutral-400 flex items-center justify-center rounded-none shadow-sm bg-neutral-50 transition-colors duration-200 group-hover:bg-black group-hover:border-black">
                      {advantage.icon}
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-serif text-xl font-black text-neutral-900 tracking-tight">
                        {advantage.title}
                      </h3>
                      <p className="font-sans text-xs text-neutral-500 font-normal leading-relaxed group-hover:text-neutral-700">
                        {advantage.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

          </div>
        </section>

        {/* --- HOW IT WORKS TIMELINE SECTION --- */}
        <section id="workflow" className="w-full bg-[#0D0D0D] text-white py-24 border-t border-neutral-900 relative z-20">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start text-left">
            
            <motion.div 
              className="lg:col-span-4 space-y-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUpVariants}
            >
              <h2 className="font-serif text-4xl md:text-5xl font-black tracking-tight leading-none text-white">
                How <span className="block font-sans font-light">HIRE ME</span> works
              </h2>
              <div className="pt-2 border-l-2 border-[#10B981] pl-4">
                <p className="text-neutral-400 font-mono text-[10px] uppercase tracking-widest leading-relaxed">
                  Automated pipelines from source resume to signed offer.
                </p>
              </div>
            </motion.div>

            <motion.div 
              className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              variants={containerVariants}
            >
              <motion.div className="space-y-4" variants={fadeInUpVariants}>
                <span className="w-6 h-6 bg-[#10B981] text-black text-xs font-mono font-bold flex items-center justify-center rounded-none">
                  1
                </span>
                <h3 className="font-serif text-md font-black text-white tracking-tight">
                  Upload Your Resume
                </h3>
                <p className="font-sans text-xs text-neutral-400 font-normal leading-relaxed">
                  User uploads a PDF/DOCX CV or builds one directly inside the platform.
                </p>
              </motion.div>

              <motion.div className="space-y-4" variants={fadeInUpVariants}>
                <span className="w-6 h-6 bg-[#10B981] text-black text-xs font-mono font-bold flex items-center justify-center rounded-none">
                  2
                </span>
                <h3 className="font-serif text-md font-black text-white tracking-tight">
                  Section Chunk Extraction
                </h3>
                <p className="font-sans text-xs text-neutral-400 font-normal leading-relaxed">
                  CV is chunked by section: experience, education, skills, and projects.
                </p>
              </motion.div>

              <motion.div className="space-y-4" variants={fadeInUpVariants}>
                <span className="w-6 h-6 bg-[#10B981] text-black text-xs font-mono font-bold flex items-center justify-center rounded-none">
                  3
                </span>
                <h3 className="font-serif text-md font-black text-white tracking-tight">
                  Vector DB Store Mapping
                </h3>
                <p className="font-sans text-xs text-neutral-400 font-normal leading-relaxed">
                  Chunks are embedded and stored in a vector database. All downstream features—job matching, cover letters, gap analysis—RAG this store.
                </p>
              </motion.div>
            </motion.div>

          </div>
        </section>

        {/* --- BRUTALIST TECHNICAL FOOTER --- */}
        <footer className="w-full bg-[#050505] border-t border-neutral-900 py-12 text-xs font-mono tracking-wider text-neutral-600 relative z-20">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
            <p className="text-left">&copy; 2026 HIRE ME PLIS. ALL SYSTEM OPERATIONS INTEGRATED.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}