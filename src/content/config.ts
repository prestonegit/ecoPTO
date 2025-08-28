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

export const collections = {
  pages: pagesCollection,
  leadership: leadershipCollection,
  settings: settingsCollection,
  // Your other collections like 'events' can be defined here too
};