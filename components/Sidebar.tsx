import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { UserPreferences, AgeGroup, UserLanguage, ChartData } from '../types';
import { Select } from './Select';
import { MOCK_CHART_DATA } from '../constants';

interface SidebarProps {
  preferences: UserPreferences;
  onPreferenceChange: (newPrefs: UserPreferences) => void;
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = ['#4F46E5', '#818CF8', '#C7D2FE', '#E0E7FF'];

export const Sidebar: React.FC<SidebarProps> = ({ preferences, onPreferenceChange, isOpen, onClose }) => {
  const handleAgeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPreferenceChange({ ...preferences, ageGroup: e.target.value as AgeGroup });
  };

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onPreferenceChange({ ...preferences, language: e.target.value as UserLanguage });
  };

  return (
    <div 
      className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none lg:translate-x-0 lg:static lg:inset-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.499 5.221 69.78 69.78 0 00-2.658.814m-15.481 0A59.906 59.906 0 0112 3.493a59.906 59.906 0 0110.499 5.221M12 20.904a48.622 48.622 0 01-3.047-3.355m3.047 3.355A48.622 48.622 0 0115.047 17.549" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800">EduBuddy</h1>
              <p className="text-xs text-slate-500">Your AI Tutor</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-600">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>

        {/* Settings */}
        <div className="p-6 flex-1 overflow-y-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Profile Settings</h2>
            
            <Select label="Grade Level / Age" value={preferences.ageGroup} onChange={handleAgeChange}>
              {Object.values(AgeGroup).map((age) => (
                <option key={age} value={age}>{age}</option>
              ))}
            </Select>

            <Select label="Language" value={preferences.language} onChange={handleLangChange}>
              {Object.values(UserLanguage).map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </Select>
          </div>

          {/* Visualization Example */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Learning Focus</h2>
            <div className="h-48 w-full bg-slate-50 rounded-xl border border-slate-100 p-2">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={MOCK_CHART_DATA}
                     cx="50%"
                     cy="50%"
                     innerRadius={40}
                     outerRadius={60}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {MOCK_CHART_DATA.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-slate-400">Weekly topic distribution</p>
          </div>

          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <h3 className="text-sm font-semibold text-indigo-900 mb-1">Pro Tip</h3>
            <p className="text-xs text-indigo-700 leading-relaxed">
              Try asking "Make a quiz for me" or "Explain like I'm 5" to switch modes!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center">
            Powered by Gemini 2.5 Flash
          </p>
        </div>
      </div>
    </div>
  );
};