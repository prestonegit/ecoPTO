export const config = {
  backend: {
    name: 'git-gateway',
    branch: 'main',
  },
  media_folder: "public/assets/images",
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
            }
          ]
        }
      ]
    },
    {
      name: "pages",
      label: "Pages",
      files: [
        {
          file: "src/content/homepage/home.json",
          label: "Homepage",
          name: "home",
          fields: [
            { label: "Hero Title", name: "hero_title", widget: "string" },
            { label: "Hero Subtitle", name: "hero_subtitle", widget: "text" },
            // ... other homepage fields ...
          ]
        }
        // IMPACT PAGE HAS BEEN REMOVED FROM HERE
      ]
    },
    {
      name: "about-us",
      label: "About Us Page",
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
    // NEW COLLECTION FOR IMPACT PAGE
    {
      name: "impact-page",
      label: "Community Impact Page",
      folder: "src/content/pages", // Points to the folder where impact.mdx lives
      create: false,
      extension: "mdx",
      format: 'frontmatter',
      frontmatter_format: 'yaml',
      // This tells the CMS to only show files that match this name
      filter: {field: "slug", value: "impact"},
      fields: [
        { label: "Main Title", name: "title", widget: "string" },
        { label: "Subtitle", name: "subtitle", widget: "string" },
        { label: "Achievements Title", name: "achievements_title", widget: "string" },
        {
          label: "Achievements List",
          name: "achievements",
          widget: "list",
          fields: [
            { label: "Title", name: "title", widget: "string" },
            { label: "Description", name: "description", widget: "text" },
            { label: "Icon", name: "icon", widget: "image", required: false },
            { label: "Image", name: "image", widget: "image", required: false }
          ]
        },
        { label: "Image 1 (Top-Left)", name: "image1", widget: "image" },
        { label: "Image 2 (Top-Right)", name: "image2", widget: "image" },
        { label: "Image 3 (Bottom-Left)", name: "image3", widget: "image" },
        { label: "Image 4 (Bottom-Right)", name: "image4", widget: "image" }
      ]
    },
    {
      name: "leaders",
      label: "Leaders",
      folder: "src/content/leadership",
      create: true,
      extension: "mdx",
      format: "frontmatter",
      frontmatter_format: 'yaml',
      fields: [
        { label: "Name", name: "name", widget: "string" },
        // ... other leader fields ...
      ]
    },
    // ... all your other collections ...
  ]
};