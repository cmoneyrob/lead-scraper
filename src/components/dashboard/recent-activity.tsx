"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Zap, RefreshCw } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "search" | "import" | "score" | "enrich";
  description: string;
  timestamp: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

const ACTIVITY_ICONS = {
  search: Search,
  import: UserPlus,
  score: Zap,
  enrich: RefreshCw,
};

const ACTIVITY_COLORS = {
  search: "text-blue-400",
  import: "text-emerald-400",
  score: "text-purple-400",
  enrich: "text-amber-400",
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {activities.slice(0, 10).map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.type];
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <Icon className={`size-4 mt-0.5 ${ACTIVITY_COLORS[activity.type]}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">{activity.type}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
