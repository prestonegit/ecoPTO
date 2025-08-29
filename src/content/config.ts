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
    hero_title: z.string().optional(),
    hero_subtitle: z.string().optional(),
    hero_button_text: z.string().optional(),
    mission_title: z.string().optional(),
    mission_subtitle: z.string().optional(),
    mission_item_1_title: z.string().optional(),
    mission_item_1_text: z.string().optional(),
    mission_item_2_title: z.string().optional(),
    mission_item_2_text: z.string().optional(),
    mission_item_3_title: z.string().optional(),
    mission_item_3_text: z.string().optional(),
    events_title: z.string().optional(),
    events_subtitle: z.string().optional(),
    events_section_title: z.string().optional(),
    volunteer_section_title: z.string().optional(),
    contact_title: z.string().optional(),
    contact_subtitle: z.string().optional(),
    contact_email: z.string().optional(),
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
    favicon: z.string().optional(),
    global_svg_icon: z.string().optional(),
    attributions: z.array(z.object({
      text: z.string(),
      url: z.string().url().optional(),
    })).optional(),
  }),
});

const eventsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    eventDate: z.date(),
    location: z.string().optional(),
    image: z.string().nullable().optional(),
    externalUrl: z.string().url().optional(), // New field for external URL
  }),
});

const volunteerOpportunitiesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    learnMore: z.string().url().optional(),
  }),
});

const homepageCollection = defineCollection({
  type: 'data',
  schema: z.object({
    hero_title: z.string().optional(),
    hero_subtitle: z.string().optional(),
    hero_button_text: z.string().optional(),
    hero_animation_file: z.string().optional(),
    mission_title: z.string().optional(),
    mission_subtitle: z.string().optional(),
    mission_items: z.array(z.object({
      title: z.string(),
      text: z.string(),
      icon: z.string().optional(),
    })).optional(),
    events_title: z.string().optional(),
    events_subtitle: z.string().optional(),
    events_section_title: z.string().optional(),
    volunteer_section_title: z.string().optional(),
    contact_title: z.string().optional(),
    contact_subtitle: z.string().optional(),
    contact_email: z.string().optional(),
  }),
});

export const collections = {
  pages: pagesCollection,
  homepage: homepageCollection,
  leadership: leadershipCollection,
  settings: settingsCollection,
  events: eventsCollection,
  volunteerOpportunities: volunteerOpportunitiesCollection,
};