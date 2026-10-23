import { menuItems, type MenuItem } from "@/lib/restaurant";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { menuItems as menuTable, ratings, users } from "@/lib/schema";
import Home from "@/components/home-page";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let items: MenuItem[] = menuItems;
  let publishedRatings: {
    id: string;
    stars: number;
    comment: string | null;
    user: { name: string };
  }[] = [];

  if (process.env.DATABASE_URL) {
    const db = getDb();
    const [databaseItems, databaseRatings] = await Promise.all([
      db.query.menuItems.findMany({
        orderBy: [desc(menuTable.featured), menuTable.name],
      }),
      db
        .select({
          id: ratings.id,
          stars: ratings.stars,
          comment: ratings.comment,
          name: users.name,
        })
        .from(ratings)
        .innerJoin(users, eq(ratings.userId, users.id))
        .where(and(eq(ratings.published, true), isNotNull(ratings.comment)))
        .orderBy(desc(ratings.createdAt))
        .limit(3),
    ]);

    items = databaseItems.map((item) => ({
      id: item.slug,
      name: item.name,
      category: item.category as MenuItem["category"],
      description: item.description,
      price: item.price,
      image: item.image,
      available: item.available,
      featured: item.featured,
    }));
    publishedRatings = databaseRatings.map((rating) => ({
      id: rating.id,
      stars: rating.stars,
      comment: rating.comment,
      user: { name: rating.name },
    }));
  }

  return <Home items={items} publishedRatings={publishedRatings} />;
}
