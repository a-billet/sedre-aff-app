'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getScoreColor, getScoreLabel } from '@/lib/config';
import { calculateGrade, getGradeColor } from '@/lib/types';

interface ScoreDetail {
  label: string;
  score: number;
  weight: number;
}

interface ScoreDisplayProps {
  title: string;
  score: number;
  details?: ScoreDetail[];
}

export function ScoreDisplay({ title, score, details }: ScoreDisplayProps) {
  const grade = calculateGrade(score);
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <Card className="border-l-4" style={{ borderLeftColor: color }}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{title}</span>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color }}>
                {score}/100
              </div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white text-xl font-bold ${getGradeColor(grade)}`}>
              {grade}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      {details && details.length > 0 && (
        <CardContent>
          <div className="space-y-3">
            {details.map((detail) => (
              <div key={detail.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{detail.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Poids: {detail.weight}%</span>
                    <span className="font-medium" style={{ color: getScoreColor(detail.score) }}>
                      {detail.score}/100
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${detail.score}%`,
                      backgroundColor: getScoreColor(detail.score) 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
