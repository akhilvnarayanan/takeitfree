import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

export type ItemCategory =
  | "electronics"
  | "furniture"
  | "clothing"
  | "books"
  | "kitchen"
  | "toys"
  | "sports"
  | "garden"
  | "vehicles"
  | "other";

export type ItemCondition = "new" | "used_good" | "used_fair" | "needs_repair";
export type ItemStatus = "available" | "reserved" | "given_away";
export type RequestStatus = "pending" | "accepted" | "rejected";

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  electronics: "Electronics",
  furniture: "Furniture",
  clothing: "Clothing",
  books: "Books",
  kitchen: "Kitchen",
  toys: "Toys & Games",
  sports: "Sports",
  garden: "Garden",
  vehicles: "Vehicles",
  other: "Other",
};

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  new: "New",
  used_good: "Used - Good",
  used_fair: "Used - Fair",
  needs_repair: "Needs Repair",
};

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  profilePhoto: string | null;
  location: string;
  reputationScore: number;
  itemsGivenCount: number;
  itemsReceivedCount: number;
  blockedUsers: string[];
  createdAt: string;
}

export interface Item {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: ItemCategory;
  condition: ItemCondition;
  images: string[];
  pickupArea: string;
  status: ItemStatus;
  createdAt: string;
}

export interface ItemRequest {
  id: string;
  itemId: string;
  requesterId: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  requestId: string;
  senderId: string;
  message: string;
  isSystem: boolean;
  timestamp: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: "user" | "item";
  targetId: string;
  reason: string;
  createdAt: string;
}

const KEYS = {
  USERS: "tif_users",
  CURRENT_USER: "tif_current_user",
  ITEMS: "tif_items",
  REQUESTS: "tif_requests",
  MESSAGES: "tif_messages",
  REPORTS: "tif_reports",
};

async function getAll<T>(key: string): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  return JSON.parse(raw) as T[];
}

async function setAll<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export async function register(
  name: string,
  email: string,
  password: string,
  location: string
): Promise<User> {
  const users = await getAll<User>(KEYS.USERS);
  const exists = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );
  if (exists) throw new Error("An account with this email already exists");

  const user: User = {
    id: Crypto.randomUUID(),
    name,
    email: email.toLowerCase(),
    password,
    profilePhoto: null,
    location,
    reputationScore: 0,
    itemsGivenCount: 0,
    itemsReceivedCount: 0,
    blockedUsers: [],
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await setAll(KEYS.USERS, users);
  await AsyncStorage.setItem(KEYS.CURRENT_USER, user.id);
  return user;
}

export async function login(email: string, password: string): Promise<User> {
  const users = await getAll<User>(KEYS.USERS);
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) throw new Error("Invalid email or password");
  await AsyncStorage.setItem(KEYS.CURRENT_USER, user.id);
  return user;
}

export async function logout(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.CURRENT_USER);
}

export async function getCurrentUser(): Promise<User | null> {
  const userId = await AsyncStorage.getItem(KEYS.CURRENT_USER);
  if (!userId) return null;
  const users = await getAll<User>(KEYS.USERS);
  return users.find((u) => u.id === userId) || null;
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await getAll<User>(KEYS.USERS);
  return users.find((u) => u.id === id) || null;
}

export async function updateUser(
  userId: string,
  updates: Partial<Pick<User, "name" | "location" | "profilePhoto">>
): Promise<User> {
  const users = await getAll<User>(KEYS.USERS);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("User not found");
  users[idx] = { ...users[idx], ...updates };
  await setAll(KEYS.USERS, users);
  return users[idx];
}

export async function blockUser(userId: string, targetId: string): Promise<void> {
  const users = await getAll<User>(KEYS.USERS);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  if (!users[idx].blockedUsers.includes(targetId)) {
    users[idx].blockedUsers.push(targetId);
    await setAll(KEYS.USERS, users);
  }
}

export async function unblockUser(userId: string, targetId: string): Promise<void> {
  const users = await getAll<User>(KEYS.USERS);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  users[idx].blockedUsers = users[idx].blockedUsers.filter((id) => id !== targetId);
  await setAll(KEYS.USERS, users);
}

export async function createItem(
  item: Omit<Item, "id" | "status" | "createdAt">
): Promise<Item> {
  const items = await getAll<Item>(KEYS.ITEMS);
  const newItem: Item = {
    ...item,
    id: Crypto.randomUUID(),
    status: "available",
    createdAt: new Date().toISOString(),
  };
  items.push(newItem);
  await setAll(KEYS.ITEMS, items);
  return newItem;
}

export async function updateItem(
  itemId: string,
  updates: Partial<Pick<Item, "title" | "description" | "category" | "condition" | "images" | "pickupArea" | "status">>
): Promise<Item> {
  const items = await getAll<Item>(KEYS.ITEMS);
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx === -1) throw new Error("Item not found");
  items[idx] = { ...items[idx], ...updates };
  await setAll(KEYS.ITEMS, items);
  return items[idx];
}

export async function deleteItem(itemId: string): Promise<void> {
  const items = await getAll<Item>(KEYS.ITEMS);
  await setAll(
    KEYS.ITEMS,
    items.filter((i) => i.id !== itemId)
  );
}

export async function getItems(filters?: {
  category?: ItemCategory;
  search?: string;
  userId?: string;
  status?: ItemStatus;
}): Promise<Item[]> {
  let items = await getAll<Item>(KEYS.ITEMS);
  items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (filters?.status) {
    items = items.filter((i) => i.status === filters.status);
  }
  if (filters?.category) {
    items = items.filter((i) => i.category === filters.category);
  }
  if (filters?.userId) {
    items = items.filter((i) => i.userId === filters.userId);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
    );
  }
  return items;
}

export async function getItemById(itemId: string): Promise<Item | null> {
  const items = await getAll<Item>(KEYS.ITEMS);
  return items.find((i) => i.id === itemId) || null;
}

export async function createRequest(
  itemId: string,
  requesterId: string,
  message: string
): Promise<ItemRequest> {
  const requests = await getAll<ItemRequest>(KEYS.REQUESTS);
  const existing = requests.find(
    (r) => r.itemId === itemId && r.requesterId === requesterId && r.status === "pending"
  );
  if (existing) throw new Error("You already have a pending request for this item");

  const req: ItemRequest = {
    id: Crypto.randomUUID(),
    itemId,
    requesterId,
    message,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  requests.push(req);
  await setAll(KEYS.REQUESTS, requests);
  return req;
}

export async function getRequestsForItem(itemId: string): Promise<ItemRequest[]> {
  const requests = await getAll<ItemRequest>(KEYS.REQUESTS);
  return requests
    .filter((r) => r.itemId === itemId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getRequestsForUser(userId: string): Promise<ItemRequest[]> {
  const requests = await getAll<ItemRequest>(KEYS.REQUESTS);
  return requests
    .filter((r) => r.requesterId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getRequestById(requestId: string): Promise<ItemRequest | null> {
  const requests = await getAll<ItemRequest>(KEYS.REQUESTS);
  return requests.find((r) => r.id === requestId) || null;
}

export async function acceptRequest(requestId: string): Promise<void> {
  const requests = await getAll<ItemRequest>(KEYS.REQUESTS);
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) return;
  const itemId = requests[idx].itemId;

  requests[idx].status = "accepted";
  requests.forEach((r, i) => {
    if (r.itemId === itemId && r.id !== requestId && r.status === "pending") {
      requests[i].status = "rejected";
    }
  });
  await setAll(KEYS.REQUESTS, requests);

  const items = await getAll<Item>(KEYS.ITEMS);
  const itemIdx = items.findIndex((i) => i.id === itemId);
  if (itemIdx !== -1) {
    items[itemIdx].status = "reserved";
    await setAll(KEYS.ITEMS, items);
  }

  await addSystemMessage(
    requestId,
    "Request accepted! You can now chat to arrange pickup."
  );
}

export async function rejectRequest(requestId: string): Promise<void> {
  const requests = await getAll<ItemRequest>(KEYS.REQUESTS);
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) return;
  requests[idx].status = "rejected";
  await setAll(KEYS.REQUESTS, requests);
}

export async function markItemGiven(itemId: string): Promise<void> {
  const items = await getAll<Item>(KEYS.ITEMS);
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx === -1) return;
  items[idx].status = "given_away";
  await setAll(KEYS.ITEMS, items);

  const users = await getAll<User>(KEYS.USERS);
  const giverIdx = users.findIndex((u) => u.id === items[idx].userId);
  if (giverIdx !== -1) {
    users[giverIdx].itemsGivenCount += 1;
    users[giverIdx].reputationScore += 1;
  }

  const requests = await getAll<ItemRequest>(KEYS.REQUESTS);
  const accepted = requests.find(
    (r) => r.itemId === itemId && r.status === "accepted"
  );
  if (accepted) {
    const receiverIdx = users.findIndex((u) => u.id === accepted.requesterId);
    if (receiverIdx !== -1) {
      users[receiverIdx].itemsReceivedCount += 1;
      users[receiverIdx].reputationScore += 1;
    }
    await addSystemMessage(accepted.id, "Item has been marked as given away. Thank you!");
  }
  await setAll(KEYS.USERS, users);
}

export async function getChatMessages(requestId: string): Promise<ChatMessage[]> {
  const messages = await getAll<ChatMessage>(KEYS.MESSAGES);
  return messages
    .filter((m) => m.requestId === requestId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export async function sendMessage(
  requestId: string,
  senderId: string,
  message: string
): Promise<ChatMessage> {
  const messages = await getAll<ChatMessage>(KEYS.MESSAGES);
  const msg: ChatMessage = {
    id: Crypto.randomUUID(),
    requestId,
    senderId,
    message,
    isSystem: false,
    timestamp: new Date().toISOString(),
  };
  messages.push(msg);
  await setAll(KEYS.MESSAGES, messages);
  return msg;
}

async function addSystemMessage(requestId: string, message: string): Promise<void> {
  const messages = await getAll<ChatMessage>(KEYS.MESSAGES);
  messages.push({
    id: Crypto.randomUUID(),
    requestId,
    senderId: "system",
    message,
    isSystem: true,
    timestamp: new Date().toISOString(),
  });
  await setAll(KEYS.MESSAGES, messages);
}

export async function getConversations(userId: string): Promise<
  {
    request: ItemRequest;
    item: Item;
    otherUser: User;
    lastMessage: ChatMessage | null;
    unread: boolean;
  }[]
> {
  const requests = await getAll<ItemRequest>(KEYS.REQUESTS);
  const items = await getAll<Item>(KEYS.ITEMS);
  const users = await getAll<User>(KEYS.USERS);
  const messages = await getAll<ChatMessage>(KEYS.MESSAGES);

  const myRequests = requests.filter(
    (r) =>
      r.status === "accepted" &&
      (r.requesterId === userId ||
        items.find((i) => i.id === r.itemId)?.userId === userId)
  );

  return myRequests
    .map((req) => {
      const item = items.find((i) => i.id === req.itemId);
      if (!item) return null;
      const otherUserId =
        req.requesterId === userId ? item.userId : req.requesterId;
      const otherUser = users.find((u) => u.id === otherUserId);
      if (!otherUser) return null;

      const reqMessages = messages
        .filter((m) => m.requestId === req.id)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

      return {
        request: req,
        item,
        otherUser,
        lastMessage: reqMessages[0] || null,
        unread: false,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aTime = a!.lastMessage?.timestamp || a!.request.createdAt;
      const bTime = b!.lastMessage?.timestamp || b!.request.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    }) as any[];
}

export async function reportItem(
  reporterId: string,
  targetType: "user" | "item",
  targetId: string,
  reason: string
): Promise<void> {
  const reports = await getAll<Report>(KEYS.REPORTS);
  reports.push({
    id: Crypto.randomUUID(),
    reporterId,
    targetType,
    targetId,
    reason,
    createdAt: new Date().toISOString(),
  });
  await setAll(KEYS.REPORTS, reports);
}

export async function seedData(): Promise<void> {
  const items = await getAll<Item>(KEYS.ITEMS);
  if (items.length > 0) return;

  const users = await getAll<User>(KEYS.USERS);

  const seedUsers: User[] = [
    {
      id: "seed-user-1",
      name: "Maria Chen",
      email: "maria@example.com",
      password: "demo",
      profilePhoto: null,
      location: "Downtown",
      reputationScore: 8,
      itemsGivenCount: 5,
      itemsReceivedCount: 3,
      blockedUsers: [],
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: "seed-user-2",
      name: "Jake Thompson",
      email: "jake@example.com",
      password: "demo",
      profilePhoto: null,
      location: "Midtown",
      reputationScore: 4,
      itemsGivenCount: 2,
      itemsReceivedCount: 2,
      blockedUsers: [],
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
    {
      id: "seed-user-3",
      name: "Sarah Williams",
      email: "sarah@example.com",
      password: "demo",
      profilePhoto: null,
      location: "Westside",
      reputationScore: 12,
      itemsGivenCount: 8,
      itemsReceivedCount: 4,
      blockedUsers: [],
      createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    },
  ];

  const now = Date.now();
  const seedItems: Item[] = [
    {
      id: "seed-item-1",
      userId: "seed-user-1",
      title: "IKEA Kallax Bookshelf",
      description:
        "White IKEA Kallax bookshelf, 4x2 compartments. Some minor scratches but structurally perfect. Moving out and can't take it with me. Pick up anytime this weekend.",
      category: "furniture",
      condition: "used_good",
      images: [],
      pickupArea: "Downtown, near Central Park",
      status: "available",
      createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "seed-item-2",
      userId: "seed-user-2",
      title: "Kids Bicycle (Age 6-9)",
      description:
        "Blue kids bicycle, suitable for ages 6-9. Training wheels included. My kid outgrew it. Tires might need some air but otherwise great condition.",
      category: "sports",
      condition: "used_good",
      images: [],
      pickupArea: "Midtown, near the school",
      status: "available",
      createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: "seed-item-3",
      userId: "seed-user-3",
      title: "Box of Novels (20+ books)",
      description:
        "Mixed fiction collection - thriller, romance, sci-fi. All in readable condition. Take the whole box or pick what you want. Great for book lovers!",
      category: "books",
      condition: "used_fair",
      images: [],
      pickupArea: "Westside, Oak Avenue",
      status: "available",
      createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: "seed-item-4",
      userId: "seed-user-1",
      title: "Samsung 27\" Monitor",
      description:
        "Samsung 27 inch LED monitor. Works perfectly, just upgraded to a bigger one. Comes with power cable, no HDMI cable.",
      category: "electronics",
      condition: "used_good",
      images: [],
      pickupArea: "Downtown, 5th Street",
      status: "available",
      createdAt: new Date(now - 1000 * 60 * 60 * 8).toISOString(),
    },
    {
      id: "seed-item-5",
      userId: "seed-user-3",
      title: "Vintage Record Player",
      description:
        "Beautiful vintage record player from the 70s. Needs a new needle but otherwise works perfectly. A real collector's piece. First come first served.",
      category: "electronics",
      condition: "needs_repair",
      images: [],
      pickupArea: "Westside, near Elm Park",
      status: "available",
      createdAt: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: "seed-item-6",
      userId: "seed-user-2",
      title: "Kitchen Utensil Set",
      description:
        "Complete kitchen utensil set - spatulas, ladles, tongs, etc. About 15 pieces total. Mostly stainless steel. Moving to a furnished apartment.",
      category: "kitchen",
      condition: "used_good",
      images: [],
      pickupArea: "Midtown, River Road",
      status: "available",
      createdAt: new Date(now - 1000 * 60 * 60 * 36).toISOString(),
    },
    {
      id: "seed-item-7",
      userId: "seed-user-3",
      title: "Women's Winter Jacket (M)",
      description:
        "North Face winter jacket, size Medium. Black color. Worn for one season, still in great shape. Very warm and comfortable.",
      category: "clothing",
      condition: "used_good",
      images: [],
      pickupArea: "Westside, near the mall",
      status: "available",
      createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
    },
  ];

  const allUsers = [...users, ...seedUsers.filter((su) => !users.find((u) => u.id === su.id))];
  await setAll(KEYS.USERS, allUsers);
  await setAll(KEYS.ITEMS, seedItems);
}
