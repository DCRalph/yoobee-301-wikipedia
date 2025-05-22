import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";
import slugify from "slugify";

const prisma = new PrismaClient();

// Define article categories
const categories = [
  { name: "Arts & Culture", slug: "arts-culture", description: "Explore arts and cultural topics" },
  { name: "Literature", slug: "literature", description: "Books, poems, and literary analysis" },
  { name: "History", slug: "history", description: "Historical events and figures" },
  { name: "Science", slug: "science", description: "Scientific discoveries and concepts" },
  { name: "Technology", slug: "technology", description: "Technology innovations and developments" },
  { name: "Geography", slug: "geography", description: "Places, maps and geographical features" },
  { name: "Mathematics", slug: "mathematics", description: "Mathematical concepts and theories" },
  { name: "Philosophy", slug: "philosophy", description: "Philosophical ideas and thinkers" },
  { name: "Religion", slug: "religion", description: "Religious practices and beliefs" },
  { name: "Society", slug: "society", description: "Social issues and human interactions" }
];

// Function to generate 1000 words of random content
function generateArticleContent(): string {
  let content = "";

  // Generate a random number of paragraphs (5-10)
  const paragraphCount = faker.number.int({ min: 5, max: 10 });

  for (let i = 0; i < paragraphCount; i++) {
    // Add heading for some paragraphs
    if (i > 0 && faker.number.int({ min: 1, max: 3 }) === 1) {
      content += `\n## ${faker.lorem.sentence({ min: 3, max: 3 })}\n\n`;
    }

    // Generate a paragraph with multiple sentences
    const sentenceCount = faker.number.int({ min: 6, max: 12 });
    content += faker.lorem.paragraph(sentenceCount) + "\n\n";
  }

  // Ensure we have at least 1000 words
  const wordCount = content.split(/\s+/).length;
  if (wordCount < 1000) {
    const additionalParagraphs = Math.ceil((1000 - wordCount) / 100);
    for (let i = 0; i < additionalParagraphs; i++) {
      content += faker.lorem.paragraph(10) + "\n\n";
    }
  }

  return content;
}

// Function to generate random quick facts
function generateQuickFacts(): Record<string, string> {
  const factCount = faker.number.int({ min: 3, max: 7 });
  const facts: Record<string, string> = {};

  for (let i = 0; i < factCount; i++) {
    const factKey = faker.word.sample();
    facts[factKey] = faker.lorem.sentence();
  }

  return facts;
}

async function main() {
  console.log("Starting seed process...");

  // Create a site settings record if one doesn't exist
  const settingsCount = await prisma.setting.count();
  if (settingsCount === 0) {
    await prisma.setting.create({
      data: {
        allowRegistration: true,
        allowArticleCreation: true,
        enableAIFeatures: false,
      },
    });
    console.log("Created default site settings");
  }

  // Create admin user if it doesn't exist
  const adminEmail = "admin@example.com";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  let adminId: string;
  if (!existingAdmin) {
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: adminEmail,
        role: Role.ADMIN,
      },
    });
    adminId = admin.id;

    // Add password-based account for admin
    const hashedPassword = await bcrypt.hash("Password123", 10);
    await prisma.account.create({
      data: {
        userId: admin.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: adminEmail,
        password: hashedPassword,
      },
    });

    console.log(`Created admin user with email ${adminEmail}`);
  } else {
    adminId = existingAdmin.id;
  }

  // Create regular user if it doesn't exist
  const userEmail = "user@example.com";
  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  let userId: string;
  if (!existingUser) {
    // Create regular user
    const user = await prisma.user.create({
      data: {
        name: "Regular User",
        email: userEmail,
        role: Role.USER,
      },
    });
    userId = user.id;

    // Add password-based account for user
    const hashedPassword = await bcrypt.hash("Password123", 10);
    await prisma.account.create({
      data: {
        userId: user.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: userEmail,
        password: hashedPassword,
      },
    });

    console.log(`Created regular user with email ${userEmail}`);
  } else {
    userId = existingUser.id;
  }

  // Create moderator if it doesn't exist
  const modEmail = "moderator@example.com";
  const existingMod = await prisma.user.findUnique({
    where: { email: modEmail },
  });

  let modId: string;
  if (!existingMod) {
    // Create moderator user
    const mod = await prisma.user.create({
      data: {
        name: "Moderator User",
        email: modEmail,
        role: Role.MODERATOR,
      },
    });
    modId = mod.id;

    // Add password-based account for moderator
    const hashedPassword = await bcrypt.hash("Password123", 10);
    await prisma.account.create({
      data: {
        userId: mod.id,
        type: "credentials",
        provider: "credentials",
        providerAccountId: modEmail,
        password: hashedPassword,
      },
    });

    console.log(`Created moderator user with email ${modEmail}`);
  } else {
    modId = existingMod.id;
  }

  // Create categories if they don't exist
  const existingCategoriesCount = await prisma.category.count();
  if (existingCategoriesCount === 0) {
    for (const category of categories) {
      await prisma.category.create({
        data: category
      });
    }
    console.log(`Created ${categories.length} categories`);
  }

  // Get all categories
  const dbCategories = await prisma.category.findMany();

  // Create 25 articles if they don't exist yet
  const existingArticlesCount = await prisma.article.count();
  if (existingArticlesCount < 25) {
    console.log("Generating 25 articles with 1000 words each...");

    const articlesToCreate = 25 - existingArticlesCount;
    const authors = [adminId, userId, modId];

    for (let i = 0; i < articlesToCreate; i++) {
      const title = faker.lorem.sentence({ min: 3, max: 8 });
      const slug = slugify(title, { lower: true, strict: true });

      // Select a random author
      const authorIndex = faker.number.int({ min: 0, max: 2 });
      const authorId = authors[authorIndex] ?? adminId; // Fallback to adminId if undefined

      // Generate article content
      const content = generateArticleContent();

      // Select random publish status
      const published = faker.datatype.boolean({ probability: 0.8 }); // 80% chance of being published

      // Determine if the article needs approval
      const needsApproval = !published || faker.datatype.boolean({ probability: 0.3 }); // All unpublished + 30% of published

      // Determine if the article is approved
      const approved = published && !needsApproval;

      // Set approval details if approved
      const approvedAt = approved ? faker.date.recent({ days: 30 }) : null;
      const approvedBy = approved ? modId : null;

      // Generate view count
      const viewCount = faker.number.int({ min: 0, max: 10000 });
      const dailyViews = faker.number.int({ min: 0, max: 500 });

      // Determine if the article is featured
      const isFeatured = faker.datatype.boolean({ probability: 0.2 }); // 20% chance of being featured
      const featuredAt = isFeatured ? faker.date.recent({ days: 14 }) : null;
      const featuredDescription = isFeatured ? faker.lorem.paragraph(2) : null;

      // Generate quick facts, sources, and talk content
      const quickFacts = generateQuickFacts();
      const sources = faker.internet.url() + "\n" + faker.internet.url() + "\n" + faker.internet.url();
      const talkContent = faker.datatype.boolean({ probability: 0.4 }) ? faker.lorem.paragraphs(2) : "";

      // Select a random image URL
      const imageUrl = faker.datatype.boolean({ probability: 0.7 })
        ? `https://picsum.photos/seed/${slug}/800/600`
        : null;

      // Create the article
      const article = await prisma.article.create({
        data: {
          title,
          slug,
          content,
          published,
          needsApproval,
          approved,
          approvedAt,
          approvedBy,
          authorId,
          imageUrl,
          isFeatured,
          featuredAt,
          featuredDescription,
          viewCount,
          dailyViews,
          lastViewReset: faker.date.recent({ days: 1 }),
          quickFacts,
          sources,
          talkContent,
          createdAt: faker.date.past({ years: 1 }),
          updatedAt: faker.date.recent({ days: 30 }),
        },
      });

      // Assign 1-3 random categories to the article
      const categoryCount = faker.number.int({ min: 1, max: 3 });
      const selectedCategories = faker.helpers.arrayElements(dbCategories, categoryCount);

      for (const category of selectedCategories) {
        await prisma.categoriesOnArticles.create({
          data: {
            articleId: article.id,
            categoryId: category.id,
            assignedAt: faker.date.recent({ days: 30 }),
          },
        });
      }

      console.log(`Created article: ${title}`);
    }
  }

  console.log("Seed process completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
