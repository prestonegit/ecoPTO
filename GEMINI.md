# GEMINI Analysis: ecoPTO Website

## Project Overview

This project is the official website for the Hopewell Valley Regional School District (HVRSD) ecoPTO. It's a modern, static website built with [Astro](https://astro.build/) for performance and [Tailwind CSS](https://tailwindcss.com/) for styling. The key feature is its content management system, [Decap CMS](https://decapcms.org/) (formerly Netlify CMS), which is configured to allow easy, no-code updates by volunteers.

The architecture is designed for simplicity, security, and maintainability, making it ideal for a volunteer-run organization. The site is composed of Astro components, MDX for rich content pages, and a few React components for specific interactive elements.

## Deployment & Infrastructure

This project is designed to be deployed on **Netlify's free tier**.

1.  **Continuous Deployment:** The site is deployed automatically when changes are pushed to the `main` branch of the connected GitHub repository.
2.  **CMS Authentication:** Netlify's free **Identity** service is used to manage logins for the CMS. This allows you to invite users to edit content without giving them access to the GitHub repository or the Netlify account.
3.  **Git Gateway:** Netlify's **Git Gateway** service is used to allow the CMS to write changes back to the GitHub repository on behalf of the logged-in user.

The deployment process is detailed in the `README.md` file.

## Content Management

A core goal of this project is to make **all website content easily editable by non-technical users** through the Decap CMS interface, which is accessible at the `/admin/` path on the live site.

The CMS is configured in `src/cms/config.js`. This file defines the "collections," which represent the different types of content that can be edited. The current collections are:

*   **Global Site Settings:** For sitewide details like the site name, favicon, and color theme.
*   **Pages:** For managing the content of the homepage and other static pages like the "Community Impact" page.
*   **Leaders:** To add, edit, and remove profiles of the ecoPTO leadership team.
*   **Events:** For creating and updating event information.
*   **Volunteer Opportunities:** To manage the list of ways people can get involved.
*   **News Posts:** For publishing news articles and updates.
*   **Transparency Documents:** To upload and display documents like meeting minutes or budgets.

All content is stored as Markdown, MDX, or JSON files in the `src/content/` directory, which keeps the content decoupled from the presentation layer and ensures version control through Git.

## Building and Running

### Prerequisites

*   Node.js (version 18 or higher)
*   A GitHub account
*   A Netlify account

### Key Commands

*   **Install Dependencies:**
    ```bash
    npm install
    ```

*   **Run the Website (Development):**
    ```bash
    npm run dev
    ```
    This starts the local development server at `http://localhost:4321`.

*   **Run the CMS (Development):**
    ```bash
    npm run cms
    ```
    This starts the local Decap CMS proxy server. The admin panel can then be accessed at `http://localhost:4321/admin/`.

*   **Build for Production:**
    ```bash
    npm run build
    ```
    This builds the static site to the `dist/` directory, ready for deployment.

## Development Conventions

*   **File-based Routing:** Astro uses a file-based routing system. Pages are created by adding `.astro` or `.mdx` files to the `src/pages/` directory.
*   **Component-based Architecture:** The UI is built with reusable Astro components located in `src/components/`.
*   **Content Collections API:** The website uses Astro's [Content Collections API](https://docs.astro.build/en/guides/content-collections/) to manage and query the content stored in `src/content/`. The schemas for these collections are defined in `src/content/config.ts`.