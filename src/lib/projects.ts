/**
 * One source of truth for the work index. Add a project by appending an entry;
 * the page, index rail, row numbering and the x/xx counter all follow it.
 *
 * `image` points inside /public. Put the real screenshot at that path and set
 * `image` to it; while it is null a designed cover stands in, so a missing
 * file never turns into a broken request.
 * `href` stays null while a case study or repository is not public yet.
 */

export type Project = {
  slug: string;
  index: string;
  title: string;
  category: string;
  meta: string[];
  description: string;
  tags: string[];
  image: string | null;
  href: string | null;
};

export const PROJECTS: Project[] = [
  {
    slug: "multimodal-ai-intelligence-system",
    index: "01",
    title: "MULTIMODAL AI INTELLIGENCE SYSTEM",
    category: "AI APPLICATION",
    meta: ["AI APPLICATION", "FULL-STACK", "2026"],
    description:
      "A Next.js app that uses Google's Gemini to work with different kinds of input in one place.",
    tags: ["NEXT.JS", "GEMINI", "AI"],
    // Drop /images/projects/multimodal-ai.png in and point here.
    image: null,
    href: null,
  },
  {
    slug: "online-food-ordering-system",
    index: "02",
    title: "ONLINE FOOD ORDERING SYSTEM",
    category: "WEB APPLICATION",
    meta: ["WEB APPLICATION", "FULL-STACK", "2026"],
    description:
      "A Django web app for ordering food online: browse the menu, fill a cart, place orders, and manage everything from an admin dashboard.",
    tags: ["DJANGO", "PYTHON", "FULL-STACK"],
    // Drop /images/projects/food-ordering.png in and point here.
    image: null,
    href: null,
  },
  {
    slug: "student-management-system",
    index: "03",
    title: "STUDENT MANAGEMENT SYSTEM",
    category: "WEB APPLICATION",
    meta: ["WEB APPLICATION", "FULL-STACK", "2026"],
    description:
      "A Flask-based system for managing student records, with JWT login and a plain HTML/JS frontend.",
    tags: ["FLASK", "JWT", "HTML/JS"],
    // Drop /images/projects/student-management.png in and point here.
    image: null,
    href: null,
  },
];
