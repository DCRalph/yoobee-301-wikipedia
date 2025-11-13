"use client";

import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Play,
  Trophy,
  Target,
  Users,
  Gamepad2,
  Brain,
  Zap,
  Star,
} from "lucide-react";

// Feature card component
const FeatureCard = ({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
}) => (
  <Card className="relative overflow-hidden transition-all hover:shadow-lg">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
          <Icon className="text-primary h-6 w-6" />
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {badge && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {badge}
            </Badge>
          )}
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground text-sm">{description}</p>
    </CardContent>
  </Card>
);

// Game mode card component
const GameModeCard = ({
  title,
  description,
  icon: Icon,
  href,
  isActive = true,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  isActive?: boolean;
}) => (
  <Card
    className={`transition-all hover:shadow-lg ${!isActive && "opacity-50"}`}
  >
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
            <Icon className="text-primary h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {!isActive && (
              <Badge variant="outline" className="mt-1 text-xs">
                Coming Soon
              </Badge>
            )}
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-muted-foreground text-sm">{description}</p>

      {isActive ? (
        <Link href={href}>
          <Button className="w-full">
            <Play className="mr-2 h-4 w-4" />
            Play Now
          </Button>
        </Link>
      ) : (
        <Button disabled className="w-full">
          Coming Soon
        </Button>
      )}
    </CardContent>
  </Card>
);

export default function PlayHomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex items-center gap-2">
              <Gamepad2 className="text-primary h-12 w-12" />
              <h1 className="font-serif text-5xl font-bold md:text-6xl">
                WikiClone Games
              </h1>
            </div>
            <p className="text-muted-foreground mb-8 max-w-2xl text-xl">
              Discover the joy of learning through interactive games. Challenge
              yourself, compete with others, and explore knowledge in exciting
              new ways.
            </p>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 font-serif text-3xl font-bold">Game Modes</h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            Choose your preferred way to explore and learn through interactive
            challenges
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <GameModeCard
            title="Six Degrees"
            description="Navigate from one article to another using only internal links. Test your ability to find connections between topics."
            icon={Target}
            href="/play/six-degrees"
            isActive={true}
          />

          <GameModeCard
            title="Knowledge Quiz"
            description="Test your understanding with interactive quizzes based on article content. Multiple difficulty levels to challenge everyone."
            icon={Brain}
            href="/play/quiz"
            isActive={false}
          />

          <GameModeCard
            title="Speed Challenge"
            description="Race against time to absorb and process information quickly. Perfect for improving reading speed and comprehension."
            icon={Zap}
            href="/play/speed-read"
            isActive={false}
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-serif text-3xl font-bold">
              Why Play Our Games?
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Experience learning in a whole new way with features designed to
              engage and motivate
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Brain}
              title="Enhanced Learning"
              description="Improve knowledge retention and discover fascinating connections between topics through engaging interactive gameplay."
            />

            <FeatureCard
              icon={Trophy}
              title="Competitive Fun"
              description="Challenge yourself and compete with players worldwide. Track your progress and climb the leaderboards."
            />

            <FeatureCard
              icon={Target}
              title="Strategic Thinking"
              description="Develop critical thinking and problem-solving skills by finding optimal solutions under various constraints."
            />

            <FeatureCard
              icon={Users}
              title="Learning Community"
              description="Join a community of curious learners who share your passion for knowledge and discovery."
            />

            <FeatureCard
              icon={Zap}
              title="Quick Sessions"
              description="Enjoy bite-sized gaming sessions that fit perfectly into your schedule. Learn something new anytime, anywhere."
            />

            <FeatureCard
              icon={Star}
              title="Progress Tracking"
              description="Monitor your improvement over time with detailed progress tracking and achievement systems."
              badge="Coming Soon"
            />
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-serif text-3xl font-bold">
              Getting Started
            </h2>
            <p className="text-muted-foreground">
              Jump into the world of educational gaming with these simple steps
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                  <span className="text-primary text-xl font-bold">1</span>
                </div>
                <CardTitle>Choose Your Game</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Select from our available game modes based on your interests
                  and the type of challenge you&apos;re looking for.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                  <span className="text-primary text-xl font-bold">2</span>
                </div>
                <CardTitle>Start Playing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Jump right in and start your first challenge. Each game
                  provides clear instructions and guidance.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                  <span className="text-primary text-xl font-bold">3</span>
                </div>
                <CardTitle>Track Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Monitor your improvement, compete on leaderboards, and
                  celebrate your achievements as you learn.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
