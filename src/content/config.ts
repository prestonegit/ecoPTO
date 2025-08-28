import { z, defineCollection } from 'astro:content';

const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    achievements_title: z.string().optional(),
    achievements: z.array(z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string().optional(),
        image: z.string().optional(),
    })).optional(),
    image1: z.string().optional(),
    image2: z.string().optional(),
    image3: z.string().optional(),
    image4: z.string().optional(),
  }),
});

const leadershipCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    title: z.string(),
    bio: z.string().optional(),
    image: z.string().optional(),
    order: z.number().optional(),
  }),
});

const settingsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    site_name: z.string(),
    theme: z.string(),
    hero_animation_file: z.string().optional(),
    earth_connection_icon: z.string().optional(),
    community_engagement_icon: z.string().optional(),
    youth_wellbeing_icon: z.string().optional(),
  }),
});

const eventsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    eventDate: z.date(),
    location: z.string().optional(),
    image: z.string().optional(),
    externalUrl: z.string().url().optional(), // New field for external URL
  }),
});

export const collections = {
  pages: pagesCollection,
  leadership: leadershipCollection,
  settings: settingsCollection,
  events: eventsCollection,
};