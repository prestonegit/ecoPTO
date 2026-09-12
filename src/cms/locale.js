import { en } from 'decap-cms-locales';

// Decap's editor toolbar is written for developers: "Publish", "Publish now", "Unsaved
// Changes". To a volunteer writing a newsletter, "Publish" sounds like it mails the thing
// to everyone — which is exactly the wrong instinct, since sending is a separate, gated
// step in the Send control.
//
// What the button actually does is commit the file, which then rebuilds the site. So the
// honest plain-language verb is "save", with the site consequence spelled out in the menu
// rather than implied by a word non-technical users read as "broadcast".
//
// registerLocale('en', …) REPLACES the built-in English rather than merging into it, so
// this spreads the shipped strings first and overrides only the toolbar keys. Anything
// Decap adds in a future version keeps its default wording instead of going blank.
const overrides = {
  publish: 'Save',
  publishing: 'Saving…',
  published: 'Saved',
  publishNow: 'Save and update the website',
  publishAndCreateNew: 'Save and start a new one',
  publishAndDuplicate: 'Save and make a copy',
  unsavedChanges: 'Not saved yet',
  changesSaved: 'Saved',
  saving: 'Saving…',
  save: 'Save',
  deleteEntry: 'Delete this',
  backCollection: ' Editing %{collectionLabel}',
};

export const enPlain = {
  ...en,
  editor: {
    ...en.editor,
    editorToolbar: {
      ...en.editor?.editorToolbar,
      ...overrides,
    },
  },
};

export default enPlain;
