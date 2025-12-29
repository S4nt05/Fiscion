
'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CategorySelectorProps {
    value: string
    onChange: (value: string) => void
    categories: string[]
}

export default function CategorySelector({ value, onChange, categories }: CategorySelectorProps) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
                <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
                {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                        {cat}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
