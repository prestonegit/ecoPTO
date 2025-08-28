export const config = {
  backend: {
    name: 'test-repo',
  },
  local_backend: true,
  media_folder: "src/assets/images",
  public_folder: "/assets/images",
  collections: [
    {
      name: "settings",
      label: "Global Site Settings",
      files: [
        {
          file: "src/content/settings/global.json",
          label: "Global Site Settings",
          name: "settings",
          fields: [
            { label: "Site Name", name: "site_name", widget: "string", default: "Hopewell Valley PTO" },
            {
              label: "Color Theme",
              name: "theme",
              widget: "select",
              options: [
                { label: "School Colors (Maroon & Gold)", value: "theme-district-maroon" },
                { label: "Summer", value: "theme-summer" },
                { label: "Fall", value: "theme-fall" },
                { label: "Winter/Spring", value: "theme-winter-spring" }
              ],
              default: "theme-district-maroon"
            },
            { label: "Favicon", name: "favicon", widget: "image", media_library: { config: { multiple: false, accept: "image/x-icon" } } },
            { label: "Global SVG Icon", name: "global_svg_icon", widget: "image", media_library: { config: { multiple: false, accept: "image/svg+xml" } } }
          ]
        }
      ]
    },
    {
      name: "homepage",
      label: "Homepage",
      files: [
        {
          file: "src/content/homepage/home.json",
          label: "Homepage",
          name: "home",
          fields: [
            { label: "Hero Title", name: "hero_title", widget: "string" },
            { label: "Hero Subtitle", name: "hero_subtitle", widget: "text" },
            { label: "Hero Button Text", name: "hero_button_text", widget: "string" },
            { 
              label: "Hero Animation File", 
              name: "hero_animation_file", 
              widget: "file",
              media_library: {
                config: {
                  multiple: false,
                  accept: "application/json"
                }
              }
            },
            { label: "Mission Title", name: "mission_title", widget: "string" },
            { label: "Mission Subtitle", name: "mission_subtitle", widget: "text" },
            {
              label: "Earth Connection Icon",
              name: "earth_connection_icon",
              widget: "image",
              media_library: {
                config: {
                  multiple: false,
                  accept: "image/svg+xml"
                }
              }
            },
            {
              label: "Community Engagement Icon",
              name: "community_engagement_icon",
              widget: "image",
              media_library: {
                config: {
                  multiple: false,
                  accept: "image/svg+xml"
                }
              }
            },
            {
              label: "Youth Wellbeing Icon",
              name: "youth_wellbeing_icon",
              widget: "image",
              media_library: {
                config: {
                  multiple: false,
                  accept: "image/svg+xml"
                }
              }
            },
            { label: "Events Title", name: "events_title", widget: "string" },
            { label: "Events Subtitle", name: "events_subtitle", widget: "text" },
            { label: "Events Section Title", name: "events_section_title", widget: "string" },
            { label: "Volunteer Section Title", name: "volunteer_section_title", widget: "string" },
            { label: "Contact Title", name: "contact_title", widget: "string" },
            { label: "Contact Subtitle", name: "contact_subtitle", widget: "text" },
            { label: "Contact Email", name: "contact_email", widget: "string" }
          ]
        }
      ]
    },
    {
      name: "pages",
      label: "Pages",
      files: [
        {
          file: "src/content/pages/about-us.mdx",
          label: "About Us Page",
          name: "about",
          fields: [
            { label: "Title", name: "title", widget: "string" },
            { label: "Body", name: "body", widget: "markdown" },
            { label: "Image 1", name: "image1", widget: "image" },
            { label: "Image 2", name: "image2", widget: "image" }
          ]
        },
        {
          file: "src/content/pages/impact.mdx",
          label: "Community Impact Page",
          name: "impact",
          fields: [
            { label: "Main Title", name: "title", widget: "string", default: "Community Impact" },
            { label: "Subtitle", name: "subtitle", widget: "string" },
            { label: "Achievements Title", name: "achievements_title", widget: "string", default: "Achievements This Year" },
            {
              label: "Achievements List",
              name: "achievements",
              widget: "list",
              fields: [
                { label: "Title", name: "title", widget: "string" },
                { label: "Description", name: "description", widget: "text" },
                {
                  label: "Icon",
                  name: "icon",
                  widget: "image",
                  required: false,
                  media_library: {
                    config: {
                      multiple: false,
                      accept: "image/svg+xml"
                    }
                  }
                },
                {
                  label: "Image",
                  name: "image",
                  widget: "image",
                  required: false,
                }
              ]
            },
            { label: "Image 1 (Top-Left)", name: "image1", widget: "image" },
            { label: "Image 2 (Top-Right)", name: "image2", widget: "image" },
            { label: "Image 3 (Bottom-Left)", name: "image3", widget: "image" },
            { label: "Image 4 (Bottom-Right)", name: "image4", widget: "image" }
          ]
        }
      ]
    },
    {
      name: "leaders",
      label: "Leaders",
      folder: "src/content/leadership",
      create: true,
      slug: "{{slug}}",
      extension: "mdx",
      format: "frontmatter",
      fields: [
        { label: "Name", name: "name", widget: "string" },
        { label: "Title", name: "title", widget: "string" },
        { label: "Bio", name: "bio", widget: "markdown", required: false },
        { label: "Image", name: "image", widget: "image", required: false },
        { label: "Order", name: "order", widget: "number", required: false }
      ]
    },
    {
      name: "events",
      label: "Events",
      folder: "src/content/events",
      create: true,
      slug: "{{year}}-{{month}}-{{day}}-{{slug}}",
      extension: "mdx",
      format: "frontmatter",
      fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "Description", name: "description", widget: "markdown" },
        { label: "Event Date", name: "eventDate", widget: "datetime" },
        { label: "Image", name: "image", widget: "image", required: false },
        { label: "External URL", name: "externalUrl", widget: "string", required: false, pattern: ["^https?://", "Must be a valid URL (e.g., https://example.com)"] },
      ]
    },
    {
      name: "volunteer_opportunities",
      label: "Volunteer Opportunities",
      folder: "src/content/volunteerOpportunities",
      create: true,
      slug: "{{slug}}",
      fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "Description", name: "description", widget: "markdown", required: false },
        { label: "Icon", name: "icon", widget: "string", required: false },
        { label: "Learn More URL", name: "learnMore", widget: "string", required: false, pattern: ["^https?://", "Must be a valid URL (e.g., https://example.com)"] },
      ]
    }
  ]
};