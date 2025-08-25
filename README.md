# HVRSD ecoPTO Website

This website is built with Astro, Tailwind CSS, and Decap CMS to be fast, secure, and easy for volunteers to update.

## Prerequisites

-   Node.js (version 18 or higher)
-   A GitHub account
-   A Netlify account

## 🚀 Project Setup & Local Development

1.  **Install Dependencies:** Open your terminal, navigate to the project folder, and run:
    ```bash
    npm install
    ```

2.  **Run the Website:** To start the live development server for the website, run:
    ```bash
    npm run dev
    ```
    You can now view your site at `http://localhost:4321`. Changes to your code will update live in the browser.

3.  **Run the Admin Panel:** The Decap CMS Admin Panel needs a local proxy to work during development. Open a **second, separate terminal window** and run:
    ```bash
    npx decap-server
    ```
    Now you can access the admin panel at `http://localhost:4321/admin/`. You can log in, create and edit content, and see the changes reflected on your local website after a page refresh.

## 🚀 Deployment to Netlify (To Go Live!)

Deploying this site is free and handles the admin panel authentication automatically.

1.  **Push to GitHub:** Create a new repository on GitHub and push this entire project to it.

2.  **Create a New Site on Netlify:**
    -   Log in to your Netlify account.
    -   Click "Add new site" -> "Import an existing project".
    -   Connect to GitHub and select your new repository.

3.  **Configure Build Settings:** Netlify will auto-detect that it's an Astro site. The default settings should be correct:
    -   **Build command:** `npm run build`
    -   **Publish directory:** `dist`

4.  **Enable Identity & Git Gateway:** This is the magic step that lets your volunteers log in to the admin panel.
    -   In your new Netlify site's dashboard, go to the **`Identity`** tab and click **`Enable Identity`**.
    -   Scroll down to **`Registration`** and set it to **`Invite only`**. This is important for security.
    -   Now, go to the **`Site configuration > Git Gateway`** tab.
    -   Click **`Enable Git Gateway`**.

5.  **Invite Your Volunteers:**
    -   Go back to the **`Identity`** tab.
    -   Click **`Invite users`** to send email invitations to the ecoPTO members who will be updating the site. Once they accept and set a password, they will be able to log in at `your-new-site-url.netlify.app/admin/`.

You now have a fully functional, easy-to-update website for your ecoPTO!