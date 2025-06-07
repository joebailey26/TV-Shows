<template>
  <main class="inner-content">
    <h1>Privacy Policy</h1>

    <p>
      This policy explains how information is collected and used when you use the
      <strong>TV Shows</strong> application ("the App"). The App is a personal project created
      by <a href="https://joebailey.xyz" target="_blank">Joe Bailey</a> that lets you track
      television shows and optionally sync upcoming episodes to a calendar.
    </p>

    <h2>Information We Collect</h2>

    <h3>Account Information</h3>
    <ul>
      <li>When you sign in with Google or GitHub, we store your name, email address and profile image.</li>
      <li>We create an internal user identifier to link your account data.</li>
    </ul>

    <h3>TV Show Data</h3>
    <ul>
      <li>When you add a show, episode information is fetched from Episodate and stored in our database so it can be displayed quickly.</li>
      <li>We record which episodes you mark as watched.</li>
    </ul>

    <h3>Calendar Data</h3>
    <ul>
      <li>If you sign in with a Google account, we create a new calendar on Google Calendar and store your calendar ID, access token and refresh token so we can add or remove events on your behalf.</li>
      <li>We can also generate an ICS feed for your shows. Anyone with the link (which contains your email address) can access your feed.</li>
    </ul>

    <h3>Logs and Analytics</h3>
    <ul>
      <li>Basic logs about requests are kept for troubleshooting. No analytics or advertising trackers are used.</li>
    </ul>

    <h2>How We Use the Information</h2>
    <ul>
      <li>To authenticate you and allow you to log in.</li>
      <li>To keep track of the shows you follow and the episodes you have watched.</li>
      <li>To sync episode dates to your Google Calendar or to generate an ICS file.</li>
      <li>To send verification emails when you sign in.</li>
    </ul>

    <h2>Sharing of Information</h2>
    <ul>
      <li>We use third‑party services to operate the App:
        <ul>
          <li><strong>Episodate</strong> – to retrieve show and episode details.</li>
          <li><strong>Google</strong> and <strong>GitHub</strong> – for optional sign‑in.</li>
          <li><strong>Mailgun</strong> – to send authentication emails.</li>
          <li><strong>Cloudflare D1</strong> – to store the App's data.</li>
        </ul>
      </li>
      <li>These providers only receive the information necessary to perform their functions.</li>
      <li>We do not sell or share your information with advertisers.</li>
    </ul>

    <h2>Data Retention</h2>
    <ul>
      <li>Your data is kept while your account remains active or as needed to provide the service.</li>
      <li>You may request deletion of your account and related data at any time.</li>
    </ul>

    <h2>Your Rights</h2>
    <ul>
      <li>You can request a copy of your data or ask us to delete it by contacting us.</li>
    </ul>

    <h2>Contact</h2>
    <p>If you have questions about this policy or about your personal data, please email <strong>joe@joebailey.xyz</strong>.</p>

    <h2>Changes to This Policy</h2>
    <p>We may update this Privacy Policy from time to time. The latest version will always be available in the project repository.</p>
  </main>
</template>
