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
          file: "src/content/pages/about-us.mdx",
          label: "About Us Page",
          name: "about",
          fields: [
            { label: "Title", name: "title", widget: "string" },
            { label: "Body", name: "body", widget: "markdown" }
          ]
        }
      ]
    },
    // Add your other collections (events, news) here if needed
  ]
};