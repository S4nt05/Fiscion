
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface UploadZoneProps {
    onFileSelect: (file: File) => void
}

export default function UploadZone({ onFileSelect }: UploadZoneProps) {
    const [dragActive, setDragActive] = useState(false)

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0])
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault()
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0])
        }
    }

    return (
        <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
                type="file"
                className="hidden"
                id="file-upload-zone"
                onChange={handleChange}
                accept=".pdf,.jpg,.png"
            />
            <label htmlFor="file-upload-zone" className="cursor-pointer block w-full h-full">
                <p className="text-lg mb-2">Arrastra y suelta tu factura aquí</p>
                <Button variant="outline" asChild>
                    <span>O selecciona un archivo</span>
                </Button>
            </label>
        </div>
    )
}
