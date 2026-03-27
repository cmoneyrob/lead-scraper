"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Zap, Users, Activity } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Brave Search Integration",
    description:
      "Discover leads across the web using Brave Search API with advanced query building and result filtering.",
  },
  {
    icon: Zap,
    title: "Custom Signal Engine",
    description:
      "Define custom signals to evaluate leads against your ideal customer profile with flexible rule-based scoring.",
  },
  {
    icon: Users,
    title: "Lead Management Pipeline",
    description:
      "Organize, tag, and track leads through your pipeline with bulk actions and smart filtering.",
  },
  {
    icon: Activity,
    title: "Real-time Scoring",
    description:
      "Automatically score and rank leads based on your custom signals with real-time enrichment data.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/40 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-primary" />
            <span className="text-lg font-semibold tracking-tight">
              Lead Scraper
            </span>
          </div>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" size="sm" render={<Link href="/auth/login" />}>
              Sign In
            </Button>
            <Button size="sm" render={<Link href="/auth/signup" />}>
              Get Started
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="flex flex-1 flex-col items-center justify-center px-6 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-white via-white/90 to-white/60 bg-clip-text text-transparent">
                Find &amp; Qualify Leads
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                With Custom Signals
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Leverage Brave Search to discover potential leads, then score and
              qualify them using your own custom signal definitions. Build a
              pipeline that fits your exact criteria.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" render={<Link href="/auth/signup" />}>
                Get Started
              </Button>
              <Button variant="outline" size="lg" render={<Link href="/auth/login" />}>
                Sign In
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 bg-muted/30 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Everything you need to build your lead pipeline
              </h2>
              <p className="mt-3 text-muted-foreground">
                A complete toolkit for discovering, evaluating, and managing
                leads.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="border-border/50 bg-card/50 transition-colors hover:border-border"
                >
                  <CardHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="size-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          Lead Scraper &mdash; Built with Next.js, Supabase, and Brave Search
        </div>
      </footer>
    </div>
  );
}
