import React, { useState } from 'react';
import { X, BookOpen, Clock, FileText, Bookmark } from 'lucide-react';
import { JournalEntry } from '../game/types';

interface JournalModalProps {
  entries: JournalEntry[];
  onClose: () => void;
}

export const JournalModal: React.FC<JournalModalProps> = ({ entries, onClose }) => {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry>(entries[0] || null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-xs select-none font-sans">
      <div className="w-full max-w-4xl bg-neutral-950 border border-neutral-800 rounded shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 p-4 bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-base md:text-lg font-bold font-mono tracking-wider text-neutral-100 uppercase">
                Field Journal & Zero Hour Clues
              </h2>
              <span className="text-[11px] font-mono text-neutral-400">
                {entries.length} Documents Recovered
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left List, Right Document Reader */}
        <div className="grid grid-cols-1 md:grid-cols-3 flex-1 overflow-hidden">
          {/* Entries List */}
          <div className="p-3 border-b md:border-b-0 md:border-r border-neutral-800 overflow-y-auto max-h-[45vh] md:max-h-[60vh] flex flex-col gap-2">
            {entries.length === 0 ? (
              <div className="h-36 flex flex-col items-center justify-center text-neutral-600 font-mono text-xs">
                No logs or notes discovered yet
              </div>
            ) : (
              entries.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                return (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={`p-3 rounded-sm border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-900 border-purple-500/80 ring-1 ring-purple-500/30'
                        : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-purple-400 uppercase font-semibold">
                        {entry.source}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">{entry.date}</span>
                    </div>
                    <span className="text-xs font-semibold text-neutral-200 line-clamp-1">
                      {entry.title}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Document Content View */}
          <div className="md:col-span-2 p-6 bg-neutral-950 overflow-y-auto flex flex-col justify-start">
            {selectedEntry ? (
              <div className="flex flex-col gap-4 max-w-xl">
                <div className="border-b border-neutral-800 pb-3">
                  <span className="text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
                    {selectedEntry.source} • {selectedEntry.date}
                  </span>
                  <h3 className="text-lg font-bold text-neutral-100 mt-1">
                    {selectedEntry.title}
                  </h3>
                </div>

                <div className="bg-neutral-900/50 border border-neutral-800/80 p-4 rounded text-sm text-neutral-300 leading-relaxed font-serif whitespace-pre-line shadow-inner">
                  {selectedEntry.content}
                </div>

                <div className="text-[11px] font-mono text-neutral-500 flex items-center gap-1.5 pt-2">
                  <Bookmark className="w-3.5 h-3.5 text-neutral-600" />
                  <span>Archived in survivor memory cache</span>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-600 font-mono text-xs">
                Select a document to read
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
