'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { listClients } from '@/actions/client';
import type { Client } from '@/types';

interface ClientSelectProps {
  value: string | null; // clientId
  onChange: (clientId: string | null, clientName: string) => void;
  error?: string;
}

export default function ClientSelect({ value, onChange, error }: ClientSelectProps) {
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch clients when search changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await listClients(search || undefined);
        setClients(result.success ? result.data.items : []);
      } catch {
        setClients([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (client: Client) => {
    setSelectedLabel(client.clientName);
    setSearch('');
    setOpen(false);
    onChange(client.clientId, client.clientName);
  };

  const handleClear = () => {
    setSelectedLabel('');
    setSearch('');
    onChange(null, '');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (selectedLabel) {
      // Clear selection when user starts typing again
      setSelectedLabel('');
      onChange(null, '');
    }
    setOpen(true);
  };

  const displayValue = selectedLabel || search;

  return (
    <div className="flex flex-col gap-1" ref={containerRef}>
      <Label htmlFor="client-select">
        取引先 <span className="text-red-500">*</span>
      </Label>
      <div className="relative">
        <Input
          id="client-select"
          placeholder="取引先名を入力して検索"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          className={cn(error && 'border-red-500 focus-visible:ring-red-500')}
          disabled={loading && clients.length === 0 && !selectedLabel}
        />
        {value && selectedLabel && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-lg leading-none"
            aria-label="クリア"
          >
            ×
          </button>
        )}

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-md max-h-60 overflow-auto">
            {loading ? (
              <div className="px-3 py-2 text-sm text-zinc-500">検索中...</div>
            ) : clients.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500">
                該当する取引先がありません
              </div>
            ) : (
              clients.map((client) => (
                <button
                  key={client.clientId}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none"
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent blur before click
                    handleSelect(client);
                  }}
                >
                  {client.clientName}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
