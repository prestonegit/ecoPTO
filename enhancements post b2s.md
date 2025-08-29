
prompt 8
For the Meeting Notes Section
Objective: Add a "Meeting Notes" section for transparency, allowing admins to easily post links to documents like meeting minutes stored in Google Drive.

Admin Panel Changes:
In the CMS configuration for the page where this section will appear (likely the homepage or a "Resources" page), add a new list widget field labeled "Meeting Notes & Documents."

The list should be repeatable, allowing an admin to add as many documents as needed.

Each item in the list should have two text fields:

Title: The display text for the link (e.g., "September 2025 Meeting Minutes").

URL: The full link to the Google Drive document or other external file.

Website Changes:
Create a new component and section on the desired page that fetches and displays the list of meeting notes. It should render each item as a clean, clearly labeled link. The design should feel professional and organized, perhaps with a small document icon next to each link. Each link should open in a new browser tab.

New prompt: Authentication for admin.. 

For the News/Blog Section
Objective: Create a new blog-style "News" section where PTO members can share stories, updates, and longer-form posts.

Admin Panel Changes:
Please create a new folder collection in the CMS named "News." Each post in this collection should have the following fields:

Title: A required text field for the post's headline.

Publication Date: A required date field.

Author: A text field for the author's name.

Featured Image: An optional image upload field.

Body: A required Markdown widget to allow for rich text formatting, headings, links, and longer content.

Website Changes:

Create a main news listing page at the /news route. This page should display all news posts in a clean grid or list. Each entry should show its featured image, title, author, and publication date, linking to the full post.

Create a dynamic page template for individual news posts (e.g., /news/[slug]). This page should display the full content from the "Body" field in a clean, readable, single-column layout suitable for articles. Use styling that enhances readability for longer text.

Design Notes: The overall style should be consistent with the rest of the site but optimized for reading, with clear typography and generous whitespace.


