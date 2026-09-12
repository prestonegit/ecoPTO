export const config = {
  local_backend: true,
  backend: {
    name: 'git-gateway',
    branch: 'main',
  },
  media_folder: "public/assets/images",
  public_folder: "/assets/images",
  collections: [
    // Newsletters
    {
      name: "newsletters",
      label: "Newsletter issues",
      label_singular: "Newsletter Issue",
      folder: "src/content/newsletters",
      create: true,
      slug: "{{year}}-{{month}}-{{slug}}",
      extension: "md",
      format: "frontmatter",
      frontmatter_format: "yaml",
      summary: "{{subject}} · {{sendDate | date('MMM D, YYYY')}} · {{status | default('draft')}}",
      sortable_fields: [
        { field: "sendDate", label: "Send date", default_sort: "desc" },
        { field: "subject", label: "Subject" },
        { field: "status", label: "Status" },
      ],
      view_filters: [
        { label: "Drafts", field: "status", pattern: "draft" },
        { label: "Waiting in Resend", field: "status", pattern: "in-resend" },
        { label: "Sent", field: "status", pattern: "sent" },
      ],
      fields: [
        { label: "The email itself", name: "section_basics", widget: "section", required: false, hint: "Subject, timing, and the note at the top." },
        { label: "Subject Line", name: "subject", widget: "string", hint: "Shows in the recipient's inbox" },
        { label: "Inbox Preview Text", name: "preheader", widget: "string", required: false, hint: "Short snippet shown next to subject in most inboxes" },
        { label: "Send Date", name: "sendDate", widget: "datetime" },
        { label: "Hero Image", name: "heroImage", widget: "image", required: false, hint: "Optional banner image at the top" },
        { label: "Intro Message", name: "intro", widget: "markdown", required: false, hint: "A note from the team — supports formatting" },

        { label: "What goes in it", name: "section_sections", widget: "section", required: false, hint: "Pull in events and news automatically, or add your own blocks below." },
        { label: "Include Upcoming Events?", name: "includeEvents", widget: "boolean", default: true },
        { label: "Events Intro", name: "eventsIntro", widget: "string", required: false, hint: 'e.g. "Mark your calendars:"' },

        { label: "Include Latest News?", name: "includeNews", widget: "boolean", default: true },
        { label: "News Intro", name: "newsIntro", widget: "string", required: false },

        {
          label: "Custom Blocks",
          label_singular: "Block",
          name: "customBlocks",
          widget: "list",
          required: false,
          summary: "{{fields.type}}: {{fields.title}}",
          types: [
            {
              label: "Callout",
              name: "callout",
              widget: "object",
              fields: [
                { label: "Type", name: "type", widget: "hidden", default: "callout" },
                { label: "Title", name: "title", widget: "string" },
                { label: "Body", name: "body", widget: "markdown" },
              ],
            },
            {
              label: "Story",
              name: "story",
              widget: "object",
              fields: [
                { label: "Type", name: "type", widget: "hidden", default: "story" },
                { label: "Title", name: "title", widget: "string" },
                { label: "Image", name: "image", widget: "image", required: false },
                { label: "Body", name: "body", widget: "markdown" },
              ],
            },
            {
              label: "Image",
              name: "image",
              widget: "object",
              fields: [
                { label: "Type", name: "type", widget: "hidden", default: "image" },
                { label: "Image", name: "image", widget: "image" },
              ],
            },
            {
              label: "Button",
              name: "button",
              widget: "object",
              fields: [
                { label: "Type", name: "type", widget: "hidden", default: "button" },
                { label: "Title", name: "title", widget: "string" },
                { label: "Body", name: "body", widget: "string", required: false },
                { label: "Button Text", name: "buttonText", widget: "string" },
                { label: "Button URL", name: "buttonUrl", widget: "string" },
              ],
            },
          ],
        },

        { label: "Attachments and sign-off", name: "section_extras", widget: "section", required: false, hint: "Linked files, plus the closing line." },
        {
          label: "Files & Downloads",
          label_singular: "File",
          name: "attachments",
          widget: "list",
          required: false,
          summary: "{{fields.label}}",
          hint: "Files linked from the email (PDFs, flyers, etc). They are hosted on the site and linked, not attached — Resend broadcasts can't carry attachments, and links stay out of spam filters.",
          fields: [
            { label: "Label", name: "label", widget: "string", hint: 'How it appears in the email, e.g. "March meeting minutes"' },
            { label: "File", name: "file", widget: "file" },
          ],
        },

        { label: "Closing Note", name: "closing", widget: "markdown", required: false },

        { label: "Sending", name: "section_send", widget: "section", required: false, hint: "Nothing is emailed until you save, and never to the list without a test first." },
        {
          label: "Last test sent",
          name: "lastTestSentAt",
          widget: "hidden",
          required: false,
        },
        {
          label: "Send a test to",
          name: "testEmail",
          widget: "string",
          required: false,
          pattern: ["^$|^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", "Must be a valid email or blank"],

        },
        {
          label: "Send",
          name: "status",
          widget: "newsletter-send",
          default: "draft",
        },
      ],
    },
    // Form
    {
      name: "signup",
      label: "Signup form",
      files: [
        {
          file: "src/content/signup/signup.json",
          label: "Signup Form Content",
          name: "signup",
          fields: [
            { label: "Signup Form Title", name: "signupFormTitle", widget: "string" },
            { label: "Signup Form Subtitle", name: "signupFormSubtitle", widget: "text", required: false },
            { label: "First Name Label", name: "signup_first_name_label", widget: "string" },
            { label: "First Name Placeholder", name: "signup_first_name_placeholder", widget: "string" },
            { label: "Last Name Label", name: "signup_last_name_label", widget: "string" },
            { label: "Last Name Placeholder", name: "signup_last_name_placeholder", widget: "string" },
            { label: "Signup Email Label", name: "signup_email_label", widget: "string" },
            { label: "Email Input Placeholder", name: "signupFormPlaceholder", widget: "string" },
            { label: "Signup School Affiliation Label", name: "signup_school_affiliation_label", widget: "string" },
            { label: "Other School/Affiliation Placeholder", name: "signup_other_school_placeholder", widget: "string", required: false },
            { label: "Signup Strengths Section Title", name: "signup_strengths_label", widget: "string" },
            { label: "Other Strengths Input Placeholder", name: "signup_strengths_other_placeholder", widget: "string", required: false },
            { label: "Updates Only Checkbox Label", name: "signup_updates_only_label", widget: "string" },
            { label: "Signup Topics Label", name: "signup_impact_focus_label", widget: "text" },
            { label: "Topics Textarea Placeholder", name: "signup_impact_focus_placeholder", widget: "string" },
            { label: "Signup Button Text", name: "signup_button_text", widget: "string" },
          ],
        },
      ],
    },
    // Pages
    {
      name: "about-us",
      label: "About us",
      folder: "src/content/aboutUs",
      create: false,
      extension: "mdx",
      format: 'frontmatter',
      frontmatter_format: 'yaml',
      fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "History Title", name: "history_title", widget: "string", required: false },
        { label: "History Content", name: "history_content", widget: "markdown", required: false },
        { label: "Who We Are Title", name: "who_we_are_title", widget: "string", required: false },
        { label: "Who We Are Content", name: "who_we_are_content", widget: "markdown", required: false },
      ]
    },
    {
      name: "impact-page",
      label: "Community impact",
      folder: "src/content/pages",
      create: false,
      extension: "mdx",
      format: 'frontmatter',
      frontmatter_format: 'yaml',
      fields: [
        { label: "Main Title", name: "title", widget: "string" },
        { label: "Subtitle", name: "subtitle", widget: "string", required: false },
        { label: "Achievements Title", name: "achievements_title", widget: "string", required: false },
        {
          label: "Impact Projects",
          name: "achievements",
          widget: "list",
          fields: [
            { label: "Title", name: "title", widget: "string" },
            { label: "Description", name: "description", widget: "text", required: false },
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
      label: "Research",
      folder: "src/content/research",
      create: false, // Singleton-ish for now, or just one file
      extension: "mdx",
      format: 'frontmatter',
      frontmatter_format: 'yaml',
      fields: [
        { label: "Page Title", name: "title", widget: "string" },
        { label: "Page Description", name: "description", widget: "markdown", required: false },
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
      label: "Homepage",
      files: [
        {
          file: "src/content/homepage/home.json",
          label: "Homepage",
          name: "home",
          fields: [
            { label: "Hero Title", name: "hero_title", widget: "string" },
            { label: "Hero Subtitle", name: "hero_subtitle", widget: "text", required: false },
            { label: "Hero Button Text", name: "hero_button_text", widget: "string" },
            { label: "Mission Title", name: "mission_title", widget: "string", required: false },
            { label: "Mission Subtitle", name: "mission_subtitle", widget: "text", required: false },
            {
              label: "Mission Items",
              name: "mission_items",
              widget: "list",
              fields: [
                { label: "Title", name: "title", widget: "string", required: false },
                { label: "Text", name: "text", widget: "text", required: false },
                { label: "Icon", name: "icon", widget: "image", required: false, media_library: { config: { multiple: false, accept: "image/svg+xml,image/png,image/gif" } } }
              ]
            },
            { label: "Events Title", name: "events_title", widget: "string", required: false },
            { label: "Events Subtitle", name: "events_subtitle", widget: "text", required: false },
            { label: "Events Section Title", name: "events_section_title", widget: "string", required: false },
            { label: "Contact Title", name: "contact_title", widget: "string", required: false },
            { label: "Contact Subtitle", name: "contact_subtitle", widget: "text", required: false },
            { label: "Contact Email", name: "contact_email", widget: "string" }
          ]
        }
      ]
    },
    // Content
    {
      name: "events",
      label: "Events",
      summary: "{{title}} · {{eventDate | date('ddd MMM D, YYYY')}}",
      sortable_fields: [
        { field: "eventDate", label: "Event date", default_sort: "desc" },
        { field: "title", label: "Title" },
      ],
      folder: "src/content/events",
      create: true,
      slug: "{{year}}-{{month}}-{{day}}-{{slug}}",
      extension: "mdx",
      format: "frontmatter",
      frontmatter_format: 'yaml',
      fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "Event Card Description", name: "cardDescription", widget: "text", required: false },
        { label: "Event Page Description", name: "description", widget: "markdown", required: false },
        { label: "Event Date", name: "eventDate", widget: "datetime" },
        { label: "Date Override", name: "dateOverride", widget: "string", required: false, hint: "e.g., 'Various Dates'. If used, this text will be displayed instead of the event date." },
        { label: "Location", name: "location", widget: "string", required: false },
        { label: "Image", name: "image", widget: "image", required: false },
        { label: "External URL", name: "externalUrl", widget: "string", required: false, pattern: ["^https?://", "Must be a valid URL (e.g., https://example.com)"] },
      ]
    },
    {
      name: "get-involved",
      label: "Get involved",
      summary: "{{title}}",
      folder: "src/content/get-involved",
      create: true,
      slug: "{{slug}}",
      format: "frontmatter",
      frontmatter_format: 'yaml',
      fields: [
        { label: "Title", name: "title", widget: "string" }
      ]
    },
    {
      name: "leaders",
      label: "Leadership",
      summary: "{{name}} — {{title}}",
      sortable_fields: [
        { field: "order", label: "Display order", default_sort: "asc" },
        { field: "name", label: "Name" },
      ],
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
      label: "News posts",
      summary: "{{title}} · {{pubDate | date('MMM D, YYYY')}} · {{author | default('no author')}}",
      sortable_fields: [
        { field: "pubDate", label: "Publish date", default_sort: "desc" },
        { field: "title", label: "Title" },
        { field: "author", label: "Author" },
      ],
      folder: "src/content/news",
      create: true,
      slug: "{{year}}-{{month}}-{{day}}-{{slug}}",
      extension: "mdx",
      format: "frontmatter",
      frontmatter_format: 'yaml',
      fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "Description", name: "description", widget: "text", required: false },
        { label: "Author", name: "author", widget: "string" },
        { label: "Publish Date", name: "pubDate", widget: "datetime" },
        { label: "Featured Image", name: "image", widget: "image", required: false },
        { label: "Body", name: "body", widget: "markdown", required: false }
      ]
    },
    {
      name: "projects",
      label: "Projects",
      summary: "{{title}}",
      sortable_fields: [{ field: "title", label: "Title", default_sort: "asc" }],
      folder: "src/content/projects",
      create: true,
      slug: "{{slug}}",
      extension: "mdx",
      format: "frontmatter",
      frontmatter_format: 'yaml',
      fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "Goal", name: "goal", widget: "markdown", required: false },
        { label: "Description", name: "description", widget: "markdown", required: false },
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
      label: "Transparency",
      summary: "{{title}} · {{pubDate | date('MMM D, YYYY')}}",
      sortable_fields: [
        { field: "pubDate", label: "Publish date", default_sort: "desc" },
        { field: "title", label: "Title" },
      ],
      folder: "src/content/transparency",
      create: true,
      slug: "{{slug}}",
      extension: "md",
      format: "frontmatter",
      frontmatter_format: 'yaml',
      fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "Subtitle", name: "subtitle", widget: "text", required: false },
        { label: "Document Link", name: "link", widget: "string", pattern: ["^https?://", "Must be a valid URL (e.g., https://example.com)"] },
        { label: "Publish Date", name: "pubDate", widget: "datetime" }
      ]
    },
    // Site Settings
    {
      name: "settings",
      label: "Global settings",
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