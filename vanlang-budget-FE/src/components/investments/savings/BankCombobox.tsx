'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';

interface BankOption {
    value: string;
    label: string;
}

interface BankComboboxProps {
    banks: BankOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function BankCombobox({
    banks,
    value,
    onChange,
    placeholder = "Chọn ngân hàng...",
    disabled = false
}: BankComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    // Lọc danh sách ngân hàng theo từ khóa tìm kiếm
    const filteredBanks = React.useMemo(() => {
        if (!searchQuery) return banks;

        return banks.filter(bank =>
            bank.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bank.value.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [banks, searchQuery]);

    // Lấy thông tin ngân hàng đã chọn
    const selectedBank = React.useMemo(() => {
        return banks.find(bank => bank.value === value);
    }, [banks, value]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    {value ? selectedBank?.label || value : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="start" sideOffset={5}>
                <div className="px-3 py-2">
                    <Input
                        placeholder="Tìm kiếm ngân hàng..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />
                </div>
                <div className="max-h-[300px] overflow-y-auto p-1">
                    {filteredBanks.length === 0 ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            Không tìm thấy ngân hàng
                        </div>
                    ) : (
                        filteredBanks.map((bank) => (
                            <div
                                key={bank.value}
                                className={cn(
                                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                    value === bank.value ? "bg-accent text-accent-foreground" : ""
                                )}
                                onClick={() => {
                                    onChange(bank.value);
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === bank.value ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {bank.label}
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
