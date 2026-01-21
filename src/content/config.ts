import { z, defineCollection } from 'astro:content';

const pagesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    project_highlight_pdf: z.string().optional(),
    achievements_title: z.string().optional(),
    achievements: z.array(z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      image: z.string().optional(),
      link_text: z.string().optional(),
      link_url: z.string().url().optional(),
      link_file: z.string().optional(),
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

const aboutUsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    history_title: z.string().optional(),
    history_content: z.string().optional(),
    who_we_are_title: z.string().optional(),
    who_we_are_content: z.string().optional(),
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
    signup_modal_title: z.string().optional(),
    signup_modal_subtitle: z.string().optional(),
    signup_name_label: z.string().optional(),
    signup_email_label: z.string().optional(),
    signup_school_affiliation_label: z.string().optional(),
    signup_impact_focus_label: z.string().optional(),
    signup_receive_updates_label: z.string().optional(),
    signup_active_role_label: z.string().optional(),
    signup_volunteer_roles_prompt: z.string().optional(),
    signup_no_volunteer_roles_message: z.string().optional(),
    signup_button_text: z.string().optional(),
  }),
});

const eventsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    cardDescription: z.string(),
    eventDate: z.date(),
    dateOverride: z.string().optional(),
    location: z.string().optional(),
    image: z.string().nullable().optional(),
    externalUrl: z.string().url().optional(), // New field for external URL
  }),
});

const getInvolvedCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
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

const transparencyCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    link: z.string().url(),
    pubDate: z.date(),
  }),
});

const newsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
    pubDate: z.date(),
    image: z.string().optional(),
  }),
});

const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    goal: z.string(),
    description: z.string(),
    participants: z.array(z.object({
      name: z.string(),
      contact: z.string(),
    })).optional(),
    keywords: z.array(z.string()).optional(),
    members: z.number().optional(),
  }),
});

export const collections = {
  pages: pagesCollection,
  aboutUs: aboutUsCollection,
  homepage: homepageCollection,
  leadership: leadershipCollection,
  settings: settingsCollection,
  events: eventsCollection,
  getInvolved: getInvolvedCollection,
  news: newsCollection,
  transparency: transparencyCollection,
  projects: projectsCollection,
};