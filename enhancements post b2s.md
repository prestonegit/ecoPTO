


prompt 10:
Enhance the "Join Us" Popup with Dynamic Opportunities
Objective:
Upgrade the "Join Us" popup form so that when a user indicates they want to be more involved, they are immediately shown the specific ways they can help and can optionally choose one of the opportunities


Admin Panel Changes:
This feature will reuse the "Volunteer Opportunities" list we created in the prompt above, so no additional CMS changes are neede

Website Changes:
Modify the "Join Us" popup/modal component:

Ensure it has a checkbox with the label "I'd like to play a more active role."

Add an event listener to this checkbox using client-side JavaScript.

By default, a new section containing volunteer roles should be hidden.

When a user checks the box, the hidden section should smoothly appear.

This new section should display the list of current volunteer opportunities (fetched from the CMS) as a series of checkboxes, allowing the user to select the areas they're interested in.

Update the form submission logic to include the user's selections for these volunteer roles.

Design Notes: The appearance of the new section should be smooth (e.g., a fade-in or slide-down animation). The form should remain clean and easy to navigate, even with the additional options.


nothing below here: 
prompt 3

Admin Panel Changes:
SO MANY CHANGES NEEDED



In the CMS configuration for the "events" collection, please add a new optional text field labeled "External Link." When an admin fills in this field with a URL, the event card on the website should link directly to it. If the field is left empty, the card should link to the event's detail page on our site as it currently does.

Website Changes:
Update the event card components (on the homepage and any event listing pages). Implement conditional logic so that:

If the "External Link" field contains a URL, the entire card becomes a link (<a> tag) pointing to that external URL. This link should open in a new browser tab.

If the "External Link" field is empty, the card should link to the internal event detail page (e.g., /events/[slug]).

prompt 7
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
