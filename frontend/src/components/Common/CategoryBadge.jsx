import React from 'react';
import { 
  Utensils, 
  Plane, 
  ShoppingBag, 
  GraduationCap, 
  Film, 
  Zap, 
  HeartPulse, 
  Briefcase, 
  Laptop, 
  TrendingUp, 
  Package, 
  DollarSign,
  Coffee,
  Car,
  Home,
  ShieldCheck,
  Tag
} from 'lucide-react';

export const getCategoryIcon = (categoryName = '') => {
  const cat = categoryName.toLowerCase();

  if (cat.includes('food') || cat.includes('dining') || cat.includes('grocer') || cat.includes('coffee') || cat.includes('restaurant')) {
    return { icon: Utensils, colorClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
  }
  if (cat.includes('travel') || cat.includes('transport') || cat.includes('flight') || cat.includes('fuel') || cat.includes('cab')) {
    return { icon: Plane, colorClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
  }
  if (cat.includes('shop') || cat.includes('cloth') || cat.includes('retail') || cat.includes('store')) {
    return { icon: ShoppingBag, colorClass: 'bg-pink-500/15 text-pink-400 border-pink-500/30' };
  }
  if (cat.includes('edu') || cat.includes('book') || cat.includes('school') || cat.includes('tuition') || cat.includes('course')) {
    return { icon: GraduationCap, colorClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' };
  }
  if (cat.includes('enter') || cat.includes('movie') || cat.includes('game') || cat.includes('stream') || cat.includes('music')) {
    return { icon: Film, colorClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
  }
  if (cat.includes('bill') || cat.includes('util') || cat.includes('electr') || cat.includes('rent') || cat.includes('wifi')) {
    return { icon: Zap, colorClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' };
  }
  if (cat.includes('health') || cat.includes('medi') || cat.includes('doctor') || cat.includes('fit') || cat.includes('pharma')) {
    return { icon: HeartPulse, colorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
  }
  if (cat.includes('sal') || cat.includes('work') || cat.includes('job') || cat.includes('paycheck')) {
    return { icon: Briefcase, colorClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
  }
  if (cat.includes('free') || cat.includes('side') || cat.includes('tech') || cat.includes('consult')) {
    return { icon: Laptop, colorClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' };
  }
  if (cat.includes('invest') || cat.includes('stock') || cat.includes('crypto') || cat.includes('div')) {
    return { icon: TrendingUp, colorClass: 'bg-violet-500/15 text-violet-400 border-violet-500/30' };
  }
  
  return { icon: Tag, colorClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30' };
};

const CategoryBadge = ({ category, size = 'sm', showIconOnly = false }) => {
  const { icon: Icon, colorClass } = getCategoryIcon(category);

  if (showIconOnly) {
    return (
      <div className={`p-2 rounded-xl border ${colorClass} inline-flex items-center justify-center shadow-xs`}>
        <Icon className="w-4 h-4" />
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border ${colorClass} backdrop-blur-sm shadow-xs`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{category}</span>
    </span>
  );
};

export default CategoryBadge;
