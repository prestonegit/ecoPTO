# Implementation Plan: Interactive Projects Page

This document outlines the plan for creating a new, interactive "Projects" page to visualize the ecoPTO's sociocratic circles. The goal is to create a dynamic and engaging experience that allows users to explore the various projects and their connections.

## 1. Project Overview

The "Projects" page will feature a force-directed graph visualization of all active projects, represented as circles. A central circle will represent the ecoPTO itself, with all other project circles linked to it. The visualization will be interactive, with the following key features:

*   **Hover Effects:** Circles will grow in size when hovered over.
*   **Connections:** Lines will be drawn between related projects to show their connections.
*   **Scalability:** The visualization will be designed to handle a large number of projects (e.g., 300+).
*   **Search:** A search functionality will allow users to find specific projects.
*   **CMS Integration:** All project data will be editable through the Decap CMS.

## 2. Technology Choices

To create the interactive visualization, I will use the following technologies:

*   **D3.js:** This is the most powerful and flexible JavaScript library for creating data-driven visualizations. It provides the necessary tools to build a custom force-directed graph with the required interactivity and styling.
*   **React:** I will use a React component to encapsulate the D3.js logic. This will make it easier to manage the state of the visualization and integrate it into the Astro page.
*   **Astro:** The page itself will be an Astro page, which will handle the data fetching and overall page structure.
*   **Tailwind CSS:** For styling the page, search input, and other UI elements.

## 3. Data Model & CMS Configuration

I will create a new "Projects" collection in the `src/cms/config.js` file. This collection will have the following fields:

*   `title`: The name of the project/circle (e.g., "Garden Club").
*   `goal`: A description of the project's goals.
*   `participants`: A list of participants, each with a `name` and `contact` field.
*   `related_projects`: A multi-select field that allows editors to link a project to other existing projects.

This structure will provide the necessary data to power the visualization and the search functionality.

## 4. Step-by-Step Frontend Implementation

I will follow these steps to build the frontend:

1.  **Create the CMS Collection:** I will first update the `src/cms/config.js` file to add the new "Projects" collection.

2.  **Create the Astro Page:** I will create a new `src/pages/projects.astro` file. This page will fetch the project data from the new collection.

3.  **Develop the React Visualization Component:**
    *   I will create a new React component at `src/components/ProjectsVisualization.jsx`.
    *   This component will take the project data as a prop.
    *   Inside this component, I will use D3.js to:
        *   Create a force simulation to position the circles.
        *   Render the circles for each project and the central "ecoPTO" circle.
        *   Implement the hover effect to grow the circles.
        *   Draw lines between connected projects based on the `related_projects` field.

4.  **Implement Search:**
    *   I will add a search input field to the `projects.astro` page.
    *   I will add client-side JavaScript to filter the circles in the visualization based on the search query. The search will match against the project `title` and `goal`.

5.  **Styling:** I will use Tailwind CSS to style the page, the search input, and the project details displayed on hover or click.

## 5. Pre-population

I will pre-populate the system with 5 sample projects to demonstrate the UI/UX of the visualization. This will allow us to test the interactivity and the overall look and feel of the page before adding a large number of real projects.

## 6. Hiding the Page

The page will be accessible at the `/projects` URL, but I will not add a link to it in the main navigation. This will keep the page hidden from general users until it is ready to be officially launched.

By following this plan, I will be able to deliver a robust and engaging "Projects" page that meets all the requirements. I will start by implementing the CMS changes and creating the basic page structure. Then, I will move on to the more complex visualization and search functionality.