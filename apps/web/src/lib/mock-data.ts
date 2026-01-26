// Mock data for demo/testing purposes

export const mockUser = {
  id: "user-1",
  name: "Demo User",
  email: "demo@notto.site",
};

export const mockWorkspaces = [
  { id: "ws-1", name: "Acme Corp", slug: "acme-corp", icon: "🏢" },
  { id: "ws-2", name: "Personal", slug: "personal", icon: "📁" },
];

export const mockProjects = {
  "ws-1": [
    {
      id: "proj-1",
      name: "Marketing Website",
      slug: "marketing-website",
      annotationCount: 3,
    },
    {
      id: "proj-2",
      name: "Mobile App",
      slug: "mobile-app",
      annotationCount: 1,
    },
  ],
  "ws-2": [
    {
      id: "proj-3",
      name: "Side Project",
      slug: "side-project",
      annotationCount: 0,
    },
  ],
};

export const mockAnnotations = {
  "proj-1": [
    {
      id: "ann-1",
      title: "Button alignment issue on hero section",
      description:
        "The CTA button is not centered properly on mobile devices. It shifts to the left by about 10px.",
      priority: "high" as const,
      type: "bug",
      pageUrl: "https://acme.com/landing",
      pageTitle: "Acme - Landing Page",
      screenshotAnnotated:
        "https://placehold.co/800x600/f5f5f5/a3a3a3?text=Screenshot+1",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      project: {
        id: "proj-1",
        name: "Marketing Website",
        slug: "marketing-website",
      },
      user: { id: "user-1", name: "Demo User", email: "demo@notto.site" },
    },
    {
      id: "ann-2",
      title: "Typo in pricing section",
      description:
        "The word 'professional' is misspelled as 'proffesional' in the Pro tier description.",
      priority: "low" as const,
      type: "content",
      pageUrl: "https://acme.com/pricing",
      pageTitle: "Acme - Pricing",
      screenshotAnnotated:
        "https://placehold.co/800x600/fef2f2/ef4444?text=Screenshot+2",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      project: {
        id: "proj-1",
        name: "Marketing Website",
        slug: "marketing-website",
      },
      user: { id: "user-1", name: "Demo User", email: "demo@notto.site" },
    },
    {
      id: "ann-3",
      title: "Footer links broken on Safari",
      description:
        "Social media links in the footer don't work on Safari 16. They work fine on Chrome and Firefox.",
      priority: "medium" as const,
      type: "bug",
      pageUrl: "https://acme.com/about",
      pageTitle: "Acme - About Us",
      screenshotAnnotated:
        "https://placehold.co/800x600/fefce8/eab308?text=Screenshot+3",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      project: {
        id: "proj-1",
        name: "Marketing Website",
        slug: "marketing-website",
      },
      user: { id: "user-1", name: "Demo User", email: "demo@notto.site" },
    },
  ],
  "proj-2": [
    {
      id: "ann-4",
      title: "Login screen crashes on Android 12",
      description:
        "App crashes immediately when tapping the login button on Pixel 6 running Android 12.",
      priority: "high" as const,
      type: "bug",
      pageUrl: "app://mobile/login",
      pageTitle: "Login Screen",
      screenshotAnnotated:
        "https://placehold.co/400x800/fef2f2/ef4444?text=Mobile+Screenshot",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      project: { id: "proj-2", name: "Mobile App", slug: "mobile-app" },
      user: { id: "user-1", name: "Demo User", email: "demo@notto.site" },
    },
  ],
  "proj-3": [],
};

// Helper to get all annotations for a workspace
export function getWorkspaceAnnotations(workspaceId: string) {
  const projects = mockProjects[workspaceId as keyof typeof mockProjects] || [];
  const allAnnotations = projects.flatMap(
    (p) => mockAnnotations[p.id as keyof typeof mockAnnotations] || [],
  );
  return allAnnotations.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

// Helper to find workspace by slug
export function getWorkspaceBySlug(slug: string) {
  return mockWorkspaces.find((w) => w.slug === slug);
}

// Helper to find project by slug within a workspace
export function getProjectBySlug(workspaceId: string, projectSlug: string) {
  const projects = mockProjects[workspaceId as keyof typeof mockProjects] || [];
  return projects.find((p) => p.slug === projectSlug);
}

// Helper to get annotation by ID
export function getAnnotationById(id: string) {
  for (const projectAnnotations of Object.values(mockAnnotations)) {
    const found = projectAnnotations.find((a) => a.id === id);
    if (found) return found;
  }
  return null;
}
