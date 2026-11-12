# Website
# Creating a website for Kamuela honwganji 
Wanting to have updates for announcements, being able to add pictures, etc. Work in progress... 

## Updating site content

Edit `content.js` and commit/push the change to `main`. The page loads that file
before `site.js`, which renders the temple schedules, locations, announcements,
special or cancelled services, and any photos listed in the configuration.
GitHub Pages publishes changes from this repository automatically; allow a
minute or two for the deployment to finish, then refresh the page.

For photos, add the image under `images/` and add its filename, caption, and
optional date to `SITE.photos` in `content.js`.
