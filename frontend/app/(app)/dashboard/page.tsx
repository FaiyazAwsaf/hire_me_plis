// "use client";

// import React from "react";
// import Link from "next/link";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { cn } from "@/lib/utils";
// import { 
//   Send, 
//   Cpu, 
//   Milestone, 
//   Flame, 
//   Sparkles, 
//   KanbanSquare,
//   CalendarDays,
//   ArrowUpRight
// } from "lucide-react";

// const WEEKLY_STATS_MOCK = {
//   applicationsSent: 6,
//   skillsAdded: 4,
//   roadmapCompletePercentage: 72,
//   streakDays: 5,
// };

// const TRACKER_PREVIEW_MOCK = {
//   kanbanStagesCount: { applied: 1, interviewing: 0, offer: 0, rejected: 0 },
//   upcomingDeadlines: [
//     { text: "Finish DSA course", date: "June 5", category: "learning" },
//     { text: "Update resume layout", date: "June 7", category: "cv" }
//   ],
// };

// export default function DashboardPage() {
//   return (
//     /* --- CONTENT INNER WRAPPER ---
//       This container handles your main dashboard layout view. 
//       The background colors and grid canvas have been injected to fill the entire remaining 
//       viewport plane dynamically right beneath your persistent global elements.
//     */
//     <div className="w-full min-h-[calc(100vh-64px)] bg-gradient-to-r from-[#EBF0EC] via-[#FDFBF9] to-[#F9F3EE] text-[#1A1A1A] antialiased relative p-6 md:p-10">
      
//       {/* THE CORRECTED GRID PATTERN: 
//         Now spans flawlessly across the entire content pane up to the edges of your sidebar and navbar 
//       */}
//       <div 
//         className="absolute inset-0 pointer-events-none z-0 opacity-[0.07]" 
//         style={{
//           backgroundImage: `
//             linear-gradient(to right, #1A1A1A 1px, transparent 1px),
//             linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)
//           `,
//           backgroundSize: '40px 40px'
//         }}
//       />

//       <div className="relative z-10 mx-auto max-w-5xl animate-in fade-in duration-200 text-left">
        
//         {/* SHARP-EDGED BRUTALIST MAIN WORKSPACE SHEET */}
//         <div className="space-y-8 rounded-none border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] sm:p-8">
          
//           {/* HEADER SECTION */}
//           <div className="flex flex-col gap-1 pb-6 border-b-2 border-black">
//             <h1 className="font-serif text-3xl md:text-4xl font-black tracking-tight text-neutral-900">
//               Progress Dashboard
//             </h1>
//             <p className="font-mono text-xs text-neutral-500 uppercase tracking-wider">
//               Overview of your active job application workflows, daily milestones, and automated insights.
//             </p>
//           </div>

//           {/* MAIN LAYOUT GRID */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
//             {/* --- TOP LEFT: METRICS GRID CONTAINER --- */}
//             <div className="grid h-[280px] grid-cols-2 gap-4 rounded-none border border-black bg-neutral-50 p-4">
//               <MiniStatCard 
//                 title="Applications" 
//                 value={WEEKLY_STATS_MOCK.applicationsSent.toString()} 
//                 badge="this week" 
//                 icon={<Send className="h-3.5 w-3.5 text-black" />}
//                 description="Target: 10 sent"
//               />
              
//               <MiniStatCard 
//                 title="Skills Added" 
//                 value={`+${WEEKLY_STATS_MOCK.skillsAdded}`} 
//                 badge="verified" 
//                 icon={<Cpu className="h-3.5 w-3.5 text-black" />}
//                 description="Parsed profile updates"
//               />
              
//               <MiniStatCard 
//                 title="Roadmap" 
//                 value={`${WEEKLY_STATS_MOCK.roadmapCompletePercentage}%`} 
//                 badge="progress" 
//                 icon={<Milestone className="h-3.5 w-3.5 text-black" />}
//                 description="Milestone 3 target"
//               />
              
//               <MiniStatCard 
//                 title="Streak" 
//                 value={`${WEEKLY_STATS_MOCK.streakDays} Days`} 
//                 badge="active" 
//                 icon={<Flame className="h-3.5 w-3.5 text-black" />}
//                 description="Actions logged daily"
//               />
//             </div>

//             {/* --- TOP RIGHT: AI NUDGE FEED PANEL --- */}
//             <Card className="flex h-[280px] flex-col justify-between overflow-hidden rounded-none border border-black bg-white shadow-sm">
//               <CardHeader className="pb-3 pt-5 px-5 space-y-1">
//                 <div className="flex items-center gap-2">
//                   <div className="rounded-none border border-black bg-neutral-50 p-1">
//                     <Sparkles className="h-4 w-4 text-black" />
//                   </div>
//                   <CardTitle className="font-serif text-md font-black text-neutral-900 tracking-tight">AI Nudge System</CardTitle>
//                 </div>
//                 <CardDescription className="font-sans text-xs text-neutral-400">
//                   Automated notifications evaluated against active workspace speeds.
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="px-5 pb-5 flex-1 flex items-center justify-center">
//                 <div className="flex h-full w-full flex-col items-center justify-center rounded-none border border-black bg-neutral-50 p-4 text-center">
//                   <p className="font-serif text-sm font-black text-neutral-800">No warning flags triggered</p>
//                   <p className="font-sans text-[11px] text-neutral-500 max-w-xs mt-1 leading-relaxed">
//                     Expand your core index metrics to unlock predictive semantic tracking signals.
//                   </p>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* --- BOTTOM LEFT: KANBAN BOARD PREVIEW PANEL --- */}
//             <Link 
//               href="/tracker?view=kanban" 
//               className="group block h-[340px] transform transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
//             >
//               <Card className="flex h-full flex-col justify-between overflow-hidden rounded-none border border-black bg-white shadow-sm transition-all duration-150 group-hover:bg-neutral-50/50 group-hover:shadow-[6px_6px_0px_rgba(0,0,0,1)]">
//                 <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
//                   <div className="flex items-center gap-2">
//                     <div className="rounded-none border border-black bg-neutral-50 p-1">
//                       <KanbanSquare className="h-4 w-4 text-black shrink-0" />
//                     </div>
//                     <div>
//                       <CardTitle className="font-serif text-md font-black text-neutral-900 tracking-tight">Kanban Board</CardTitle>
//                       <CardDescription className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">Pipeline mapping active roles</CardDescription>
//                     </div>
//                   </div>
//                   <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
//                 </CardHeader>
//                 <CardContent className="px-5 pb-5 flex-1 flex flex-col justify-center">
//                   <div className="grid grid-cols-4 gap-2 rounded-none border border-black bg-neutral-50 p-4 text-center">
//                     <div className="space-y-0.5 border-r border-black/30 last:border-none">
//                       <div className="text-xl font-mono font-black text-neutral-900">{TRACKER_PREVIEW_MOCK.kanbanStagesCount.applied}</div>
//                       <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Applied</div>
//                     </div>
//                     <div className="space-y-0.5 border-r border-black/30 last:border-none">
//                       <div className="text-xl font-mono font-medium text-neutral-400">{TRACKER_PREVIEW_MOCK.kanbanStagesCount.interviewing}</div>
//                       <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Interview</div>
//                     </div>
//                     <div className="space-y-0.5 border-r border-black/30 last:border-none">
//                       <div className="text-xl font-mono font-medium text-neutral-400">{TRACKER_PREVIEW_MOCK.kanbanStagesCount.offer}</div>
//                       <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Offer</div>
//                     </div>
//                     <div className="space-y-0.5 last:border-none">
//                       <div className="text-xl font-mono font-medium text-neutral-400">{TRACKER_PREVIEW_MOCK.kanbanStagesCount.rejected}</div>
//                       <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Rejected</div>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </Link>

//             {/* --- BOTTOM RIGHT: SCROLLABLE CALENDAR PANEL --- */}
//             <Link 
//               href="/tracker?view=calendar" 
//               className="group block h-[340px] transform transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
//             >
//               <Card className="flex h-full flex-col overflow-hidden rounded-none border border-black bg-white shadow-sm transition-all duration-150 group-hover:bg-neutral-50/50 group-hover:shadow-[6px_6px_0px_rgba(0,0,0,1)]">
//                 <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between space-y-0 shrink-0">
//                   <div className="flex items-center gap-3">
//                     <div className="rounded-none border border-black bg-neutral-50 p-1">
//                       <CalendarDays className="h-4 w-4 text-black shrink-0" />
//                     </div>
//                     <div>
//                       <div className="flex items-center gap-2">
//                         <CardTitle className="font-serif text-md font-black text-neutral-900 tracking-tight">Calendar & Agenda</CardTitle>
//                         <span className="rounded-none border border-black bg-neutral-50 px-1.5 py-0.5 font-mono text-[9px] font-black text-neutral-700 uppercase tracking-wider">June 2026</span>
//                       </div>
//                       <CardDescription className="font-sans text-xs text-neutral-400">Scroll layout showing due parameters</CardDescription>
//                     </div>
//                   </div>
//                   <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
//                 </CardHeader>
                
//                 <CardContent className="px-5 pb-5 overflow-y-auto flex-1 pr-3 mr-1 space-y-4 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
//                   <div>
//                     {/* Day Titles */}
//                     <div className="sticky top-0 z-10 mb-2 grid grid-cols-7 gap-1.5 bg-white pt-1 pb-1 text-center text-[9px] font-black uppercase tracking-wider text-neutral-400">
//                       <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
//                     </div>
                    
//                     {/* Interactive Matrix Grid */}
//                     <div className="grid grid-cols-7 gap-1.5">
//                       {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
//                         const isDSA = day === 5;
//                         const isCV = day === 7;
                        
//                         return (
//                           <div 
//                             key={day} 
//                             className={cn(
//                               "p-1 h-12 border text-[10px] font-bold flex flex-col justify-between transition-colors relative rounded-none overflow-hidden",
//                               isDSA ? 'border-black bg-neutral-100 text-black' : 
//                               isCV ? 'border-black bg-neutral-900 text-white' : 
//                               'border-neutral-200 bg-neutral-50/50 text-neutral-700 hover:bg-neutral-100'
//                             )}
//                           >
//                             <div className="flex justify-between items-center">
//                               <span>{day}</span>
//                               {isDSA && <span className="h-1 w-1 bg-black rounded-full block" />}
//                               {isCV && <span className="h-1 w-1 bg-white rounded-full block" />}
//                             </div>

//                             {isDSA && (
//                               <span className="text-[6.5px] leading-tight font-black uppercase tracking-tighter truncate block text-neutral-900">
//                                 DSA Due
//                               </span>
//                             )}
//                             {isCV && (
//                               <span className="text-[6.5px] leading-tight font-normal uppercase tracking-tighter truncate block text-neutral-300">
//                                 CV Update
//                               </span>
//                             )}
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             </Link>

//           </div>
//         </div>

//       </div>
//     </div>
//   );
// }

// {/* REUSABLE INTERNAL COMPACT MICRO-METRIC CARD */}
// interface MiniStatCardProps {
//   title: string;
//   value: string;
//   badge: string;
//   icon: React.ReactNode;
//   description: string;
// }

// function MiniStatCard({ title, value, badge, icon, description }: MiniStatCardProps) {
//   return (
//     <Card className="flex flex-col justify-between space-y-2 rounded-none border border-black bg-white p-3 shadow-sm">
//       <div className="flex items-center justify-between gap-2">
//         <span className="font-mono text-[9px] font-black tracking-wider text-neutral-400 uppercase truncate">
//           {title}
//         </span>
//         <div className="shrink-0 rounded-none border border-black bg-neutral-50 p-1">
//           {icon}
//         </div>
//       </div>
      
//       <div className="space-y-0.5">
//         <div className="flex items-baseline justify-between gap-1.5">
//           <span className="font-mono text-lg font-black text-neutral-900 tracking-tight">
//             {value}
//           </span>
//           <Badge variant="secondary" className="rounded-none border border-black bg-neutral-50 px-1.5 py-0 font-mono text-[8px] font-bold uppercase tracking-wider text-black shadow-sm">
//             {badge}
//           </Badge>
//         </div>
//         <p className="font-sans text-[10px] text-neutral-400 font-medium truncate">
//           {description}
//         </p>
//       </div>
//     </Card>
//   );
// }


"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Send, 
  Cpu, 
  Milestone, 
  Flame, 
  Sparkles, 
  KanbanSquare,
  CalendarDays,
  ArrowUpRight
} from "lucide-react";

const WEEKLY_STATS_MOCK = {
  applicationsSent: 6,
  skillsAdded: 4,
  roadmapCompletePercentage: 72,
  streakDays: 5,
};

const TRACKER_PREVIEW_MOCK = {
  kanbanStagesCount: { applied: 1, interviewing: 0, offer: 0, rejected: 0 },
  upcomingDeadlines: [
    { text: "Finish DSA course", date: "June 5", category: "learning" },
    { text: "Update resume layout", date: "June 7", category: "cv" }
  ],
};

export default function DashboardPage() {
  return (
    /* --- CONTENT INNER WRAPPER ---
       This container handles your main dashboard layout view. 
       The background colors and grid canvas have been injected to fill the entire remaining 
       viewport plane dynamically right beneath your persistent global elements.
    */
    <div className="w-full min-h-[calc(100vh-64px)] bg-gradient-to-r from-[#EBF0EC] via-[#FDFBF9] to-[#F9F3EE] text-[#1A1A1A] antialiased relative p-6 md:p-10">
      
      {/* THE CORRECTED GRID PATTERN: 
        Now spans flawlessly across the entire content pane up to the edges of your sidebar and navbar 
      */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.07]" 
        style={{
          backgroundImage: `
            linear-gradient(to right, #1A1A1A 1px, transparent 1px),
            linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl animate-in fade-in duration-200 text-left">
        
        {/* SHARP-EDGED BRUTALIST MAIN WORKSPACE SHEET */}
        <div className="space-y-8 rounded-none border-2 border-black bg-white p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] sm:p-8">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col gap-1 pb-6 border-b-2 border-black">
            <h1 className="font-serif text-3xl md:text-4xl font-black tracking-tight text-neutral-900">
              Progress Dashboard
            </h1>
            <p className="font-mono text-xs text-neutral-500 uppercase tracking-wider">
              Overview of your active job application workflows, daily milestones, and automated insights.
            </p>
          </div>

          {/* MAIN LAYOUT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* --- TOP LEFT: METRICS GRID CONTAINER --- */}
            <div className="grid h-[280px] grid-cols-2 gap-4 rounded-none border border-black bg-neutral-50 p-4">
              <MiniStatCard 
                title="Applications" 
                value={WEEKLY_STATS_MOCK.applicationsSent.toString()} 
                badge="this week" 
                icon={<Send className="h-3.5 w-3.5 text-black" />}
                description="Target: 10 sent"
                bgClass="bg-[#E3F2FD] hover:bg-[#BBDEFB]" // Vibrant blue tint
                iconBg="bg-[#90CAF9]"
              />
              
              <MiniStatCard 
                title="Skills Added" 
                value={`+${WEEKLY_STATS_MOCK.skillsAdded}`} 
                badge="verified" 
                icon={<Cpu className="h-3.5 w-3.5 text-black" />}
                description="Parsed profile updates"
                bgClass="bg-[#E8F5E9] hover:bg-[#C8E6C9]" // Vibrant green tint
                iconBg="bg-[#A5D6A7]"
              />
              
              <MiniStatCard 
                title="Roadmap" 
                value={`${WEEKLY_STATS_MOCK.roadmapCompletePercentage}%`} 
                badge="progress" 
                icon={<Milestone className="h-3.5 w-3.5 text-black" />}
                description="Milestone 3 target"
                bgClass="bg-[#F3E5F5] hover:bg-[#E1BEE7]" // Vibrant purple tint
                iconBg="bg-[#CE93D8]"
              />
              
              <MiniStatCard 
                title="Streak" 
                value={`${WEEKLY_STATS_MOCK.streakDays} Days`} 
                badge="active" 
                icon={<Flame className="h-3.5 w-3.5 text-black" />}
                description="Actions logged daily"
                bgClass="bg-[#FFF3E0] hover:bg-[#FFE0B2]" // Vibrant orange tint
                iconBg="bg-[#FFCC80]"
              />
            </div>

            {/* --- TOP RIGHT: AI NUDGE FEED PANEL --- */}
            <Card className="flex h-[280px] flex-col justify-between overflow-hidden rounded-none border border-black bg-white shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="rounded-none border border-black bg-[#E0F7FA] p-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                    <Sparkles className="h-4 w-4 text-cyan-700" />
                  </div>
                  <CardTitle className="font-serif text-md font-black text-neutral-900 tracking-tight">AI Nudge System</CardTitle>
                </div>
                <CardDescription className="font-sans text-xs text-neutral-400">
                  Autom notifications evaluated against active workspace speeds.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-5 pb-5 flex-1 flex items-center justify-center">
                <div className="flex h-full w-full flex-col items-center justify-center rounded-none border border-black bg-[#F9FBE7] p-4 text-center">
                  <p className="font-serif text-sm font-black text-lime-900">No warning flags triggered</p>
                  <p className="font-sans text-[11px] text-neutral-500 max-w-xs mt-1 leading-relaxed">
                    Expand your core index metrics to unlock predictive semantic tracking signals.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* --- BOTTOM LEFT: KANBAN BOARD PREVIEW PANEL --- */}
            <Link 
              href="/tracker?view=kanban" 
              className="group block h-[340px] transform transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              <Card className="flex h-full flex-col justify-between overflow-hidden rounded-none border border-black bg-white shadow-sm transition-all duration-150 group-hover:bg-[#FFFDE7] group-hover:shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-2">
                    <div className="rounded-none border border-black bg-[#FFF59D] p-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                      <KanbanSquare className="h-4 w-4 text-black shrink-0" />
                    </div>
                    <div>
                      <CardTitle className="font-serif text-md font-black text-neutral-900 tracking-tight">Kanban Board</CardTitle>
                      <CardDescription className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider">Pipeline mapping active roles</CardDescription>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </CardHeader>
                <CardContent className="px-5 pb-5 flex-1 flex items-center justify-center">
                  <div className="grid grid-cols-4 gap-2 w-full rounded-none border border-black bg-neutral-50 p-4 text-center">
                    <div className="space-y-0.5 border-r border-black/30 last:border-none bg-[#E3F2FD] py-2">
                      <div className="text-xl font-mono font-black text-neutral-900">{TRACKER_PREVIEW_MOCK.kanbanStagesCount.applied}</div>
                      <div className="text-[9px] uppercase tracking-wider text-neutral-600 font-bold">Applied</div>
                    </div>
                    <div className="space-y-0.5 border-r border-black/30 last:border-none bg-neutral-100/70 py-2">
                      <div className="text-xl font-mono font-medium text-neutral-400">{TRACKER_PREVIEW_MOCK.kanbanStagesCount.interviewing}</div>
                      <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Interview</div>
                    </div>
                    <div className="space-y-0.5 border-r border-black/30 last:border-none bg-neutral-100/70 py-2">
                      <div className="text-xl font-mono font-medium text-neutral-400">{TRACKER_PREVIEW_MOCK.kanbanStagesCount.offer}</div>
                      <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Offer</div>
                    </div>
                    <div className="space-y-0.5 last:border-none bg-neutral-100/70 py-2">
                      <div className="text-xl font-mono font-medium text-neutral-400">{TRACKER_PREVIEW_MOCK.kanbanStagesCount.rejected}</div>
                      <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-bold">Rejected</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* --- BOTTOM RIGHT: SCROLLABLE CALENDAR PANEL --- */}
            <Link 
              href="/tracker?view=calendar" 
              className="group block h-[340px] transform transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              <Card className="flex h-full flex-col overflow-hidden rounded-none border border-black bg-white shadow-sm transition-all duration-150 group-hover:bg-[#FCE4EC] group-hover:shadow-[6px_6px_0px_rgba(0,0,0,1)]">
                <CardHeader className="pb-3 pt-5 px-5 flex flex-row items-center justify-between space-y-0 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="rounded-none border border-black bg-[#F8BBD0] p-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                      <CalendarDays className="h-4 w-4 text-black shrink-0" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="font-serif text-md font-black text-neutral-900 tracking-tight">Calendar & Agenda</CardTitle>
                        <span className="rounded-none border border-black bg-neutral-900 px-1.5 py-0.5 font-mono text-[9px] font-black text-white uppercase tracking-wider">June 2026</span>
                      </div>
                      <CardDescription className="font-sans text-xs text-neutral-400">Scroll layout showing due parameters</CardDescription>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </CardHeader>
                
                <CardContent className="px-5 pb-5 overflow-y-auto flex-1 pr-3 mr-1 space-y-4 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
                  <div>
                    {/* Day Titles */}
                    <div className="sticky top-0 z-10 mb-2 grid grid-cols-7 gap-1.5 bg-white pt-1 pb-1 text-center text-[9px] font-black uppercase tracking-wider text-neutral-400">
                      <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                    </div>
                    
                    {/* Interactive Matrix Grid */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                        const isDSA = day === 5;
                        const isCV = day === 7;
                        
                        return (
                          <div 
                            key={day} 
                            className={cn(
                              "p-1 h-12 border text-[10px] font-bold flex flex-col justify-between transition-colors relative rounded-none overflow-hidden",
                              isDSA ? 'border-black bg-[#FFF9C4] text-black shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 
                              isCV ? 'border-black bg-[#E1BEE7] text-black shadow-[1px_1px_0px_rgba(0,0,0,1)]' : 
                              'border-neutral-200 bg-neutral-50/50 text-neutral-700 hover:bg-neutral-100'
                            )}
                          >
                            <div className="flex justify-between items-center">
                              <span>{day}</span>
                              {isDSA && <span className="h-1 w-1 bg-amber-600 rounded-full block" />}
                              {isCV && <span className="h-1 w-1 bg-purple-700 rounded-full block" />}
                            </div>

                            {isDSA && (
                              <span className="text-[6.5px] leading-tight font-black uppercase tracking-tighter truncate block text-amber-900">
                                DSA Due
                              </span>
                            )}
                            {isCV && (
                              <span className="text-[6.5px] leading-tight font-black uppercase tracking-tighter truncate block text-purple-900">
                                CV Update
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

          </div>
        </div>

      </div>
    </div>
  );
}

{/* REUSABLE INTERNAL COMPACT MICRO-METRIC CARD */}
interface MiniStatCardProps {
  title: string;
  value: string;
  badge: string;
  icon: React.ReactNode;
  description: string;
  bgClass?: string;
  iconBg?: string;
}

function MiniStatCard({ title, value, badge, icon, description, bgClass = "bg-white", iconBg = "bg-neutral-50" }: MiniStatCardProps) {
  return (
    <Card className={cn("flex flex-col justify-between space-y-2 rounded-none border border-black p-3 shadow-sm transition-colors duration-150", bgClass)}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] font-black tracking-wider text-neutral-600 uppercase truncate">
          {title}
        </span>
        <div className={cn("shrink-0 rounded-none border border-black p-1 shadow-[1px_1px_0px_rgba(0,0,0,1)]", iconBg)}>
          {icon}
        </div>
      </div>
      
      <div className="space-y-0.5">
        <div className="flex items-baseline justify-between gap-1.5">
          <span className="font-mono text-lg font-black text-neutral-900 tracking-tight">
            {value}
          </span>
          <Badge variant="secondary" className="rounded-none border border-black bg-white px-1.5 py-0 font-mono text-[8px] font-bold uppercase tracking-wider text-black shadow-sm">
            {badge}
          </Badge>
        </div>
        <p className="font-sans text-[10px] text-neutral-600 font-medium truncate">
          {description}
        </p>
      </div>
    </Card>
  );
}