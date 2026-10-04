PHOTOS FOR CARDS AND PAGE HEADERS
=================================
1. Copy photos into THIS folder (JPEG, PNG, WebP or AVIF, any size).
2. RENAME each photo after the place it should appear (keep the extension).
3. In the terminal, from the project folder, run:   npm run images
4. Restart:   npm run dev

Places that are left without a photo simply stay plain. Nothing breaks.

PAGE HEADERS (faint photo behind the page title; wide photos work best)
  page-workshops.jpg
  page-about.jpg
  page-resources.jpg
  page-feedback.jpg
  page-calendar.jpg

HOMEPAGE CARDS (the three cards under the banner)
  card-workshops.jpg
  card-chat.jpg
  card-support.jpg

PROGRAMME CARDS (also shown next to matching workshops)
  programme-teacher-wellness.jpg
  programme-school-wellbeing-workshops.jpg
  programme-leadership-wellbeing.jpg
  programme-professional-learning-communities.jpg
  programme-research-and-evaluation.jpg

ABOUT PAGE (a wide photo under the introduction)
  about-story.jpg

Tips
- Photos are cropped to a 3:2 landscape shape, keeping the most interesting part.
- Use photos ESWA owns or may use. For real children, keep a permission on file.
- To change a photo: replace the file in this folder and run  npm run images  again.
- To remove one: delete it from this folder and run  npm run images  again.
- The photo for the main banner on the homepage goes in  hero-source/  instead.
