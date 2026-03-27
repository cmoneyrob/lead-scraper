import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, Globe } from "lucide-react";

interface SearchResultCardProps {
  title: string;
  url: string;
  description: string;
  domain: string;
  age?: string;
  selected: boolean;
  onToggle: () => void;
}

export function SearchResultCard({ title, url, description, domain, age, selected, onToggle }: SearchResultCardProps) {
  return (
    <Card className={selected ? "border-primary/50 bg-primary/5" : ""}>
      <CardContent className="flex gap-3 py-3 px-4">
        <Checkbox checked={selected} onCheckedChange={onToggle} className="mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium leading-tight truncate">{title}</h3>
            <a href={url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
              <ExternalLink className="size-3.5" />
            </a>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Globe className="size-3" /> {domain}
            </span>
            {age && <span className="text-xs text-muted-foreground">{age}</span>}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
