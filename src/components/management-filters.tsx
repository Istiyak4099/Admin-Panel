
'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

interface ManagementFiltersProps {
  onSearchChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  statusOptions?: { label: string; value: string }[];
}

export function ManagementFilters({
  onSearchChange,
  onFromDateChange,
  onToDateChange,
  onStatusChange,
  statusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ],
}: ManagementFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or mobile..."
            className="pl-8"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-semibold uppercase">From Date</Label>
          <Input type="date" onChange={(e) => onFromDateChange(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-semibold uppercase">To Date</Label>
          <Input type="date" onChange={(e) => onToDateChange(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-semibold uppercase">Status</Label>
          <Select onValueChange={onStatusChange} defaultValue="all">
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
