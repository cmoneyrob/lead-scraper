"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2, ChevronDown, X } from "lucide-react";

export interface ITServicesSearchParams {
  location: string;
  serviceCategories: string[];
  industryVerticals: string[];
  companySize: string;
  painPoints: string[];
  freshness: string;
  count: number;
  customKeywords: string[];
}

interface ITServicesSearchFormProps {
  onSearch: (params: ITServicesSearchParams) => void;
  loading: boolean;
}

const SERVICE_CATEGORIES = [
  { value: "managed_it", label: "Managed IT Services" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "cloud_migration", label: "Cloud Migration" },
  { value: "network_infrastructure", label: "Network Infrastructure" },
  { value: "data_backup_recovery", label: "Data Backup & Recovery" },
  { value: "help_desk_support", label: "Help Desk / IT Support" },
  { value: "software_development", label: "Software Development" },
  { value: "voip_communications", label: "VoIP & Communications" },
  { value: "it_consulting", label: "IT Consulting & Strategy" },
  { value: "hardware_procurement", label: "Hardware Procurement" },
  { value: "web_development", label: "Web Development" },
  { value: "erp_crm", label: "ERP / CRM Implementation" },
];

const INDUSTRY_VERTICALS = [
  { value: "healthcare", label: "Healthcare" },
  { value: "legal", label: "Legal" },
  { value: "finance", label: "Finance & Banking" },
  { value: "real_estate", label: "Real Estate" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "construction", label: "Construction" },
  { value: "education", label: "Education" },
  { value: "nonprofit", label: "Nonprofit" },
  { value: "restaurant_hospitality", label: "Restaurant & Hospitality" },
  { value: "logistics", label: "Logistics & Transportation" },
  { value: "professional_services", label: "Professional Services" },
];

const PAIN_POINTS = [
  { value: "outdated_technology", label: "Outdated Technology" },
  { value: "no_it_department", label: "No IT Department" },
  { value: "security_breaches", label: "Recent Security Breach" },
  { value: "rapid_growth", label: "Rapid Growth / Scaling" },
  { value: "remote_work", label: "Remote Work Transition" },
  { value: "compliance", label: "Compliance Requirements" },
  { value: "slow_systems", label: "Slow / Unreliable Systems" },
  { value: "data_management", label: "Data Management Issues" },
  { value: "digital_transformation", label: "Digital Transformation" },
  { value: "website_issues", label: "Website / Online Presence" },
];

const COMPANY_SIZES = [
  { value: "any", label: "Any Size" },
  { value: "small", label: "Small (1-50 employees)" },
  { value: "medium", label: "Medium (50-250 employees)" },
  { value: "large", label: "Large (250+ employees)" },
];

const COUNTRIES = [
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "in", label: "India" },
];

const FRESHNESS_OPTIONS = [
  { value: "all", label: "Any time" },
  { value: "pd", label: "Past day" },
  { value: "pw", label: "Past week" },
  { value: "pm", label: "Past month" },
  { value: "py", label: "Past year" },
];

export function ITServicesSearchForm({
  onSearch,
  loading,
}: ITServicesSearchFormProps) {
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("us");
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  const [industryVerticals, setIndustryVerticals] = useState<string[]>([]);
  const [companySize, setCompanySize] = useState("any");
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [freshness, setFreshness] = useState("all");
  const [count, setCount] = useState(20);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const toggleItem = (
    list: string[],
    setList: (v: string[]) => void,
    value: string
  ) => {
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
    );
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !customKeywords.includes(kw)) {
      setCustomKeywords([...customKeywords, kw]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    setCustomKeywords(customKeywords.filter((k) => k !== kw));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const loc = location.trim();
    if (!loc && serviceCategories.length === 0 && industryVerticals.length === 0) return;
    onSearch({
      location: loc ? `${loc} ${COUNTRIES.find((c) => c.value === country)?.label ?? ""}`.trim() : "",
      serviceCategories,
      industryVerticals,
      companySize,
      painPoints,
      freshness,
      count,
      customKeywords,
    });
  };

  const hasFilters =
    location.trim() ||
    serviceCategories.length > 0 ||
    industryVerticals.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Location */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Location</Label>
        <p className="text-xs text-muted-foreground">
          City, state, region, or metro area to target
        </p>
        <div className="flex gap-2">
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder='e.g., "Dallas, TX" or "Miami" or "Bay Area"'
            className="flex-1"
          />
          <Select
            value={country}
            onValueChange={(v) => {
              if (v) setCountry(v);
            }}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* IT Service Categories */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">IT Service Needs</Label>
        <p className="text-xs text-muted-foreground">
          Select the types of IT services these businesses may need
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SERVICE_CATEGORIES.map((cat) => (
            <label
              key={cat.value}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <Checkbox
                checked={serviceCategories.includes(cat.value)}
                onCheckedChange={() =>
                  toggleItem(serviceCategories, setServiceCategories, cat.value)
                }
              />
              {cat.label}
            </label>
          ))}
        </div>
      </div>

      {/* Industry Verticals */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Industry Verticals</Label>
        <p className="text-xs text-muted-foreground">
          Focus on businesses in specific industries
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {INDUSTRY_VERTICALS.map((ind) => (
            <label
              key={ind.value}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <Checkbox
                checked={industryVerticals.includes(ind.value)}
                onCheckedChange={() =>
                  toggleItem(industryVerticals, setIndustryVerticals, ind.value)
                }
              />
              {ind.label}
            </label>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      <div>
        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown
            className={`size-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
          />
          Advanced Filters
        </button>
        {advancedOpen && (
        <div className="space-y-4 pt-3">
          {/* Company Size */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Company Size</Label>
            <Select
              value={companySize}
              onValueChange={(v) => {
                if (v) setCompanySize(v);
              }}
            >
              <SelectTrigger className="w-[260px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pain Points */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Business Pain Points</Label>
            <p className="text-xs text-muted-foreground">
              Indicators that a business may need IT help
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PAIN_POINTS.map((pp) => (
                <label
                  key={pp.value}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={painPoints.includes(pp.value)}
                    onCheckedChange={() =>
                      toggleItem(painPoints, setPainPoints, pp.value)
                    }
                  />
                  {pp.label}
                </label>
              ))}
            </div>
          </div>

          {/* Custom Keywords */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Custom Keywords</Label>
            <p className="text-xs text-muted-foreground">
              Add extra terms to include in the search
            </p>
            <div className="flex gap-2">
              <Input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                placeholder="Type a keyword and press Enter"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addKeyword}
              >
                Add
              </Button>
            </div>
            {customKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {customKeywords.map((kw) => (
                  <Badge
                    key={kw}
                    variant="secondary"
                    className="gap-1 cursor-pointer"
                    onClick={() => removeKeyword(kw)}
                  >
                    {kw}
                    <X className="size-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Freshness & Count */}
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Freshness</Label>
              <Select
                value={freshness}
                onValueChange={(v) => {
                  if (v) setFreshness(v);
                }}
              >
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FRESHNESS_OPTIONS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Results</Label>
              <Select
                value={String(count)}
                onValueChange={(v) => {
                  if (v) setCount(Number(v));
                }}
              >
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading || !hasFilters}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Search className="size-4" />
        )}
        Find Businesses
      </Button>
    </form>
  );
}
