'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search as SearchIcon, FileDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface HierarchyFilterConfig {
  label: string;
  placeholder: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}

interface ManagementFiltersProps {
  onSearchChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  statusOptions?: { label: string; value: string }[];
  hierarchyFilters?: HierarchyFilterConfig[];
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
  hierarchyFilters = [],
}: ManagementFiltersProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-sm relative">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-8 bg-muted/50 border-none"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-semibold uppercase">From Date</Label>
          <Input type="date" className="h-12" onChange={(e) => onFromDateChange(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-semibold uppercase">To Date</Label>
          <Input type="date" className="h-12" onChange={(e) => onToDateChange(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground font-semibold uppercase">Status</Label>
          <Select onValueChange={onStatusChange} defaultValue="all">
            <SelectTrigger className="h-12">
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

      <div className="flex flex-wrap items-end gap-4">
        {hierarchyFilters.map((filter, index) => (
          <div key={index} className="space-y-1.5 min-w-[240px] flex-1">
            <Label className="text-xs text-muted-foreground font-semibold uppercase">{filter.label}</Label>
            <Select onValueChange={filter.onChange} value={filter.value}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder={filter.placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label.split(' ')[1] || 'Accounts'}</SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        
        <div className="flex items-center gap-2 pb-1">
          <Button className="bg-[#108548] hover:bg-[#0d6e3c] h-10 px-6 font-semibold">
            Search
          </Button>
          <Button variant="destructive" className="bg-[#e54d5e] hover:bg-[#d43d4e] h-10 px-6 font-semibold">
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button className="bg-[#00d0f5] hover:bg-[#00b9db] text-black h-10 px-6 font-semibold">
            <FileDown className="mr-2 h-4 w-4" />
            CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
