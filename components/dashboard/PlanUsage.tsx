export default function PlanUsage({ current, max }: { current: number, max: number }) {
    const percentage = Math.min((current / max) * 100, 100)

    return (
        <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
                <span>Uso del plan</span>
                <span className="font-medium">{current} / {max} facturas</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className={`h-2.5 rounded-full ${percentage > 90 ? 'bg-red-600' : 'bg-blue-600'}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    )
}
