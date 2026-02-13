export const config = {
  local_backend: true,
  backend: {
    name: 'git-gateway',
    branch: 'main',
  },
  media_folder: "public/assets/images",
  public_folder: "/assets/images",
  collections: [
    // Form
    {
      name: "signup",
      label: "Form - Signup",
      files: [
        {
          file: "src/content/signup/signup.json",
          label: "Signup Form Content",
          name: "signup",
          fields: [
            { label: "Signup Form Title", name: "signupFormTitle", widget: "string" },

            { label: "Signup Form Subtitle", name: "signupFormSubtitle", widget: "text" },


            { label: "Impact Focus Placeholder", name: "signup_impact_focus_placeholder", widget: "string" },
            { label: "Signup Name Label", name: "signup_name_label", widget: "string" },
            { label: "Name Input", name: "signup_first_name_placeholder", widget: "string" },
            { label: "Signup Email Label", name: "signup_email_label", widget: "string" },
            { label: "Email Label Input", name: "signupFormPlaceholder", widget: "string" },
            { label: "Signup School Affiliation Label", name: "signup_school_affiliation_label", widget: "string" },
            { label: "Signup Impact Focus Label", name: "signup_impact_focus_label", widget: "text" },
            { label: "Signup Receive Updates Label", name: "signup_receive_updates_label", widget: "string" },
            { label: "Signup Active Role Label", name: "signup_active_role_label", widget: "string" },
            { label: "Signup Volunteer Roles Prompt", name: "signup_volunteer_roles_prompt", widget: "string" },
            { label: "Signup No Volunteer Roles Message", name: "signup_no_volunteer_roles_message", widget: "string" },
            { label: "Signup Button Text", name: "signup_button_text", widget: "string" },
          ],
        },
      ],
    },
    // Pages
    {
      name: "about-us",
      label: "Page - About Us",
      folder: "src/content/aboutUs",
      create: false,
      extension: "mdx",
      format: 'frontmatter',
      frontmatter_format: 'yaml',
      fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "History Title", name: "history_title", widget: "string" },
        { label: "History Content", name: "history_content", widget: "markdown" },
        { label: "Who We Are Title", name: "who_we_are_title", widget: "string" },
        { label: "Who We Are Content", name: "who_we_are_content", widget: "markdown" }
      ]
    },
    {
      name: "impact-page",
      label: "Page - Community Impact",
      folder: "src/content/pages",
      create: false,
      extension: "mdx",
      format: 'frontmatter',
      frontmatter_format: 'yaml',
      fields: [
        { label: "Main Title", name: "title", widget: "string" },
        { label: "Subtitle", name: "subtitle", widget: "string" },
        { label: "Achievements Title", name: "achievements_title", widget: "string" },
        {
          label: "Impact Projects",
          name: "achievements",
          widget: "list",
          fields: [
            { label: "Title", name: "title", widget: "string" },
            { label: "Description", name: "description", widget: "text" },
            { label: "Image", name: "image", widget: "image", required: false },
            { label: "Link Text", name: "link_text", widget: "string", required: false, default: "Learn More" },
            { label: "Link URL", name: "link_url", widget: "string", required: false, pattern: ["^https?://", "Must be a valid URL (e.g., https://example.com)"] },
            { label: "Link File (PDF)", name: "link_file", widget: "file", required: false }
          ]
        }
      ]
    },
    {
      name: "research-page",
      label: "Page - Research",
      folder: "src/content/research",
      create: false, // Singleton-ish for now, or just one file
      extension: "mdx",
      format: 'frontmatter',
      frontmatter_format: 'yaml',
      fields: [
        { label: "Page Title", name: "title", widget: "string" },
        { label: "Page Description", name: "description", widget: "markdown" },
        {
          label: "Peer-Reviewed Research",
          name: "peer_reviewed_research",
          widget: "list",
          fields: [
            { label: "Description/Context", name: "title", widget: "string" },
            { label: "Article Title", name: "article_title", widget: "string", required: false },
            { label: "Link URL", name: "link", widget: "string", pattern: ["^https?://", "Must be a valid URL"], required: false },
            { label: "Comment/Subtext", name: "comment", widget: "text", required: false }
          ]
        },
        {
          label: "Books",
          name: "books",
          widget: "list",
          fields: [
            { label: "Book Title", name: "title", widget: "string" },
            { label: "Author", name: "author", widget: "string" },
            { label: "Link URL", name: "link", widget: "string", pattern: ["^https?://", "Must be a valid URL"], required: false },
            { label: "Comment/Subtext", name: "comment", widget: "text", required: false }
          ]
        },
        {
          label: "Online Resources",
          name: "online_resources",
          widget: "list",
          fields: [
            { label: "Resource Title", name: "title", widget: "string" },
            { label: "Link URL", name: "link", widget: "string", pattern: ["^https?://", "Must be a valid URL"] },
            { label: "Comment/Subtext", name: "comment", widget: "text", required: false }
          ]
        }
      ]
    },
    {
      name: "pages",
      label: "Page - Homepage Content",
      files: [
        {
          file: "src/content/homepage/home.json",
          label: "Homepage",
          name: "home",
          fields: [
            { label: "Hero Title", name: "hero_title", widget: "string" },
            { label: "Hero Subtitle", name: "hero_subtitle", widget: "text" },
            { label: "Hero Button Text", name: "hero_button_text", widget: "string" },
            { label: "Mission Title", name: "mission_title", widget: "string" },
            { label: "Mission Subtitle", name: "mission_subtitle", widget: "text" },
            {
              label: "Mission Items",
              name: "mission_items",
              widget: "list",
              fields: [
                { label: "Title", name: "title", widget: "string" },
                { label: "Text", name: "text", widget: "text" },
                { label: "Icon", name: "icon", widget: "image", required: false, media_library: { config: { multiple: false, accept: "image/svg+xml,image/png,image/gif" } } }
              ]
            },
            { label: "Events Title", name: "events_title", widget: "string" },
            { label: "Events Subtitle", name: "events_subtitle", widget: "text" },
            { label: "Events Section Title", name: "events_section_title", widget: "string" },
            { label: "Volunteer Section Title", name: "volunteer_section_title", widget: "string" },
            { label: "Contact Title", name: "contact_title", widget: "string" },
            { label: "Contact Subtitle", name: "contact_subtitle", widget: "text" },
            { label: "Contact Email", name: "contact_email", widget: "string" },
            { label: "Who We Are Title", name: "who_we_are_title", widget: "string" },
            { label: "Who We Are Text", name: "who_we_are_text", widget: "markdown" }
          ]
        }
      ]
    },
    // Content
    {
      name: "events",
      label: "Content - Events",
      folder: "src/content/events",
      create: true,
      slug: "{{year}}-{{month}}-{{day}}-{{slug}}",
      extension: "mdx",
      format: "frontmatter",
      frontmatter_format: 'yaml',
      fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "Event Card Description", name: "cardDescription", widget: "text" },
        { label: "Event Page Description", name: "description", widget: "markdown" },
        { label: "Event Date", name: "eventDate", widget: "datetime" },
        { label: "Date Override", name: "dateOverride", widget: "string", required: false, hint: "e.g., 'Various Dates'. If used, this text will be displayed instead of the event date." },
        { label: "Location", name: "location", widget: "string", required: false },
        { label: "Image", name: "image", widget: "image", required: false },
        { label: "External URL", name: "externalUrl", widget: "string", required: false, pattern: ["^https?://", "Must be a valid URL (e.g., https://example.com)"] },
      ]
    },
    {
      name: "get-involved",
      label: "Content - Get Involved",
      folder: "src/content/get-involved",
      create: true,
      slug: "{{slug}}",
      format: "frontmatter",
      frontmatter_format: 'yaml',
      fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "Description", name: "description", widget: "markdown", required: false },
        { label: "Icon", name: "icon", widget: "string", required: false },
        { label: "Learn More URL", name: "learnMore", widget: "string", required: false, pattern: ["^https?://", "Must be a valid URL (e.g., https://example.com)"] },
      ]
    },
    {
      name: "leaders",
      label: "Content - Leaders",
      folder: "src/content/leadership",
      create: true,
      slug: "{{slug}}",
      extension: "mdx",
      format: "frontmatter",
      frontmatter_format: 'yaml',
      fields: [
        { label: "Name", name: "name", widget: "string" },
        { label: "Title", name: "title", widget: "string" },
        { label: "Bio", name: "bio", widget: "markdown", required: false },
        { label: "Image", name: "image", widget: "image", required: false },
        { label: "Display Order", name: "order", widget: "number", required: false }
      ]
    },
    {
      name: "news",
      label: "Content - News Posts",
      folder: "src/content/news",
      create: true,
      slug: "{{year}}-{{month}}-{{day}}-{{slug}}",
      extension: "mdx",
      format: "frontmatter",
      frontmatter_format: 'yaml',
      fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "Description", name: "description", widget: "text" },
        { label: "Author", name: "author", widget: "string" },
        { label: "Publish Date", name: "pubDate", widget: "datetime" },
        { label: "Featured Image", name: "image", widget: "image", required: false },
        { label: "Body", name: "body", widget: "markdown" }
      ]
    },
    {
      name: "projects",
      label: "Content - Projects",
      folder: "src/content/projects",
      create: true,
      slug: "{{slug}}",
      extension: "mdx",
      format: "frontmatter",
      frontmatter_format: 'yaml',
      fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "Goal", name: "goal", widget: "markdown" },
        { label: "Description", name: "description", widget: "markdown" },
        {
          label: "Participants",
          name: "participants",
          widget: "list",
          fields: [
            { label: "Name", name: "name", widget: "string" },
            { label: "Contact", name: "contact", widget: "string" },
          ]
        },
        { label: "Keywords", name: "keywords", widget: "list", required: false },
        { label: "Number of Members", name: "members", widget: "number", required: false }
      ]
    },
    {
      name: "transparency",
      label: "Content - Transparency",
      folder: "src/content/transparency",
      create: true,
      slug: "{{slug}}",
      extension: "md",
      format: "frontmatter",
      frontmatter_format: 'yaml',
      fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "Subtitle", name: "subtitle", widget: "text" },
        { label: "Document Link", name: "link", widget: "string", pattern: ["^https?://", "Must be a valid URL (e.g., https://example.com)"] },
        { label: "Publish Date", name: "pubDate", widget: "datetime" }
      ]
    },
    // Site Settings
    {
      name: "settings",
      label: "Site Settings - Global",
      files: [
        {
          file: "src/content/settings/global.json",
          label: "Global Site Settings",
          name: "settings",
          fields: [
            { label: "Site Name", name: "site_name", widget: "string", default: "Hopewell Valley PTO" },
            { label: "Favicon", name: "favicon", widget: "image", media_library: { config: { multiple: false, accept: "image/x-icon" } } },
            { label: "Global SVG Icon", name: "global_svg_icon", widget: "image", media_library: { config: { multiple: false, accept: "image/svg+xml" } } },
            {
              label: "Color Theme",
              name: "theme",
              widget: "select",
              options: [
                { label: "Default ecoPTO Theme (Terracotta & Red)", value: "theme-ecopto" },
                { label: "School Colors (Maroon & Gold)", value: "theme-district-maroon" },
                { label: "Summer", value: "theme-summer" },
                { label: "Fall", value: "theme-fall" },
                { label: "Winter/Spring", value: "theme-winter-spring" }
              ],
              default: "theme-district-maroon"
            },

            {
              label: "Attributions",
              name: "attributions",
              widget: "list",
              required: false,
              fields: [
                { label: "Text", name: "text", widget: "string" },
                { label: "URL", name: "url", widget: "string", required: false, pattern: ["^https?://", "Must be a valid URL (e.g., https://example.com)"] },
              ]
            },

          ]
        }
      ]
    }
  ]
};