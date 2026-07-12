type Testimonial = {
  name: string;
  rating: number;
  quote: string;
  membership: string;
};

/** Sternebewertung (0–5) im Markenstil. */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} von 5 Sternen`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`h-4 w-4 ${i < rating ? "text-aw-gold" : "text-aw-border"}`}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.9 6.1 21l1.2-6.5L2.5 9.9l6.6-.9L12 2.5Z" />
        </svg>
      ))}
    </div>
  );
}

/**
 * Kundenstimme als vertrauenswürdige Testimonial-Karte.
 */
export default function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const initials = testimonial.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <figure className="flex h-full flex-col rounded-2xl border border-aw-border bg-aw-surface p-6">
      <Stars rating={testimonial.rating} />
      <blockquote className="mt-4 flex-1 text-sm leading-7 text-aw-cream/90">
        „{testimonial.quote}“
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-aw-border pt-5">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-aw-gold text-sm font-bold text-aw-bg"
          aria-hidden="true"
        >
          {initials}
        </span>
        <div>
          <p className="text-sm font-semibold text-aw-cream">{testimonial.name}</p>
          <p className="text-xs font-medium text-aw-gold">{testimonial.membership}</p>
        </div>
      </figcaption>
    </figure>
  );
}
