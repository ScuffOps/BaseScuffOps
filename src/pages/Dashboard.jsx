
import React, { useState, useEffect } from "react";
import { LogEntry } from "@/entities/LogEntry";
import { Content } from "@/entities/Content";
import MetricCard from "../components/shared/MetricCard";
import StatusChip from "../components/shared/StatusChip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Youtube, Music4, Timer, Users as UsersIcon, TrendingUp, Video, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Dashboard() {
  const [logs, setLogs] = useState([]);
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [logsData, contentData] = await Promise.all([
      LogEntry.list("-date"),
      Content.list("-published_date")]
      );
      setLogs(logsData);
      setContent(contentData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  };

  function minutesBetween(start, end) {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let startMin = sh * 60 + sm;
    let endMin = em; // Only minutes are needed here from the end, hours are handled by the next line
    if (eh !== undefined && !isNaN(eh)) endMin += eh * 60; // Add end hours
    if (endMin < startMin) endMin += 24 * 60; // Handle overnight streams
    return Math.max(0, endMin - startMin);
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentLogs7d = logs.filter((l) => {
    const d = new Date(l.date);
    // Ensure date is valid and falls within the last 7 days (inclusive of today)
    return !isNaN(d.getTime()) && d >= sevenDaysAgo && d <= now;
  });

  const hoursStreamed7d = (recentLogs7d.reduce((sum, l) => sum + minutesBetween(l.start, l.end), 0) / 60).toFixed(1);
  const avgCcv7d = recentLogs7d.length ?
  Math.round(recentLogs7d.filter((l) => typeof l.avg_ccv === "number").reduce((s, l) => s + (l.avg_ccv || 0), 0) / recentLogs7d.length) :
  0;
  const avgEngagement7d = recentLogs7d.length ?
  (recentLogs7d.filter((l) => typeof l.twitch_engagement === "number").reduce((s, l) => s + (l.twitch_engagement || 0), 0) / recentLogs7d.length).toFixed(1) :
  0;

  const publishedContent7d = content.filter((c) => {
    if (!c.published_date) return false;
    const d = new Date(c.published_date);
    return !isNaN(d.getTime()) && d >= sevenDaysAgo && d <= now;
  });

  const ytUploads7d = publishedContent7d.filter((c) => c.platform === "youtube").length;
  const ttPosts7d = publishedContent7d.filter((c) => c.platform === "tiktok").length;

  const recentStreams = logs.slice(0, 5); // Display top 5 recent logs

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {Array(5).fill(0).map((_, i) =>
          <Card key={i} className="animate-pulse !rounded-[var(--panel-radius)] bg-slate-900/80">
              <CardHeader className="space-y-0 pb-3">
                <div className="h-4 bg-slate-800 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-slate-800 rounded w-16 mb-2"></div>
                <div className="h-4 bg-slate-800 rounded w-20"></div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>);

  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-main-gradient rounded-[var(--panel-radius)] p-8 text-white">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Left: Image */}
          <img
            src="https://c.l3n.co/P6Mje2.gif"
            alt="SUHH SCUFFOX?"
            className="w-full max-w-md rounded-xl border border-white/20 shadow-lg" />

          {/* Right: Hero panel */}
          <div className="flex-1 w-full">
            <Card className="glass-card text-white">
              <CardContent className="mx-32 my-1 px-8 py-6">
                <h1 className="bg-transparent mr-1 mb-1 text-xl font-semibold text-center lowercase md:text-center">🞮﹒──··ꔫ··──﹒🞮 <p> welcome home </p>
                <p>
🞮﹒──··ꔫ··──﹒🞮</p>

                </h1>

                <p className="md:text-left text-center mt-4 text-lg font-thin no-underline">
                  ˑ.˚⊹ analytics﹠content at a glance to make the most out of your chaos ⊹˚.ˑ
                </p>

                <div className="mt-6 flex flex-col gap-3 w-full sm:w-auto">
                  <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-200 !rounded-[var(--button-radius)]">
                    <Link
                      to={createPageUrl("BrainDump")} className="bg-[#0a0533] text-[#ffffff] px-1 font-semibold no-underline normal-case inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-11 rounded-md hover:bg-slate-200 !rounded-[var(--button-radius)] [&_svg]:size-1">ƁɌᗩⲒƝ ᗫ∪ⱮꝒ
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="border-slate-300/50 text-white hover:bg-white/10 !rounded-[var(--button-radius)]">
                    <Link
                      to={createPageUrl("Logs")} className="bg-[#121459] text-4xl px-8 text-2xl font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border hover:text-accent-foreground h-11 rounded-md border-slate-300/50 hover:bg-white/10 !rounded-[var(--button-radius)]">ĿᏫԌ ꕷƬɌΞᗩⱮ
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Hours Streamed (7d)"
          value={hoursStreamed7d}
          change={0}
          changeLabel=""
          icon={Timer}
          color="blue" />

        <MetricCard
          title="Avg CCV (7d)"
          value={avgCcv7d}
          change={0}
          changeLabel=""
          icon={UsersIcon}
          color="purple" />

        <MetricCard
          title="Twitch Engagement (7d)"
          value={`${avgEngagement7d}%`}
          change={0}
          changeLabel=""
          icon={TrendingUp}
          color="green" />

        <MetricCard
          title="YouTube Uploads (7d)"
          value={ytUploads7d}
          change={0}
          changeLabel=""
          icon={Video}
          color="red" />

        <MetricCard
          title="TikTok Posts (7d)"
          value={ttPosts7d}
          change={0}
          changeLabel=""
          icon={Music4}
          color="pink" />

      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Streams */}
        <Card className="shadow-xl bg-white/5 backdrop-blur-md border border-white/10 !rounded-[var(--panel-radius)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-100">Recent Streams</CardTitle>
            <Button asChild variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
              <Link to={createPageUrl("Logs")}>View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentStreams.length > 0 ?
              recentStreams.map((item) =>
              <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-100 mb-1">{item.game || "Unlisted Game"}</h4>
                      <p className="text-sm text-slate-300">
                        {new Date(item.date).toLocaleDateString()} • {item.start} - {item.end || "Ongoing"}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-300">
                      {Math.round(minutesBetween(item.start, item.end) / 60 * 10) / 10}h
                    </div>
                  </div>
              ) :

              <div className="text-center py-8 text-slate-500">
                  <Play className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p>No streams yet. Log your first session!</p>
                </div>
              }
            </div>
          </CardContent>
        </Card>

        {/* Recent Content */}
        <Card className="shadow-xl bg-white/5 backdrop-blur-md border border-white/10 !rounded-[var(--panel-radius)]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold text-slate-100">Recent Content</CardTitle>
            <Button asChild variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
              <Link to={createPageUrl("Ideas")}>Open Pipeline</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {publishedContent7d.length > 0 ?
              publishedContent7d.slice(0, 5).map((c) =>
              <div key={c.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-100 mb-1">{c.title}</h4>
                      <p className="text-sm text-slate-300 capitalize">{c.platform} • {c.content_type}</p>
                    </div>
                    <StatusChip status={c.status} />
                  </div>
              ) :

              <div className="text-center py-8 text-slate-500">
                  <Video className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                  <p>No recent uploads</p>
                </div>
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

}