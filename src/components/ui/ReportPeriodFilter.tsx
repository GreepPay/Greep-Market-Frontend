import React, { useState } from 'react';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './Button';

interface ReportPeriodFilterProps {
  selectedPeriod: string;
  onPeriodChange: (period: string, startDate?: Date, endDate?: Date) => void;
  className?: string;
}

interface PeriodOption {
  value: string;
  label: string;
  type: 'preset' | 'month' | 'year' | 'custom';
  startDate?: Date;
  endDate?: Date;
}

export const ReportPeriodFilter: React.FC<ReportPeriodFilterProps> = ({
  selectedPeriod,
  onPeriodChange,
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const months = [
    { value: '01', label: 'January', short: 'Jan' },
    { value: '02', label: 'February', short: 'Feb' },
    { value: '03', label: 'March', short: 'Mar' },
    { value: '04', label: 'April', short: 'Apr' },
    { value: '05', label: 'May', short: 'May' },
    { value: '06', label: 'June', short: 'Jun' },
    { value: '07', label: 'July', short: 'Jul' },
    { value: '08', label: 'August', short: 'Aug' },
    { value: '09', label: 'September', short: 'Sep' },
    { value: '10', label: 'October', short: 'Oct' },
    { value: '11', label: 'November', short: 'Nov' },
    { value: '12', label: 'December', short: 'Dec' }
  ];

  const presetOptions: PeriodOption[] = [
    { value: '7d', label: 'Last 7 Days', type: 'preset' },
    { value: '30d', label: 'Last 30 Days', type: 'preset' },
    { value: '90d', label: 'Last 90 Days', type: 'preset' },
    { value: '1y', label: 'Last Year', type: 'preset' },
  ];

  const getMonthPeriod = (month: string, year: number) => {
    const startDate = new Date(year, parseInt(month) - 1, 1);
    const endDate = new Date(year, parseInt(month), 0, 23, 59, 59);
    return { startDate, endDate };
  };

  const getYearPeriod = (year: number) => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    return { startDate, endDate };
  };

  const handlePresetPeriod = (period: string) => {
    onPeriodChange(period);
    setShowAdvanced(false);
  };

  const handleMonthPeriod = (month: string, year: number) => {
    const { startDate, endDate } = getMonthPeriod(month, year);
    const periodKey = `${year}-${month}`;
    onPeriodChange(periodKey, startDate, endDate);
    setShowAdvanced(false);
  };

  const handleYearPeriod = (year: number) => {
    const { startDate, endDate } = getYearPeriod(year);
    const periodKey = `year-${year}`;
    onPeriodChange(periodKey, startDate, endDate);
    setShowAdvanced(false);
  };

  const handleCustomPeriod = () => {
    if (customStartDate && customEndDate) {
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
      onPeriodChange('custom', startDate, endDate);
      setShowAdvanced(false);
    }
  };

  const getSelectedPeriodLabel = () => {
    // Check if it's a month period (YYYY-MM format)
    if (/^\d{4}-\d{2}$/.test(selectedPeriod)) {
      const [year, month] = selectedPeriod.split('-');
      const monthData = months.find(m => m.value === month);
      return `${monthData?.label} ${year}`;
    }
    
    // Check if it's a year period (year-YYYY format)
    if (/^year-\d{4}$/.test(selectedPeriod)) {
      const year = selectedPeriod.split('-')[1];
      return `Year ${year}`;
    }
    
    // Check if it's a custom period
    if (selectedPeriod === 'custom') {
      return 'Custom Range';
    }
    
    // Default to preset options
    const preset = presetOptions.find(p => p.value === selectedPeriod);
    return preset?.label || 'Select Period';
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">Report Period:</span>
          <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
            {getSelectedPeriodLabel()}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Preset Periods */}
          {presetOptions.map(option => (
            <Button
              key={option.value}
              onClick={() => handlePresetPeriod(option.value)}
              variant={selectedPeriod === option.value ? 'primary' : 'outline'}
              size="sm"
              className="px-4 py-2"
            >
              {option.label}
            </Button>
          ))}
          
          {/* Advanced Options Toggle */}
          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="outline"
            size="sm"
            className="px-4 py-2 flex items-center gap-2"
          >
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Advanced
          </Button>
        </div>
      </div>

      {/* Advanced Filtering Options */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Month Selection */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">Select Month</h4>
              <div className="grid grid-cols-2 gap-2">
                {months.map(month => (
                  <Button
                    key={month.value}
                    onClick={() => handleMonthPeriod(month.value, selectedYear)}
                    variant={selectedPeriod === `${selectedYear}-${month.value}` ? 'primary' : 'outline'}
                    size="sm"
                    className="text-xs"
                  >
                    {month.short}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  title="Select year"
                  aria-label="Select year"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Year Selection */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">Select Year</h4>
              <div className="grid grid-cols-1 gap-2">
                {years.map(year => (
                  <Button
                    key={year}
                    onClick={() => handleYearPeriod(year)}
                    variant={selectedPeriod === `year-${year}` ? 'primary' : 'outline'}
                    size="sm"
                    className="justify-start"
                  >
                    {year}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">Custom Range</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    title="Select start date"
                    aria-label="Select start date"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    title="Select end date"
                    aria-label="Select end date"
                  />
                </div>
                <Button
                  onClick={handleCustomPeriod}
                  disabled={!customStartDate || !customEndDate}
                  variant="primary"
                  size="sm"
                  className="w-full"
                >
                  Apply Custom Range
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
