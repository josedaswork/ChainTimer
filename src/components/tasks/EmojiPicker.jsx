import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function EmojiPicker({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-2xl shrink-0 hover:bg-primary/20 transition-colors">
          {value}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-5 gap-1">
          {options.map(emoji => (
            <button key={emoji} type="button" onClick={() => { onChange(emoji); setOpen(false); }} className="w-10 h-10 rounded-lg hover:bg-muted flex items-center justify-center text-xl transition-colors">
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
