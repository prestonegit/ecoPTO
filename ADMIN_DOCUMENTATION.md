
# Admin Panel Documentation

This document outlines the structure and capabilities of the admin panel for the ecoPTO website.

## Accessing the Admin Panel

To access the admin panel, navigate to `/admin` in your browser. For example, if you are running the site locally, you would go to `http://localhost:4321/admin`.

## Capabilities

The admin panel is built using Decap CMS. The configuration for the admin panel is located in `src/cms/config.js`.

### Style Changes

You can make basic style changes to the website through the admin panel:

1.  Navigate to **Site Settings** in the admin panel.
2.  Here you can change the **Color Theme** of the website. The available options are:
    *   Official District Colors (Maroon & Gold)
    *   Alternate District Colors (Blue & Gold)
    *   Seasonal - Summer
    *   Seasonal - Fall

### Content Editing

You can edit the content of various pages on the website.

#### Events Pages

1.  Navigate to the **Events** collection in the admin panel.
2.  Here you will see a list of all the existing events.
3.  Click on an event to edit its content.
4.  You can also create new events by clicking the "New Event" button.
5.  The content is written in Markdown.

#### Impact Page

1.  Navigate to the **Pages** collection in the admin panel.
2.  Select the **Community Impact Page**.
3.  Here you can edit the following fields:
    *   Main Title
    *   Subtitle
    *   Achievements Title
    *   A list of Achievements, each with a title and description.

### Image Uploading

## Next Steps for Production

Here are the suggested next steps to get the website ready for production:

### 1. "Join Us" Page Layout

The "Join Us" page should be made editable through the admin panel. This involves:

1.  Creating a new entry in the `collections` array in `src/cms/config.js` for the "Join Us" page.
2.  Defining the fields that should be editable (e.g., title, description, form fields).

### 2. "Join Us" Form Submission

The signup form on the "Join Us" page needs a backend to handle submissions. Here are a few options:

*   **Netlify Forms:** If you deploy the site to Netlify, you can use their built-in form handling.
*   **Vercel Serverless Functions:** If you deploy to Vercel, you can create a serverless function to process the form data.
*   **Third-party services:** You can use services like Formspree or Airtable to handle form submissions.

### 3. Image Uploads for "About Us" Page

To allow image uploads for the "About Us" page through the admin panel, you need to:

1.  Add `widget: 'image'` fields to the "About Us" page definition in `src/cms/config.js`.
2.  Update the `src/pages/about.astro` file to render the images.

### 4. Review and Finalize Content

Before launching the site, it's important to:

*   Proofread all content for typos and grammatical errors.
*   Ensure all links are working correctly.
*   Verify that all images are displaying properly.

### 5. Deployment

Once the site is ready, you can deploy it to a hosting provider. Some popular options for Astro sites are:

*   **Netlify:** Offers seamless integration with Git and has great support for Astro and Decap CMS.
*   **Vercel:** Another excellent option for deploying Astro sites, with a focus on performance.



#### About Us Page

To upload and change images on the "About Us" page, you will need to edit the `src/content/pages/about-us.md` file directly. The admin panel does not currently support image uploads for this page.

#### Impact Page

1.  Navigate to the **Pages** collection in the admin panel.
2.  Select the **Community Impact Page**.
3.  Here you can upload images for the following fields:
    *   Image 1 (Top-Left)
    *   Image 2 (Top-Right)
    *   Image 3 (Bottom-Left)
    *   Image 4 (Bottom-Right)
