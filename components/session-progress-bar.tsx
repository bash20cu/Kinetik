import { Progress } from "@/components/ui/progress"

type SessionProgressBarProps = {
  total: number
  completed: number
}

export function SessionProgressBar({ total, completed }: SessionProgressBarProps) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">Progreso de sesion</span>
        <span className="text-muted-foreground">
          {completed}/{total}
        </span>
      </div>
      <Progress value={percentage} className="h-3 rounded-full" />
    </div>
  )
}
