import Link from "next/link";

export const ISSUE_URL = "https://github.com/Reczec/constellate/issues/new?template=share-what-you-know.yml";

/** One line: the single disclaimer, About, and where to report a gap. Hidden on the full-height atlas pages. */
export default function Footer() {
  return (
    <footer className="border-t border-line px-4 py-5 text-[13px] text-ink-2 md:px-6" data-site-footer>
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-5 gap-y-2">
        <span>Research navigation, not medical advice.</span>
        <Link href="/about" className="hover:text-ink">About</Link>
        <a href={ISSUE_URL} target="_blank" rel="noreferrer" className="hover:text-ink">
          Missing something?
        </a>
      </div>
    </footer>
  );
}
