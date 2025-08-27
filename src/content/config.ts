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

export const collections = {
  pages: pagesCollection,
  leadership: leadershipCollection,
  // Your other collections like 'events' can be defined here too
};