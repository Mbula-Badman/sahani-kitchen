import Link from "next/link";
import Image from "next/image";
import { count, desc, eq } from "drizzle-orm";
import {
  createEmployeeAction,
  createMenuItemAction,
  logoutAction,
  moderateRatingAction,
  placeOrderAction,
  promoteUserAction,
  submitRatingAction,
  updateAvailabilityAction,
  updateMenuItemAction,
  updateOrderStatusAction,
  updateProfileAction,
} from "@/app/auth-actions";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  menuItems as menuItemsTable,
  orderStatusValues,
  orders,
  ratings as ratingsTable,
  serviceTypeValues,
  UserRole,
  users,
} from "@/lib/schema";
import { menuCategories } from "@/lib/restaurant";

export const dynamic = "force-dynamic";

const currency = (value: number) =>
  `KSh ${new Intl.NumberFormat("en-KE").format(value)}`;

const statusLabel = (value: string) =>
  value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

async function loadOrders(userId?: string) {
  return getDb().query.orders.findMany({
    where: userId ? eq(orders.userId, userId) : undefined,
    with: {
      user: { columns: { name: true, email: true, phone: true } },
      items: true,
    },
    orderBy: desc(orders.createdAt),
    limit: userId ? 30 : 50,
  });
}

function DashboardHeader({
  name,
  role,
}: {
  name: string;
  role: UserRole;
}) {
  return (
    <header className="dashboard-header">
      <Link className="dashboard-brand" href="/">Sahani Kitchen</Link>
      <div className="dashboard-identity">
        <span>{name}</span>
        <b>{role}</b>
        <form action={logoutAction}>
          <button type="submit">Sign out</button>
        </form>
      </div>
    </header>
  );
}

function Notice({ message, error }: { message?: string; error?: string }) {
  if (error) return <p className="dashboard-notice dashboard-error" role="alert">{error}</p>;
  if (message) return <p className="dashboard-notice" role="status">{message}</p>;
  return null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string; dish?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  if (user.role === UserRole.ADMIN) {
    const db = getDb();
    const [orders, employees, menuItemList, ratingList, customerCount] = await Promise.all([
      loadOrders(),
      db.query.users.findMany({
        where: eq(users.role, UserRole.EMPLOYEE),
        columns: { id: true, name: true, email: true, createdAt: true },
        orderBy: desc(users.createdAt),
      }),
      db.query.menuItems.findMany({
        orderBy: [menuItemsTable.category, menuItemsTable.name],
      }),
      db.query.ratings.findMany({
        with: { user: { columns: { name: true, email: true } } },
        orderBy: desc(ratingsTable.createdAt),
        limit: 50,
      }),
      db.select({ total: count() }).from(users).where(eq(users.role, UserRole.CLIENT)),
    ]);

    return (
      <main className="dashboard-page">
        <DashboardHeader name={user.name} role={user.role} />
        <div className="dashboard-content">
          <div className="dashboard-title-row">
            <div>
              <span className="eyebrow">OWNER WORKSPACE</span>
              <h1>Admin dashboard</h1>
              <p>Manage the menu, staff, customer orders and feedback.</p>
            </div>
          </div>
          <Notice error={params.error} message={params.message} />
          <div className="dashboard-stats">
            <div><span>Customer accounts</span><strong>{customerCount[0]?.total ?? 0}</strong></div>
            <div><span>Orders received</span><strong>{orders.length}</strong></div>
            <div><span>Menu items</span><strong>{menuItemList.length}</strong></div>
            <div><span>Ratings to review</span><strong>{ratingList.filter((rating) => !rating.published).length}</strong></div>
          </div>

          <section className="dashboard-section">
            <div className="dashboard-section-title">
              <div><span className="eyebrow">MENU EDITOR</span><h2>Menu and prices</h2></div>
            </div>
            <form action={createMenuItemAction} className="dashboard-form dashboard-form-grid">
              <label>Dish name<input maxLength={100} name="name" required /></label>
              <label>Category
                <select name="category" required>{menuCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
              </label>
              <label>Description<input maxLength={300} name="description" required /></label>
              <label>Price (KSh)<input min={1} name="price" required type="number" /></label>
              <label className="field-wide">Image URL<input name="image" required type="url" placeholder="https://..." /></label>
              <button className="button button-green" type="submit">Add menu item</button>
            </form>
            <div className="dashboard-menu-list">
              {menuItemList.map((item) => (
                <details className="dashboard-item-editor" key={item.id}>
                  <summary>
                    <span>{item.name} <small>{item.category}</small></span>
                    <b>{currency(item.price)}</b>
                  </summary>
                  <form action={updateMenuItemAction} className="dashboard-form dashboard-form-grid">
                    <input name="id" type="hidden" value={item.id} />
                    <label>Dish name<input defaultValue={item.name} maxLength={100} name="name" required /></label>
                    <label>Category
                      <select defaultValue={item.category} name="category" required>{menuCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
                    </label>
                    <label>Description<input defaultValue={item.description} maxLength={300} name="description" required /></label>
                    <label>Price (KSh)<input defaultValue={item.price} min={1} name="price" required type="number" /></label>
                    <label className="field-wide">Image URL<input defaultValue={item.image} name="image" required type="url" /></label>
                    <label>Featured
                      <select defaultValue={String(item.featured)} name="featured">
                        <option value="false">No</option><option value="true">Yes</option>
                      </select>
                    </label>
                    <label>Availability
                      <select defaultValue={String(item.available)} name="available">
                        <option value="true">Available</option><option value="false">Unavailable</option>
                      </select>
                    </label>
                    <button className="button button-green" type="submit">Save menu item</button>
                  </form>
                </details>
              ))}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-title">
              <div><span className="eyebrow">TEAM ACCESS</span><h2>Employees</h2></div>
            </div>
            <form action={createEmployeeAction} className="dashboard-form dashboard-form-grid">
              <label>Employee name<input maxLength={80} name="name" required /></label>
              <label>Employee email<input name="email" required type="email" /></label>
              <label>Temporary password<input minLength={12} name="password" required type="password" /></label>
              <button className="button button-green" type="submit">Create employee account</button>
            </form>
            <p className="dashboard-help">Use a unique temporary password of at least 12 characters and share it with the employee securely.</p>
            <h3>Promote an existing account</h3>
            <form action={promoteUserAction} className="dashboard-form dashboard-form-grid">
              <label>Account email<input autoComplete="email" name="email" required type="email" /></label>
              <label>Promote to
                <select defaultValue="EMPLOYEE" name="role" required>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
              <button className="button button-outline" type="submit">Promote account</button>
            </form>
            <p className="dashboard-help">Customers can be promoted to employee, and employees can be promoted to admin. This form does not demote accounts.</p>
            <h3>Current employees</h3>
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead><tr><th>Name</th><th>Email</th><th>Added</th></tr></thead>
                <tbody>{employees.map((employee) => (
                  <tr key={employee.id}><td>{employee.name}</td><td>{employee.email}</td><td>{employee.createdAt.toLocaleDateString()}</td></tr>
                ))}</tbody>
              </table>
              {employees.length === 0 && <p className="dashboard-empty">No employee accounts yet.</p>}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-title">
              <div><span className="eyebrow">CUSTOMER FEEDBACK</span><h2>Ratings moderation</h2></div>
            </div>
            <div className="dashboard-table-wrap">
              {ratingList.map((rating) => (
                <article className="dashboard-feedback" key={rating.id}>
                  <div><strong>{rating.user.name}</strong><span className="feedback-stars">{"★".repeat(rating.stars)}{"☆".repeat(5 - rating.stars)}</span>
                    <small>{rating.user.email} · {rating.createdAt.toLocaleDateString()}</small>
                    {rating.comment && <p>{rating.comment}</p>}
                  </div>
                  <form action={moderateRatingAction}>
                    <input name="id" type="hidden" value={rating.id} />
                    <input name="published" type="hidden" value={String(!rating.published)} />
                    <button className="button button-outline" type="submit">{rating.published ? "Unpublish" : "Approve for website"}</button>
                  </form>
                </article>
              ))}
              {ratingList.length === 0 && <p className="dashboard-empty">No customer ratings have been submitted.</p>}
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section-title">
              <div><span className="eyebrow">ALL ACTIVITY</span><h2>Recent orders</h2></div>
            </div>
            <OrderList orders={orders} />
          </section>
        </div>
      </main>
    );
  }

  if (user.role === UserRole.EMPLOYEE) {
    const [orders, menuItemList] = await Promise.all([
      loadOrders(),
      getDb().query.menuItems.findMany({
        orderBy: [menuItemsTable.category, menuItemsTable.name],
      }),
    ]);
    return (
      <main className="dashboard-page">
        <DashboardHeader name={user.name} role={user.role} />
        <div className="dashboard-content">
          <div className="dashboard-title-row"><div><span className="eyebrow">TEAM WORKSPACE</span><h1>Employee dashboard</h1><p>Keep orders moving and let customers know what is available.</p></div></div>
          <Notice error={params.error} message={params.message} />
          <section className="dashboard-section">
            <div className="dashboard-section-title"><div><span className="eyebrow">KITCHEN & SERVICE</span><h2>Incoming orders</h2></div></div>
            <OrderList orders={orders} />
          </section>
          <section className="dashboard-section">
            <div className="dashboard-section-title"><div><span className="eyebrow">LIVE MENU</span><h2>Dish availability</h2></div></div>
            <div className="availability-grid">
              {menuItemList.map((item) => (
                <form action={updateAvailabilityAction} className="availability-item" key={item.id}>
                  <input name="id" type="hidden" value={item.id} />
                  <span><strong>{item.name}</strong><small>{item.category}</small></span>
                  <select aria-label={`${item.name} availability`} defaultValue={String(item.available)} name="available">
                    <option value="true">Available</option><option value="false">Unavailable</option>
                  </select>
                  <button className="button button-outline" type="submit">Update</button>
                </form>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  const db = getDb();
  const [menuList, customerOrders, customerRatings] = await Promise.all([
    db.query.menuItems.findMany({
      where: eq(menuItemsTable.available, true),
      orderBy: [desc(menuItemsTable.featured), menuItemsTable.name],
    }),
    loadOrders(user.id),
    db.query.ratings.findMany({
      where: eq(ratingsTable.userId, user.id),
      orderBy: desc(ratingsTable.createdAt),
      limit: 10,
    }),
  ]);
  return (
    <main className="dashboard-page">
      <DashboardHeader name={user.name} role={user.role} />
      <div className="dashboard-content">
        <div className="dashboard-title-row"><div><span className="eyebrow">YOUR SAHANI ACCOUNT</span><h1>Client dashboard</h1><p>Place an order, follow its progress and share your feedback.</p></div></div>
        <Notice error={params.error} message={params.message} />
        <section className="dashboard-section">
          <div className="dashboard-section-title"><div><span className="eyebrow">AVAILABLE TODAY</span><h2>Delicacies on the menu</h2></div></div>
          {menuList.length ? (
            <div className="menu-grid dashboard-menu-grid">
              {menuList.map((item) => (
                <article className="dish-card" key={item.id}>
                  <div className="dish-image">
                    <Image
                      alt={item.name}
                      className="dish-photo"
                      fill
                      sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 33vw"
                      src={item.image}
                    />
                    {item.featured && <span className="dish-tag">CUSTOMER FAVOURITE</span>}
                  </div>
                  <div className="dish-content">
                    <div className="dish-heading">
                      <h3>{item.name}</h3>
                      <span className="dish-price">{currency(item.price)}</span>
                    </div>
                    <p>{item.description}</p>
                    <div className="dish-card-bottom">
                      <span className="availability">{item.category}</span>
                      <Link
                        className="button button-outline"
                        href={`/dashboard?dish=${encodeURIComponent(item.id)}#place-order`}
                      >
                        Order this
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="dashboard-empty">No menu dishes are currently available.</p>}
        </section>
        <section className="dashboard-section" id="place-order">
          <div className="dashboard-section-title"><div><span className="eyebrow">ORDER SOMETHING GOOD</span><h2>Build your order</h2></div></div>
          {menuList.length ? (
            <form action={placeOrderAction} className="dashboard-form dashboard-form-grid">
              {[0, 1, 2, 3].map((slot) => (
                <div className="order-item-fields" key={slot}>
                  <label>{slot === 0 ? "Dish" : `Additional dish ${slot + 1}`}
                    <select defaultValue={slot === 0 && menuList.some((item) => item.id === params.dish) ? params.dish : ""} name="menuItemId" required={slot === 0}>
                      {slot > 0 && <option value="">No additional dish</option>}
                      {menuList.map((item) => <option key={item.id} value={item.id}>{item.name} — {currency(item.price)}</option>)}
                    </select>
                  </label>
                  <label>Quantity
                    <input defaultValue={1} max={30} min={1} name="quantity" required={slot === 0} type="number" />
                  </label>
                </div>
              ))}
              <label>Dining option
                <select name="serviceType" required>
                  <option value="TAKEAWAY">Takeaway</option>
                  <option value="DINE_IN">Dine in</option>
                  <option value="DELIVERY">Delivery (confirm area)</option>
                </select>
              </label>
              <label className="field-wide">Order notes <span>(optional)</span><textarea maxLength={500} name="notes" rows={2} /></label>
              <button className="button button-green" type="submit">Place order enquiry</button>
              <p className="dashboard-help field-wide">Add up to four dishes. The restaurant will confirm availability, final price and service details. No online payment is taken.</p>
            </form>
          ) : <p className="dashboard-empty">No menu dishes are currently available to order.</p>}
        </section>
        <section className="dashboard-section">
          <div className="dashboard-section-title"><div><span className="eyebrow">YOUR DETAILS</span><h2>Profile</h2></div></div>
          <form action={updateProfileAction} className="dashboard-form profile-form">
            <label>Name<input defaultValue={user.name} maxLength={80} name="name" required /></label>
            <label>Email<input defaultValue={user.email} disabled type="email" /></label>
            <label>Phone<input defaultValue={user.phone ?? ""} maxLength={30} name="phone" type="tel" /></label>
            <button className="button button-outline" type="submit">Save profile</button>
          </form>
        </section>
        <section className="dashboard-section">
          <div className="dashboard-section-title"><div><span className="eyebrow">YOUR FEEDBACK</span><h2>Leave a rating</h2></div></div>
          <form action={submitRatingAction} className="dashboard-form rating-dashboard-form">
            <label>Star rating
              <select defaultValue="" name="stars" required>
                <option disabled value="">Choose a rating</option>
                <option value="5">★★★★★ — Excellent</option><option value="4">★★★★☆ — Good</option>
                <option value="3">★★★☆☆ — Okay</option><option value="2">★★☆☆☆ — Could improve</option>
                <option value="1">★☆☆☆☆ — Not good</option>
              </select>
            </label>
            <label>Comment <span>(optional)</span><textarea maxLength={1000} name="comment" rows={3} /></label>
            <button className="button button-green" type="submit">Submit rating for review</button>
          </form>
          <p className="dashboard-help">Ratings are private until an administrator reviews and approves them for the public website.</p>
          {customerRatings.length > 0 && <div className="dashboard-feedback-list">{customerRatings.map((rating) => (
            <article className="dashboard-feedback" key={rating.id}><div><span className="feedback-stars">{"★".repeat(rating.stars)}{"☆".repeat(5 - rating.stars)}</span><small>{rating.createdAt.toLocaleDateString()} · {rating.published ? "Published" : "Awaiting review"}</small>{rating.comment && <p>{rating.comment}</p>}</div></article>
          ))}</div>}
        </section>
        <section className="dashboard-section">
          <div className="dashboard-section-title"><div><span className="eyebrow">ORDER HISTORY</span><h2>Your orders</h2></div></div>
          <OrderList orders={customerOrders} />
        </section>
      </div>
    </main>
  );
}

function OrderList({
  orders: orderRows,
}: {
  orders: Awaited<ReturnType<typeof loadOrders>>;
}) {
  if (orderRows.length === 0) return <p className="dashboard-empty">No orders yet.</p>;
  return (
    <div className="dashboard-order-list">
      {orderRows.map((order) => (
        <article className="dashboard-order" key={order.id}>
          <div className="order-heading">
            <div><strong>Order {order.id.slice(-8).toUpperCase()}</strong><small>{order.createdAt.toLocaleString()}</small></div>
            <span className={`order-status status-${order.status.toLowerCase()}`}>{statusLabel(order.status)}</span>
          </div>
          {order.user && <p className="order-customer">{order.user.name} · {order.user.email}{order.user.phone ? ` · ${order.user.phone}` : ""}</p>}
          <ul>{order.items.map((item, index) => <li key={`${order.id}-${index}`}>{item.quantity} × {item.name} <span>{currency(item.unitPrice * item.quantity)}</span></li>)}</ul>
          <div className="order-footer"><span>{statusLabel(order.serviceType)}{order.notes ? ` · ${order.notes}` : ""}</span><strong>{currency(order.total)}</strong></div>
          <form action={updateOrderStatusAction} className="order-status-form">
            <input name="id" type="hidden" value={order.id} />
            <label>Update status
              <select defaultValue={order.status} name="status">
                  {orderStatusValues.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
              </select>
            </label>
            <button className="button button-outline" type="submit">Save status</button>
          </form>
        </article>
      ))}
    </div>
  );
}
