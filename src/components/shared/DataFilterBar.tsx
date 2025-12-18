import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X, Calendar } from "lucide-react";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from "date-fns";

export type DateFilterType = "all" | "today" | "week" | "month" | "year";

interface DataFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  dateFilter: DateFilterType;
  onDateFilterChange: (value: DateFilterType) => void;
  searchPlaceholder?: string;
}

export function DataFilterBar({
  searchValue,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  searchPlaceholder = "Cari data...",
}: DataFilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9 pr-9"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <Select value={dateFilter} onValueChange={(v) => onDateFilterChange(v as DateFilterType)}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <Calendar className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Filter periode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Data</SelectItem>
          <SelectItem value="today">Hari Ini</SelectItem>
          <SelectItem value="week">Minggu Ini</SelectItem>
          <SelectItem value="month">Bulan Ini</SelectItem>
          <SelectItem value="year">Tahun Ini</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function filterByDate<T extends { created_at: string }>(
  data: T[],
  dateFilter: DateFilterType
): T[] {
  if (dateFilter === "all") return data;

  const now = new Date();
  let start: Date;
  let end: Date;

  switch (dateFilter) {
    case "today":
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case "week":
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case "month":
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case "year":
      start = startOfYear(now);
      end = endOfYear(now);
      break;
    default:
      return data;
  }

  return data.filter((item) => {
    const itemDate = parseISO(item.created_at);
    return isWithinInterval(itemDate, { start, end });
  });
}
