import Link from "next/link";
import type { Metadata } from "next";
import Hero from "@/components/marketing/Hero";
import PlatformText from "@/components/platform-text/PlatformText";
import PlatformImage from "@/components/platform-text/PlatformImage";
import CourseCatalogCard from "@/components/courses/CourseCatalogCard";
import CourseGroupCard from "@/components/courses/CourseGroupCard";
import ToolCard from "@/components/cards/ToolCard";
import MembershipCard from "@/components/cards/MembershipCard";
import BlogCard from "@/components/cards/BlogCard";
import HelpSupportCard from "@/components/help/HelpSupportCard";
import HelpHubCards from "@/components/help/HelpHubCards";
import HomepageCommunitySocialSection from "@/components/marketing/HomepageCommunitySocialSection";
import PhilosophySection from "@/components/marketing/PhilosophySection";
import HomepageCommunityReviewsSection from "@/components/marketing/HomepageCommunityReviewsSection";
import {
  listFeaturedHomepageCourses,
  listLatestCourses,
} from "@/lib/courses/course-catalog-service";
import { listPublicCourseGroups } from "@/lib/course-groups/course-group-service";
import {
  formatHomepageHeroStatValue,
  getHomepageHeroStats,
} from "@/lib/marketing/homepage-stats-service";
import {
  tools,
  memberships,
  philosophyValues,
  philosophyQuote,
} from "@/lib/placeholder-data";
import { getHomepageBlogPosts } from "@/lib/blog/blog-service";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";
import PageSeoJsonLd from "@/components/seo/PageSeoJsonLd";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/", {
    title: "Alles-Wurst – Handwerkliche Wurstherstellung",
    description:
      "Lerne Wurst selber machen in strukturierten Kursen, nutze präzise Werkzeuge und werde Teil einer Community für Fleischverarbeitung und Räuchern.",
  });
}

export default async function HomePage() {
  const [featuredCourses, courseGroups, latestBlogPosts, heroStats] =
    await Promise.all([
      listFeaturedHomepageCourses(),
      listPublicCourseGroups(),
      getHomepageBlogPosts(3),
      getHomepageHeroStats(),
    ]);
  const latestCourses = await listLatestCourses(
    3,
    featuredCourses.map((course) => course.id),
  );

  return (
    <>
      <PageSeoJsonLd routeKey="static:/" />
      <Hero
        eyebrow={
          <PlatformText
            textKey="home.hero.eyebrow"
            elementType="subheading"
            as="span"
          />
        }
        title={
          <PlatformText
            textKey="home.hero.title"
            elementType="heading"
            as="span"
          />
        }
        subtitle={
          <PlatformText
            textKey="home.hero.subtitle"
            elementType="text"
            as="span"
          />
        }
        backgroundImage={
          <PlatformImage
            textKey="home.hero.image"
            altKey="home.hero.image_alt"
            fallback="/hero-werkstatt.png"
            altFallback="Fleischermeister bei der Arbeit – Fleisch zuschneiden in der Werkstatt"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        }
        logoImage={
          <PlatformImage
            textKey="home.hero.logo"
            fallback="/hero-logo.png"
            altFallback=""
            width={1024}
            height={1024}
            priority
            className="h-full w-full object-contain drop-shadow-[0_10px_40px_rgba(0,0,0,0.55)]"
          />
        }
        primaryCta={{
          label: (
            <PlatformText
              textKey="home.hero.cta_primary"
              elementType="button"
              as="span"
            />
          ),
          href: "/mitgliedschaft",
        }}
        secondaryCta={{
          label: (
            <PlatformText
              textKey="home.hero.cta_secondary"
              elementType="button"
              as="span"
            />
          ),
          href: "/akademie/kurse",
        }}
        stats={[
          {
            key: "stat1",
            value: formatHomepageHeroStatValue(heroStats.catalogLessonCount),
            label: (
              <PlatformText
                textKey="home.hero.stat1.label"
                elementType="text"
                as="span"
              />
            ),
          },
          {
            key: "stat2",
            value: formatHomepageHeroStatValue(heroStats.activeMemberCount),
            label: (
              <PlatformText
                textKey="home.hero.stat2.label"
                elementType="text"
                as="span"
              />
            ),
          },
          {
            key: "stat3",
            value: formatHomepageHeroStatValue(heroStats.workshopToolCount),
            label: (
              <PlatformText
                textKey="home.hero.stat3.label"
                elementType="text"
                as="span"
              />
            ),
          },
        ]}
      />

      {/* Philosophie */}
      <PhilosophySection values={philosophyValues} quote={philosophyQuote} />

      {/* Kursbereiche */}
      {courseGroups.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <PlatformText
                textKey="home.courses.eyebrow"
                elementType="subheading"
                as="p"
                className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold"
              />
            <h2 className="mt-2 font-display text-3xl font-bold text-aw-cream">
              <PlatformText
                textKey="home.courses.title"
                elementType="heading"
                as="span"
              />
            </h2>
            <PlatformText
                textKey="home.courses.description"
                elementType="text"
                as="p"
                className="mt-4 text-base leading-7 text-aw-muted"
              />
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {courseGroups.map((group) => (
              <CourseGroupCard key={group.id} group={group} />
            ))}
          </div>
        </section>
      )}

      {/* Empfohlene Kurse (manuell hervorgehoben) */}
      {featuredCourses.length > 0 && (
        <section className="border-t border-aw-border bg-aw-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <PlatformText
                textKey="home.featured.eyebrow"
                elementType="subheading"
                as="p"
                className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold"
              />
                <h2 className="mt-2 font-display text-3xl font-bold text-aw-cream">
                  <PlatformText
                    textKey="home.featured.title"
                    elementType="heading"
                    as="span"
                  />
                </h2>
              </div>
              <Link
                href="/akademie/kurse"
                className="hidden text-sm font-semibold text-aw-gold hover:text-aw-cream sm:inline"
              >
                <PlatformText
                  textKey="home.featured.link"
                  elementType="link"
                  as="span"
                />
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCourses.map((course) => (
                <CourseCatalogCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Neueste Kurse */}
      {latestCourses.length > 0 && (
        <section className="border-t border-aw-border">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <PlatformText
                textKey="home.latest.eyebrow"
                elementType="subheading"
                as="p"
                className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold"
              />
                <h2 className="mt-2 font-display text-3xl font-bold text-aw-cream">
                  <PlatformText
                    textKey="home.latest.title"
                    elementType="heading"
                    as="span"
                  />
                </h2>
              </div>
              <Link
                href="/akademie/kurse"
                className="hidden text-sm font-semibold text-aw-gold hover:text-aw-cream sm:inline"
              >
                <PlatformText
                  textKey="home.latest.link"
                  elementType="link"
                  as="span"
                />
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestCourses.map((course) => (
                <CourseCatalogCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Werkstatt */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <PlatformText
                textKey="home.tools.eyebrow"
                elementType="subheading"
                as="p"
                className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold"
              />
            <h2 className="mt-2 font-display text-3xl font-bold text-aw-cream">
              <PlatformText
                textKey="home.tools.title"
                elementType="heading"
                as="span"
              />
            </h2>
            <PlatformText
                textKey="home.tools.description"
                elementType="text"
                as="p"
                className="mt-4 text-base leading-7 text-aw-muted"
              />
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tools.slice(0, 3).map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </div>
      </section>

      {/* Mitgliedschaft */}
      <section className="border-y border-aw-border bg-aw-surface/40">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <PlatformText
                textKey="home.membership.eyebrow"
                elementType="subheading"
                as="p"
                className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold"
              />
            <h2 className="mt-2 font-display text-3xl font-bold text-aw-cream">
              <PlatformText
                textKey="home.membership.title"
                elementType="heading"
                as="span"
              />
            </h2>
            <PlatformText
                textKey="home.membership.description"
                elementType="text"
                as="p"
                className="mt-4 text-base leading-7 text-aw-muted"
              />
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {memberships.map((plan) => (
              <MembershipCard key={plan.slug} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      <HomepageCommunityReviewsSection />

      {/* Hilfe & Unterstützung */}
      <section className="border-y border-aw-border bg-aw-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <PlatformText
                textKey="home.help.eyebrow"
                elementType="subheading"
                as="p"
                className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold"
              />
            <h2 className="mt-2 font-display text-3xl font-bold text-aw-cream">
              <PlatformText
                textKey="home.help.title"
                elementType="heading"
                as="span"
              />
            </h2>
            <PlatformText
                textKey="home.help.description"
                elementType="text"
                as="p"
                className="mt-4 text-base leading-7 text-aw-muted"
              />
          </div>
          <HelpHubCards />

          {/* CTA-Bereich */}
          <div className="mt-12 overflow-hidden rounded-2xl border border-aw-gold/25 bg-gradient-to-r from-aw-gold/10 via-aw-surface to-aw-surface p-8 text-center sm:p-10">
            <h3 className="font-display text-2xl font-bold text-aw-cream sm:text-3xl">
              <PlatformText
                textKey="home.help.cta_title"
                elementType="heading"
                as="span"
              />
            </h3>
            <PlatformText
                textKey="home.help.cta_description"
                elementType="text"
                as="p"
                className="mx-auto mt-3 max-w-lg text-sm leading-6 text-aw-muted"
              />
            <Link
              href="/hilfe"
              className="mt-6 inline-flex items-center justify-center rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
            >
              <PlatformText
                textKey="home.help.cta_button"
                elementType="button"
                as="span"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* Neueste Blogbeiträge */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <PlatformText
                textKey="home.blog.eyebrow"
                elementType="subheading"
                as="p"
                className="text-xs font-medium uppercase tracking-[0.25em] text-aw-gold"
              />
              <h2 className="mt-2 font-display text-3xl font-bold text-aw-cream">
                <PlatformText
                  textKey="home.blog.title"
                  elementType="heading"
                  as="span"
                />
              </h2>
            </div>
            <Link
              href="/magazin"
              className="hidden text-sm font-semibold text-aw-gold hover:text-aw-cream sm:inline"
            >
              <PlatformText
                textKey="home.blog.link"
                elementType="link"
                as="span"
              />
            </Link>
          </div>
          {latestBlogPosts.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestBlogPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-aw-border bg-aw-surface/40 p-8 text-center">
              <p className="text-sm text-aw-muted">
                Bald erscheinen hier die neuesten Magazin-Artikel.
              </p>
              <Link
                href="/magazin"
                className="mt-4 inline-block text-sm font-semibold text-aw-gold hover:text-aw-cream"
              >
                Zum Magazin →
              </Link>
            </div>
          )}
        </div>
      </section>

      <HomepageCommunitySocialSection />

      {/* Community-CTA */}
      <section className="border-t border-aw-border bg-gradient-to-b from-aw-surface to-aw-bg">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-aw-cream sm:text-4xl">
            <PlatformText
              textKey="home.community_cta.title"
              elementType="heading"
              as="span"
            />
          </h2>
          <PlatformText
                textKey="home.community_cta.description"
                elementType="text"
                as="p"
                className="mx-auto mt-4 max-w-xl text-base leading-7 text-aw-muted"
              />
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/community"
              className="inline-flex items-center justify-center rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg transition-colors hover:bg-aw-gold-dark hover:text-aw-cream"
            >
              <PlatformText
                textKey="home.community_cta.primary"
                elementType="button"
                as="span"
              />
            </Link>
            <Link
              href="/kontakt"
              className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-aw-cream ring-1 ring-aw-border transition-colors hover:bg-aw-surface-2"
            >
              <PlatformText
                textKey="home.community_cta.secondary"
                elementType="button"
                as="span"
              />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
