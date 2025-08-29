High level:
* Admin changes for content editing
* Make sure that it renders on mobile ok
* Form setup to send in right way (database friendly)
* Remember that admin stuff can wait for day 1 (but would be nice)
* icon attribution
 
prompt 3

Admin Panel Changes:
SO MANY CHANGES NEEDED

In the CMS configuration for the "events" collection, please add a new optional text field labeled "External Link." When an admin fills in this field with a URL, the event card on the website should link directly to it. If the field is left empty, the card should link to the event's detail page on our site as it currently does.

Website Changes:
Update the event card components (on the homepage and any event listing pages). Implement conditional logic so that:

If the "External Link" field contains a URL, the entire card becomes a link (<a> tag) pointing to that external URL. This link should open in a new browser tab.

If the "External Link" field is empty, the card should link to the internal event detail page (e.g., /events/[slug]).

