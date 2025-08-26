// src/cms/config.js

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
      label: "Site Settings",
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
                { label: "Official District Colors (Maroon & Gold)", value: "theme-district-maroon" },
                { label: "Alternate District Colors (Blue & Gold)", value: "theme-district-blue" },
                { label: "Seasonal - Summer", value: "theme-summer" },
                { label: "Seasonal - Fall", value: "theme-fall" }
              ],
              default: "theme-district-maroon"
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
          file: "src/content/pages/about-us.md", // <-- This was about-us.mdx, should be .md
          label: "About Us Page",
          name: "about",
          fields: [
            { label: "Title", name: "title", widget: "string" },
            { label: "Body", name: "body", widget: "markdown" }
          ]
        },
        // THIS IS THE CORRECTED PLACEMENT FOR THE IMPACT PAGE
        {
          file: "src/content/pages/community-impact.md",
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
                { label: "Description", name: "description", widget: "text" }
              ]
            },
            // Added the image fields back in
            { label: "Image 1 (Top-Left)", name: "image1", widget: "image" },
            { label: "Image 2 (Top-Right)", name: "image2", widget: "image" },
            { label: "Image 3 (Bottom-Left)", name: "image3", widget: "image" },
            { label: "Image 4 (Bottom-Right)", name: "image4", widget: "image" }
          ]
        }
      ]
    },
    // your other collections (events, news) would go here
  ]
};